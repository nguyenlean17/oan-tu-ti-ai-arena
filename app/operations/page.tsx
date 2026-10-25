import { requireChatGPTUser } from '../chatgpt-auth';
import { redirect } from 'next/navigation';
import Operations from './workspace';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await requireChatGPTUser('/operations');
  if (!user.canBootstrap) redirect('/competition');
  return <Operations />;
}
