import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from '@/lib/platform';

export type ArenaUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  canBootstrap: boolean;
};

export async function getArenaUser(): Promise<ArenaUser | null> {
  if ((env as unknown as Record<string, unknown>).ARENA_AUTH_PROVIDER !== 'docker') return null;
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-arena-user-id');
  const email = requestHeaders.get('x-arena-user-email');
  if (!userId || !email) return null;
  const fullName = safeDecodeURIComponent(requestHeaders.get('x-arena-user-name') || '');

  return {
    userId,
    displayName: fullName ?? email,
    email,
    fullName,
    canBootstrap: requestHeaders.get('x-arena-admin') === '1',
  };
}

export async function requireArenaUser(
  returnTo: string,
): Promise<ArenaUser> {
  const user = await getArenaUser();
  if (user) return user;

  redirect(arenaSignInPath(returnTo));
}

export function arenaSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `/login?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function arenaSignOutPath(): string {
  return `/logout`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
