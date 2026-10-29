import {database} from './postgres.mjs';
import {sessionUser,authenticate,passwordRecord,consumeAttempt} from './vercel-auth-store.mjs';
import {sendAccountLink} from './account-mail.mjs';
import {withCompetition} from '../competition/postgres.mjs';
import {demoSelfService,demoOpenEntry} from './demo-policy.mjs';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export async function portalHandler(request){
 const send=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 try{
  const url=new URL(request.url),token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('arena_session='))?.slice(14),user=await sessionUser(token);
  if(!user)fail('Đăng nhập để tiếp tục.',401);
  const db=database();
  if(request.method==='GET'){
   const q=(url.searchParams.get('q')||'').slice(0,80);
   const teams=await withCompetition(async c=>{
    const own=await c.prepare("SELECT t.id,t.name,t.event,e.name event_name,e.status FROM members m JOIN teams t ON t.id=m.team JOIN events e ON e.id=t.event WHERE m.user=? AND e.status<>'archived' ORDER BY e.created DESC").all(user.id);
    for(const team of own)team.members=await c.prepare('SELECT m.student,u.name,u.email FROM members m JOIN public.auth_users u ON u.id=m.user WHERE m.team=? ORDER BY m.student').all(team.id);
    return own;
   });
   const accounts=user.is_admin?(await db.query('SELECT id,name,email,is_admin,verified,disabled FROM auth_users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY created DESC LIMIT 100',['%'+q+'%'])).rows:[];
   return send(200,{user,teams,accounts,canCreateTournaments:!!user.is_admin||demoSelfService(),demoSelfService:demoSelfService(),openEnrollmentDemo:demoOpenEntry(),verificationRequired:process.env.REQUIRE_EMAIL_VERIFICATION==='1',mailDemo:process.env.MAIL_PROVIDER!=='resend'&&process.env.ARENA_LOAD_DEMO==='1'&&!!process.env.MAILPIT_URL});
  }
  if(request.method!=='POST')fail('Method not allowed',405);
  if(request.headers.get('origin')!==(process.env.PUBLIC_ORIGIN||url.origin)||request.headers.get('sec-fetch-site')==='cross-site')fail('Yêu cầu không hợp lệ.',403);
  if(!(request.headers.get('content-type')||'').startsWith('application/json'))fail('Cần JSON.',415);
  const reader=request.body?.getReader();let chunks=[],size=0;if(reader)for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>8192){await reader.cancel();fail('Dữ liệu quá lớn.',413);}chunks.push(r.value);}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('JSON không hợp lệ.');}if(!body||typeof body!=='object')fail('JSON không hợp lệ.');
  if(body.action==='profile'){
   const name=typeof body.name==='string'?body.name.trim():'';if(name.length<2||name.length>60)fail('Tên cần 2–60 ký tự.');
   await db.query('UPDATE auth_users SET name=$1 WHERE id=$2',[name,user.id]);return send(200,{message:'Đã lưu hồ sơ.'});
  }
  if(body.action==='verify'){
   if(user.verified)return send(200,{message:'Email đã được xác nhận.'});
   if(!await consumeAttempt('verification',user.email))fail('Đợi 15 phút trước khi gửi thêm thư.',429);
   await sendAccountLink(user,'verify');return send(200,{message:'Đã gửi liên kết xác nhận. Kiểm tra hộp thư của bạn.'});
  }
  if(body.action==='password'){
   if(!await consumeAttempt('password-change',user.email))fail('Thử lại sau 15 phút.',429);
   if(typeof body.current!=='string'||body.current.length>128||!await authenticate(user.email,body.current))fail('Mật khẩu hiện tại chưa đúng.',403);
   if(body.password!==body.confirm)fail('Hai mật khẩu mới phải khớp.');const p=await passwordRecord(body.password);
   await db.query('WITH changed AS (UPDATE auth_users SET salt=$1,password_hash=$2 WHERE id=$3 RETURNING id) DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM changed)',[p.salt,p.passwordHash,user.id]);return send(200,{message:'Đã đổi mật khẩu. Hãy đăng nhập lại.',signIn:true});
  }
  if(body.action==='rename_team'){
   const name=typeof body.name==='string'?body.name.trim():'';if(name.length<2||name.length>80||typeof body.team!=='string')fail('Tên đội cần 2–80 ký tự.');
   await withCompetition(async c=>{const team=await c.prepare('SELECT t.id,t.event,e.status FROM teams t JOIN members m ON m.team=t.id JOIN events e ON e.id=t.event WHERE m.user=? AND t.id=?').get(user.id,body.team);if(!team)fail('Bạn không thuộc đội này.',403);if(!['draft','open'].includes(team.status))fail('Danh sách đội đã khóa.',409);await c.prepare('UPDATE teams SET name=? WHERE id=?').run(name,team.id);await c.prepare('INSERT INTO audit(event,actor,action,detail,created) VALUES(?,?,?,?,?)').run(team.event,user.id,'rename_team',JSON.stringify({team:team.id,name}),Date.now());},{write:true});return send(200,{message:'Đã đổi tên đội.'});
  }
  if(body.action==='disable'){
   if(!user.is_admin)fail('Chỉ BTC được quản lý tài khoản.',403);if(typeof body.id!=='string'||typeof body.disabled!=='boolean')fail('Tài khoản không hợp lệ.');
   const result=await db.query('WITH changed AS (UPDATE auth_users SET disabled=$1 WHERE id=$2 AND is_admin=0 AND id<>$3 RETURNING id) DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM changed) RETURNING user_id',[body.disabled?1:0,body.id,user.id]);
   // A user may have no sessions; confirm the target independently, never grant admin roles here.
   const target=await db.prepare('SELECT id FROM auth_users WHERE id=? AND is_admin=0 AND id<>?').bind(body.id,user.id).first();if(!target)fail('Không thể thay đổi tài khoản quản trị hoặc tài khoản này.',403);
   return send(200,{message:body.disabled?'Đã khóa tài khoản và thu hồi phiên đăng nhập.':'Đã mở khóa tài khoản.',revoked:result.rowCount});
  }
  fail('Thao tác không hợp lệ.');
 }catch(error){return send(error.status||(error.code==='23505'?409:503),{error:error.status?error.message:error.code==='23505'?'Tên đội đã được sử dụng.':'Chưa thể xử lý. Thử lại sau.'});}
}
