import assert from 'node:assert/strict';

const base=process.env.OTT_TEST_URL||'http://127.0.0.1:5174';
if(!['127.0.0.1','localhost','::1'].includes(new URL(base).hostname))throw new Error('Sites identity checks are restricted to a local preview.');
const headers={
  'Content-Type':'application/json',
  Origin:base,
  'oai-authenticated-user-id':'forged-user',
  'oai-authenticated-user-email':'forged@example.test',
  'x-arena-user-id':'forged-user',
  'x-arena-user-email':'forged@example.test',
  'x-arena-admin':'1',
};
const get=await fetch(base+'/api/rooms',{headers});
assert.equal(get.status,401,await get.text());
const post=await fetch(base+'/api/rooms',{method:'POST',headers,body:JSON.stringify({action:'create'})});
assert.equal(post.status,401,await post.text());
for(const path of ['/signin-with-chatgpt','/signout-with-chatgpt','/login','/register']) {
  const response=await fetch(base+path,{redirect:'manual'});
  assert.equal(response.status,404,`${path} must not provide Sites authentication.`);
}
console.log('Sites checks passed: public runtime rejects legacy and forged identity headers and exposes no account sign-in routes.');
