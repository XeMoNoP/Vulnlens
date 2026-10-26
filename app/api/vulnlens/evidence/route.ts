import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    evidence: db.getSecurityEvidence(),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { vuln_id, test_id, module, observation, expected_result, actual_result, status, notes } = body;

    if (!test_id || !module || !observation) {
      return NextResponse.json({ error: 'Test ID, Module, and Observation are required.' }, { status: 400 });
    }

    const created = db.addSecurityEvidence({
      vuln_id: vuln_id || null,
      test_id,
      module,
      observation,
      expected_result: expected_result || '',
      actual_result: actual_result || '',
      status: status === 'FAIL' ? 'FAIL' : 'PASS',
      notes,
    });

    db.logAuditEvent(user.id, 'EVIDENCE_RECORD', `Recorded manual evidence for test: ${test_id}`);

    return NextResponse.json({ success: true, evidence: created });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error recording evidence';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
