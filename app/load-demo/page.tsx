import { notFound } from 'next/navigation';
import Operations from '../operations/workspace';
export const dynamic = 'force-dynamic';
export default function Page() {
  if (process.env.ARENA_LOAD_DEMO !== '1') notFound();
  return <Operations readOnlyDemo />;
}
