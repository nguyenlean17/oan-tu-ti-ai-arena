import assert from 'node:assert/strict';
import {mock} from 'node:test';
import nodemailer from 'nodemailer';
import {sendGmail} from '../lib/gmail-mail.mjs';

const before={...process.env};let options,mail,closed=0,reject=false;
mock.method(nodemailer,'createTransport',o=>{options=o;return {sendMail:async m=>{mail=m;if(reject)throw Error('Secret server detail');},close:()=>closed++};});
try {
 delete process.env.SMTP_PASSWORD_FILE;delete process.env.SMTP_PASSWORD;process.env.SMTP_USER='sender@gmail.com';
 const message={to:'student@vnu.edu.vn',subject:'Xác nhận email',text:'https://example.test/verify-email?token=test'};
 await assert.rejects(()=>sendGmail(message),e=>e.status===503);
 process.env.SMTP_PASSWORD='abcd efgh ijkl mnop';await sendGmail(message);
 assert.equal(options.host,'smtp.gmail.com');assert.equal(options.port,465);assert.equal(options.secure,true);
 assert.equal(options.auth.pass,'abcdefghijklmnop');assert.equal(options.tls?.rejectUnauthorized,undefined);
 assert.deepEqual(mail,{...message,from:{name:'UET Arena',address:'sender@gmail.com'}});assert.equal(closed,1);
 reject=true;await assert.rejects(()=>sendGmail(message),e=>e.status===503&&!e.message.includes('Secret'));assert.equal(closed,2);
 console.log('Gmail mail passed: missing credentials, TLS, sender identity, unchanged account link, cleanup and safe errors.');
} finally {mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);}
