/* eslint-disable @next/next/no-css-tags -- Shared self-hosted font for account and dashboard surfaces. */
import Arena from './arena';
import { getChatGPTUser } from './chatgpt-auth';
import {env} from '@/lib/platform';
import Workspace from './student/workspace';
import Entry from './entry';
import {redirect} from 'next/navigation';
import {withCompetition} from '../competition/postgres.mjs';
import {demoSelfService} from '../lib/demo-policy.mjs';
export const dynamic='force-dynamic';
type MembershipStore={prepare(query:string):{all(userId:string):Promise<{event:string}[]>}};
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [user,params]=await Promise.all([getChatGPTUser(),searchParams]);
 // Keep shared human-game links and legacy runtimes working.
 if((env as unknown as {ARENA_AUTH_PROVIDER?:string}).ARENA_AUTH_PROVIDER!=='vercel'||params.play||params.room)return <Arena user={user?{id:user.userId,name:user.fullName||user.email.split('@')[0]}:null}/>;
 if(user&&!user.canBootstrap&&!demoSelfService()){
  const teams=await withCompetition((db:MembershipStore)=>db.prepare('SELECT m.event FROM members m WHERE m.user=? ORDER BY m.event LIMIT 2').all(user.userId));
  if(teams.length===1)redirect('/competition?tab=submit#'+encodeURIComponent(teams[0].event));
 }
 return <><link rel="stylesheet" href="/fonts/be-vietnam-pro.css"/>{user?<Workspace/>:<Entry demo={demoSelfService()}/>}</>;
}
