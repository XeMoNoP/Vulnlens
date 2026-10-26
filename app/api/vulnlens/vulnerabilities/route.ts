import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const vulnerabilities = db.getVulnerabilities();
  return NextResponse.json({
    vulnerabilities,
    counts: {
      total: vulnerabilities.length,
      open: vulnerabilities.filter((v) => v.remediation_status === 'Open').length,
      fixed: vulnerabilities.filter((v) => v.remediation_status === 'Fixed').length,
      pending: vulnerabilities.filter((v) => v.retest_result === 'Pending').length,
    },
  });
}
