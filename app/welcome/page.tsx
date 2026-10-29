/* eslint-disable @next/next/no-css-tags -- Shared self-hosted font for the public entry. */
import Entry from '../entry';
import {demoSelfService} from '../../lib/demo-policy.mjs';
export const dynamic='force-dynamic';
export default function Welcome(){return <><link rel="stylesheet" href="/fonts/be-vietnam-pro.css"/><Entry demo={demoSelfService()}/></>;}
