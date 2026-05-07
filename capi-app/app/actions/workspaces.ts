'use server'

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySessionToken, setActiveWorkspaceInSession } from '@/lib/jwt-session';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/config';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authConfig.sessionCookieName)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

// 1. Crear un nuevo Workspace
export async function createWorkspace(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");

  const userId = parseInt(session.sub, 10);
  const name = formData.get('name') as string;

  const newWorkspace = await db.workspace.create({
    data: {
      name,
      createdById: userId,
      members: {
        create: {
          userId: userId,
          role: 'OWNER'
        }
      }
    }
  });

  // Establecemos este nuevo workspace como el activo en la sesión
  await setActiveWorkspaceInSession(newWorkspace.id, 'OWNER');

  // Redirigimos al dashboard del OWNER
  redirect(`/dashboard/owner`);
}

// 2. Unirse a un Workspace existente (por ID)
export async function joinWorkspace(workspaceId: number) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");

  const userId = parseInt(session.sub, 10);

  // Verificamos si el workspace existe
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace) throw new Error("Workspace no encontrado");

  // Verificamos si ya es miembro
  const existingMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        workspaceId: workspaceId,
        userId: userId
      }
    }
  });

  let userRole = 'MEMBER';

  if (!existingMember) {
    // Si no es miembro, lo agregamos como MEMBER
    await db.workspaceMember.create({
      data: {
        workspaceId,
        userId: userId,
        role: 'MEMBER'
      }
    });
  } else {
    userRole = existingMember.role;
  }

  // Actualizamos la sesión para que este sea el entorno activo
  await setActiveWorkspaceInSession(workspaceId, userRole as 'OWNER' | 'MEMBER');

  // Redirección basada en el rol
  if (userRole === 'OWNER') {
    redirect(`/dashboard/owner`);
  } else {
    redirect(`/dashboard/member`);
  }
}
