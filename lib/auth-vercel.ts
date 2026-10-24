import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionUser } from './vercel-auth-store.mjs';

export type ArenaUser = { userId:string,displayName:string,email:string,fullName:string|null,canBootstrap:boolean };
export async function getArenaUser():Promise<ArenaUser|null> {
  const token=(await cookies()).get('arena_session')?.value;
  const user=await sessionUser(token);
  return user?{userId:user.id,displayName:user.name,email:user.email,fullName:user.name,canBootstrap:user.is_admin===1}:null;
}
function safe(value:string){return value.startsWith('/')&&!value.startsWith('//')&&!/[\\\r\n]/.test(value)?value:'/';}
export function arenaSignInPath(returnTo='/'){return '/login?return_to='+encodeURIComponent(safe(returnTo));}
export function arenaSignOutPath(){return '/logout';}
export async function requireArenaUser(returnTo:string){const user=await getArenaUser();if(!user)redirect(arenaSignInPath(returnTo));return user;}
