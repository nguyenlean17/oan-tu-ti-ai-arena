import {readFileSync} from 'node:fs';
import nodemailer from 'nodemailer';

export async function sendGmail({to,subject,text}) {
  try {
    const user=process.env.SMTP_USER;
    const pass=(process.env.SMTP_PASSWORD_FILE?readFileSync(process.env.SMTP_PASSWORD_FILE,'utf8'):process.env.SMTP_PASSWORD||'').replace(/\s/g,'');
    if(!user||!pass)throw Error('Missing Gmail configuration');
    const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user,pass},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
    try { await transport.sendMail({from:{name:'UET Arena',address:user},to,subject,text}); }
    finally { transport.close(); }
  } catch {
    throw Object.assign(new Error('Chưa gửi được email qua Gmail. BTC cần kiểm tra cấu hình và mật khẩu ứng dụng.'),{status:503});
  }
}
