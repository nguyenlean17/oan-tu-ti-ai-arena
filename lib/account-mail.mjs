import { randomBytes } from 'node:crypto';
import {readFileSync} from 'node:fs';
import { database } from './postgres.mjs';
import { digest,passwordRecord } from './vercel-auth-store.mjs';
import {sendGmail} from './gmail-mail.mjs';
export async function sendAccountLink(user,kind) {
  const token=randomBytes(32).toString('hex'),now=Date.now();
  await database().query('DELETE FROM auth_tokens WHERE expires<$1',[now]);
  await database().query('INSERT INTO auth_tokens(hash,user_id,kind,expires,created) VALUES($1,$2,$3,$4,$5)',[digest(token),user.id,kind,now+1800000,now]);
  const origin=process.env.PUBLIC_ORIGIN;
  if(!origin)throw new Error('PUBLIC_ORIGIN required for mail');
  const link=new URL('/'+(kind==='reset'?'reset-password':'verify-email'),origin);link.searchParams.set('token',token);
  const subject=kind==='reset'?'Đặt lại mật khẩu UET Arena':'Xác nhận email UET Arena';
  const text=`${subject}\n\nMở liên kết để tiếp tục:\n${link.href}\n\nLiên kết dùng một lần, hết hạn sau 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua thư này.`;
  if(process.env.MAIL_PROVIDER==='gmail')return sendGmail({to:user.email,subject,text});
  let response;
  if(process.env.MAIL_PROVIDER!=='resend'&&process.env.MAILPIT_URL&&process.env.ARENA_LOAD_DEMO==='1')response=await fetch(process.env.MAILPIT_URL+'/api/v1/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({From:{Email:'arena@example.test',Name:'UET Arena'},To:[{Email:user.email}],Subject:subject,Text:text}),signal:AbortSignal.timeout(10000)});
  else if((process.env.RESEND_API_KEY||process.env.RESEND_API_KEY_FILE)&&process.env.MAIL_FROM)response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY_FILE?readFileSync(process.env.RESEND_API_KEY_FILE,'utf8').trim():process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.MAIL_FROM,to:[user.email],subject,text,html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172c44"><p style="color:#034ea1;font-weight:bold">UET ARENA · VNU</p><h1>${subject}</h1><p>Mở liên kết bên dưới để tiếp tục với tài khoản của bạn.</p><p style="margin:32px 0"><a style="background:#034ea1;color:white;padding:14px 22px;border-radius:6px;text-decoration:none" href="${link.href}">${kind==='reset'?'Đặt mật khẩu mới':'Xác nhận email'}</a></p><p>Liên kết dùng một lần, hết hạn sau 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua thư này.</p></div>`}),signal:AbortSignal.timeout(10000)});
  else throw Object.assign(new Error('Dịch vụ gửi thư chưa được cấu hình.'),{status:503});
  if(!response.ok)throw Object.assign(new Error('Chưa gửi được email. Vui lòng thử lại sau.'),{status:503});
}
export async function redeemAccountToken(token,kind,password) {
  if(!/^[a-f0-9]{64}$/.test(token||''))throw Object.assign(new Error('Liên kết không hợp lệ hoặc đã hết hạn.'),{status:400});
  const record=kind==='reset'?await passwordRecord(password):null;
  const result=await database().query(`WITH consumed AS (DELETE FROM auth_tokens WHERE hash=$1 AND kind=$2 AND expires>$3 RETURNING user_id),changed AS (UPDATE auth_users SET ${kind==='reset'?'salt=$4,password_hash=$5':'verified=$4'} WHERE id IN (SELECT user_id FROM consumed) AND disabled=0 RETURNING id), revoked AS (DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM changed) AND $2='reset') SELECT id FROM changed`,kind==='reset'?[digest(token),kind,Date.now(),record.salt,record.passwordHash]:[digest(token),kind,Date.now(),Date.now()]);
  if(!result.rows.length)throw Object.assign(new Error('Liên kết đã dùng, hết hạn hoặc tài khoản bị khóa.'),{status:400});
}
