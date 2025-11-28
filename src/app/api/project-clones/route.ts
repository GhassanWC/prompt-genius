export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getClonedProjectsForUser, removeCloneForUser } from '@/lib/project-server';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const uid = await getCurrentUserId();
    if (!uid) {
      return jsonError('Unauthorized', 401);
    }
    const clones = await getClonedProjectsForUser(uid);
    return NextResponse.json({ clones });
  } catch (e: any) {
    if (e?.message === '__unauthorized__') return jsonError('Unauthorized', 401);
    return jsonError(e?.message || 'Unexpected error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uid = await getCurrentUserId();
    if (!uid) {
      return jsonError('Unauthorized', 401);
    }

    const body = (await req.json()) as { cloneProjectId?: string };
    const cloneProjectId = body?.cloneProjectId;

    if (!cloneProjectId) {
      return jsonError('cloneProjectId is required', 400);
    }

    await removeCloneForUser(uid, cloneProjectId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === '__unauthorized__') return jsonError('Unauthorized', 401);
    return jsonError(e?.message || 'Unexpected error', 500);
  }
}


