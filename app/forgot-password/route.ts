import { accountLinkHandler } from '../../lib/account-link-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>accountLinkHandler(request,'forgot-password');
export const POST=GET;
