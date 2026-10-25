import { requireChatGPTUser } from '../chatgpt-auth';
import Practice from './workspace';
export const dynamic = 'force-dynamic';
export default async function Page() { const user = await requireChatGPTUser('/practice'); return <Practice userId={user.userId} />; }
