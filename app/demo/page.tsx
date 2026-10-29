import {redirect} from 'next/navigation';
import {getChatGPTUser} from '../chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Demo(){
 const user=await getChatGPTUser();
 if(!user)redirect('/login?return_to=%2Fdemo');
 const event=process.env.DEMO_EVENT_ID;
 if(!event||!/^[A-Za-z0-9_-]{1,100}$/.test(event))redirect('/competition');
 redirect('/competition?tab=submit#'+encodeURIComponent(event));
}
