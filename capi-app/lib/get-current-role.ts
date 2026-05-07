import { cookies } from 'next/headers';
import { verifySessionToken } from './jwt-session';
import { authConfig } from './config';

export async function getCurrentRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authConfig.sessionCookieName)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  return {
    workspaceId: session.activeWorkspaceId,
    role: session.activeWorkspaceRole,
    userId: session.sub,
    email: session.email
  };
}
