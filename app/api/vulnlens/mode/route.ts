import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({
    mode: db.getSecurityMode(),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { mode } = body;

    if (mode !== 'SECURE' && mode !== 'LAB') {
      return NextResponse.json({ error: 'Invalid security mode.' }, { status: 400 });
    }

    db.setSecurityMode(mode);
    db.logAuditEvent(
      user.id,
      'SECURITY_MODE_CHANGE',
      `Administrator ${user.username} toggled security mode to: ${mode}`
    );

    return NextResponse.json({
      success: true,
      mode,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error changing security mode';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
