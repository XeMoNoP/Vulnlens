import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  const securityMode = db.getSecurityMode();

  if (!user) {
    return NextResponse.json({
      user: null,
      securityMode,
    });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      pincode: user.pincode,
    },
    securityMode,
  });
}
