/* eslint-disable @next/next/no-css-tags -- Share local font faces with standalone account HTML. */
import {requireChatGPTUser} from '../chatgpt-auth';
import Workspace from './workspace';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/student');return <><link rel="stylesheet" href="/fonts/be-vietnam-pro.css"/><Workspace/></>;}
