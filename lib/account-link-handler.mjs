import {randomBytes,timingSafeEqual} from 'node:crypto';
import {database} from './postgres.mjs';
import {consumeAttempt} from './vercel-auth-store.mjs';
import {sendAccountLink,redeemAccountToken} from './account-mail.mjs';
const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function accountLinkHandler(request,mode){
 const url=new URL(request.url),jar=Object.fromEntries((request.headers.get('cookie')||'').split(';').map(s=>s.trim().split(/=(.*)/s).slice(0,2))),csrf=randomBytes(32).toString('hex');
 const secure=new URL(process.env.PUBLIC_ORIGIN||url.origin).protocol==='https:'?'; Secure':'';
 const title=mode==='forgot-password'?'Quên mật khẩu':mode==='reset-password'?'Đặt mật khẩu mới':'Xác nhận email';
 const render=(message='',status=200,done=false)=>new Response(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · UET Arena</title><link rel="stylesheet" href="/fonts/be-vietnam-pro.css"><link rel="stylesheet" href="/auth.css?v=20261029-portal"><body><header><a class="brand" href="/student"><img src="/brand/uet.ico" width="38" height="38" alt="UET">UET Arena <span>VNU · UET</span></a></header><main><section class="intro"><h1>Tài khoản của bạn.<br>Hành trình thi đấu của bạn.</h1><p>Giữ email và tài khoản an toàn để nhận đội, nộp bot và theo dõi kết quả.</p></section><section class="form-side"><div class="form-wrap"><h2>${title}</h2><p role="status">${esc(message)}</p>${done?'':`<form method="post"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="token" value="${esc(url.searchParams.get('token'))}">${mode==='forgot-password'?'<label>Email<input name="email" type="email" required maxlength="254" autocomplete="email"></label>':mode==='reset-password'?'<label>Mật khẩu mới<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label><label>Nhập lại mật khẩu<input name="confirm" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label>':'<p>Nhấn xác nhận để chứng minh quyền truy cập hộp thư này.</p>'}<button>${mode==='forgot-password'?'Gửi liên kết đặt lại mật khẩu':title}</button></form>`}<p class="switch"><a href="/login?return_to=/student">Đăng nhập</a> · <a href="/student">Khu sinh viên</a></p></div></section></main></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Set-Cookie':`arena_link_csrf=${csrf}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800${secure}`,'Content-Security-Policy':"default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
 if(request.method==='GET')return render();
 try{
  if(request.headers.get('origin')!==(process.env.PUBLIC_ORIGIN||url.origin)||request.headers.get('sec-fetch-site')==='cross-site')return render('Yêu cầu không hợp lệ.',403);
  if(!(request.headers.get('content-type')||'').startsWith('application/x-www-form-urlencoded'))return render('Cần gửi biểu mẫu.',415);
  const reader=request.body?.getReader();let bytes=0,text='';if(reader)for(;;){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>4096){await reader.cancel();return render('Dữ liệu quá lớn.',413);}text+=Buffer.from(r.value).toString('utf8');}
  const form=new URLSearchParams(text),token=form.get('token'),sent=form.get('csrf')||'';
  if(!/^[a-f0-9]{64}$/.test(sent)||!/^[a-f0-9]{64}$/.test(jar.arena_link_csrf||'')||!timingSafeEqual(Buffer.from(sent),Buffer.from(jar.arena_link_csrf)))return render('Phiên nhập liệu đã hết hạn. Tải lại trang.',403);
  const email=(form.get('email')||'').trim().toLowerCase();
  if(!await consumeAttempt('account-links',mode==='forgot-password'?email:token||'missing'))return render('Bạn đã thử quá nhiều lần. Đợi 15 phút.',429);
  if(mode==='forgot-password'){
   const user=await database().prepare('SELECT id,email FROM auth_users WHERE email=? AND disabled=0').bind(email).first();
   if(user)await sendAccountLink(user,'reset').catch(()=>console.error('Account recovery mail unavailable'));
   return render('Nếu tài khoản tồn tại, thư hướng dẫn đã được gửi. Kiểm tra hộp thư và thư rác.',200,true);
  }
  if(mode==='reset-password'&&form.get('password')!==form.get('confirm'))return render('Hai mật khẩu phải khớp.',400);
  await redeemAccountToken(token,mode==='reset-password'?'reset':'verify',form.get('password'));
  return render(mode==='reset-password'?'Đã đổi mật khẩu và đăng xuất các phiên cũ. Hãy đăng nhập lại.':'Email đã được xác nhận. Quay lại khu sinh viên để nhận đội.',200,true);
 }catch(error){return render(error.status?error.message:'Chưa thể xử lý. Thử lại sau.',error.status||503);}
}
