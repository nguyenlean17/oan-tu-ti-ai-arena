import {portalHandler} from '../../../lib/portal-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>portalHandler(request);
export const POST=GET;
