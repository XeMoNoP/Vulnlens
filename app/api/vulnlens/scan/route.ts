import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runAllChecks } from '@/lib/scanner';

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized. VulnLens scanner requires administrator access.' },
      { status: 403 }
    );
  }

  const results = runAllChecks(user.id);
  return NextResponse.json({
    success: true,
    results,
  });
}
