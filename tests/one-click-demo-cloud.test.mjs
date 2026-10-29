import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {CloudClient} from './cloud-client.mjs';
if(process.env.ARENA_ALLOW_CLOUD_SMOKE!=='1')throw Error('Explicit cloud demo opt-in required');
const fixture=JSON.parse(readFileSync('.secrets/demo-run.json','utf8')),handoff=JSON.parse(readFileSync('.secrets/demo-handoff.json','utf8'));
const base='https://oan-tu-ti-ai-arena.vercel.app';assert.equal(fixture.base,base);
let responseBytes=0;
class SmallClient extends CloudClient{async call(...args){const d=await super.call(...args);responseBytes+=Buffer.byteLength(typeof d==='string'?d:JSON.stringify(d));return d;}}
const student=new SmallClient(base);await student.login(fixture.email,fixture.password);
const landing=await fetch(base+'/demo',{redirect:'manual',headers:{Cookie:student.cookies()}});
assert.equal(landing.status,307);assert.ok(landing.headers.get('location').includes(fixture.event));await landing.body?.cancel();
await student.post({action:'join_open',event:fixture.event});
const code='def choose_move(state):\n    return state["legal_moves"][0]\n';
const body={action:'submit_trial',event:fixture.event,source:code,opponent:'starter_config'};
const received=await student.post(body);
const duplicate=await student.post(body);assert.equal(duplicate.id,received.id);assert.equal(duplicate.benchmark,received.benchmark);
const started=Date.now();let submitted,trial;
while(Date.now()-started<180000){
 const [overview,practice]=await Promise.all([student.call('/api/competition?event='+fixture.event),student.call('/api/operations?view=practice')]);
 submitted=overview.submissions.find(s=>s.id===received.id);trial=practice.benchmarks.find(b=>b.id===received.benchmark);
 if(trial?.games.some(g=>g.status==='failed'))throw Error('Real judge failed a trial game');
 if(submitted?.status==='valid'&&trial?.summary.completed===2)break;
 await new Promise(r=>setTimeout(r,2500));
}
assert.equal(submitted?.status,'valid');assert.equal(trial?.summary.completed,2);assert.equal(trial.submission,received.id);assert.equal(trial.event,fixture.event);assert.equal(trial.sha,received.sha);
assert.equal(trial.summary.wins+trial.summary.draws+trial.summary.losses,2);assert.ok(trial.games.every(g=>Array.isArray(g.result?.moves)&&g.result?.runtime));
const resumed=await student.call('/api/operations?view=practice');assert.equal(resumed.benchmarks.find(b=>b.id===received.benchmark).summary.completed,2,'Resume must read persisted results');
const friendly=new SmallClient(base);await friendly.login(handoff.email,handoff.password);
const portal=await friendly.call('/api/portal');assert.equal(portal.user.is_admin,0);assert.equal(portal.verificationRequired,false);assert.ok(!portal.teams.some(t=>t.event===fixture.event),'Handed-off student must still experience first enrollment');
const proof={at:new Date().toISOString(),site:base,event:fixture.event,studentLaunchRedirect:true,noInvite:true,oneRequestSubmitsAndStartsTwoGames:true,repeatedClickDeduplicated:true,officialValidation:submitted.status,trial:trial.summary,matchingSourceVersion:true,replays:true,resumeFromServer:true,handoffAccountNotAdmin:true,handoffAccountStillUnjoined:true,waitedForJudgeMs:Date.now()-started,measuredResponseBodyBytes:responseBytes};
writeFileSync('docs/submission/evidence/one-click-demo.json',JSON.stringify(proof,null,2)+'\n');
writeFileSync('.secrets/demo-run.json',JSON.stringify({...fixture,submission:received.id,benchmark:received.benchmark},null,2));
console.log(proof);
