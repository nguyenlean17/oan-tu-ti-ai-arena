import assert from 'node:assert/strict';
import {mock} from 'node:test';
const calls=[],used=new Set(),valid='a'.repeat(64),expired='b'.repeat(64);
mock.module('../lib/account-mail.mjs',{namedExports:{sendAccountLink:async()=>{},redeemAccountToken:async(token,kind)=>{
 calls.push({token,kind});
 if(token!==valid||used.has(token))throw Object.assign(Error('Liên kết đã dùng, hết hạn hoặc không hợp lệ.'),{status:400});
 used.add(token);
}}});
const {accountLinkHandler}=await import('../lib/account-link-handler.mjs');
const origin='https://arena.example.test',before=process.env.PUBLIC_ORIGIN;process.env.PUBLIC_ORIGIN=origin;
try{
 const response=await accountLinkHandler(new Request(origin+'/verify-email?token='+valid),'verify-email');
 assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('Email đã được xác nhận'));assert.ok(!html.includes('<form'));assert.deepEqual(calls,[{token:valid,kind:'verify'}]);
 for(const token of [valid,expired,'', 'invalid']){
  const r=await accountLinkHandler(new Request(origin+'/verify-email?token='+token),'verify-email');assert.equal(r.status,400);assert.ok(!(await r.text()).includes('<form'));
 }
 const count=calls.length;
 const reset=await accountLinkHandler(new Request(origin+'/reset-password?token='+valid),'reset-password');assert.equal(reset.status,200);assert.ok((await reset.text()).includes('name="password"'));assert.equal(calls.length,count,'Opening reset link must not consume the token');
 const forged=await accountLinkHandler(new Request(origin+'/reset-password',{method:'POST',headers:{Origin:'https://other.example.test','Content-Type':'application/x-www-form-urlencoded'},body:'token='+valid}),'reset-password');assert.equal(forged.status,403);assert.equal(calls.length,count);
 console.log('Email link passed: one-click confirmation, no second form, consumed/expired/invalid failures, reset GET unchanged, cross-origin reset denied.');
}finally{if(before===undefined)delete process.env.PUBLIC_ORIGIN;else process.env.PUBLIC_ORIGIN=before;mock.restoreAll();}
