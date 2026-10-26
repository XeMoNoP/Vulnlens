import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    retests: db.getSecurityRetests(),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { finding_id, tester, test_result, notes } = body;

    if (!finding_id || !tester) {
      return NextResponse.json({ error: 'Finding ID and Tester name are required.' }, { status: 400 });
    }

    const retest = db.addSecurityRetest({
      finding_id,
      tester,
      test_result: test_result === 'FAIL' ? 'FAIL' : 'PASS',
      notes,
    });

    db.logAuditEvent(
      user.id,
      'RETEST_SUBMIT',
      `Submitted security retest for ${finding_id} by ${tester} Result: ${test_result}`
    );

    return NextResponse.json({ success: true, retest });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error recording retest';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
