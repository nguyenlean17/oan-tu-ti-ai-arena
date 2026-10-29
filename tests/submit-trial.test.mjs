import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openCompetition,action,sha} from '../competition/store.mjs';
import {submitAndTrial} from '../operations/store.mjs';
const directory=mkdtempSync(path.join(tmpdir(),'arena-submit-trial-')),db=openCompetition(directory);
const admin={id:'host',is_admin:1},alice={id:'student',name:'Student',email:'student@vnu.edu.vn'},other={id:'other',email:'other@vnu.edu.vn'};
const source='def choose_move(state):\n return state["legal_moves"][0]\n';
try{
 db.exec("CREATE TABLE ops_jobs(id TEXT PRIMARY KEY,kind TEXT NOT NULL,subject TEXT NOT NULL,pair_id TEXT,status TEXT NOT NULL DEFAULT 'queued',worker TEXT,lease TEXT,until INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,payload TEXT NOT NULL,result TEXT,result_hash TEXT,created INTEGER NOT NULL,completed INTEGER)");
 const config={entryMode:'open',groupCount:1,qualifiers:2,deadline:new Date(Date.now()+86400000).toISOString()};
 const event=(await action(db,admin,{action:'create',name:'One-click trial',config,openNow:true})).id;
 await assert.rejects(()=>submitAndTrial(db,other,event,source),e=>e.status===403);
 await action(db,alice,{action:'join_open',event});
 const first=await submitAndTrial(db,alice,event,source,'starter_config');
 assert.equal(first.sha,sha(source));assert.ok(first.benchmark);
 const jobs=db.prepare('SELECT * FROM ops_jobs ORDER BY id').all();assert.equal(jobs.length,2);
 assert.deepEqual(jobs.map(j=>JSON.parse(j.payload).studentSide).sort(),['P1','P2']);
 for(const row of jobs){const p=JSON.parse(row.payload);assert.equal(p.studentSha,sha(source));assert.equal(p.event,event);assert.equal(p.submission,first.id);assert.equal(p[p.studentSide==='P1'?'p1':'p2'].source,source);}
 const duplicates=await Promise.all(Array.from({length:5},()=>submitAndTrial(db,alice,event,source,'starter_config')));
 assert.ok(duplicates.every(r=>r.id===first.id&&r.benchmark===first.benchmark));
 assert.equal(db.prepare('SELECT COUNT(*) n FROM submissions').get().n,1);assert.equal(db.prepare('SELECT COUNT(*) n FROM ops_jobs').get().n,2);
 await assert.rejects(()=>submitAndTrial(db,alice,event,source,'../../private'),e=>e.status===400);
 db.prepare('UPDATE submissions SET created=?').run(Date.now()-10000);
 await assert.rejects(()=>submitAndTrial(db,alice,event,source+'# edit'),e=>e.status===429);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM submissions').get().n,1,'Trial quota rollback must not leave a newly accepted submission');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM jobs').get().n,1,'Validation queue must roll back with the rejected combined request');
 await action(db,admin,{action:'config',event,config:{...config,deadline:new Date(Date.now()-1).toISOString()}});
 await assert.rejects(()=>submitAndTrial(db,alice,event,source),e=>e.status===400);
 console.log('Submit + trial passed: membership, immutable matching source, two sides, concurrent deduplication, reference validation, atomic quota rollback and deadline enforcement.');
}finally{db.close();rmSync(directory,{recursive:true,force:true});}
