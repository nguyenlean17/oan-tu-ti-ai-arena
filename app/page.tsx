import Arena from './arena';
import { getArenaUser } from './arena-auth';
import { env } from '@/lib/platform';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getArenaUser();const provider=(env as unknown as Record<string,unknown>).ARENA_AUTH_PROVIDER;return <Arena user={user?{id:user.userId,name:user.fullName||user.email.split('@')[0]}:null} authEnabled={provider==='vercel'||provider==='docker'}/>;}
