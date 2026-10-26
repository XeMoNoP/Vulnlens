import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Please log in to complete checkout.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { address, pincode, couponCode } = body;

    if (!address || !pincode) {
      return NextResponse.json(
        { error: 'Delivery address and valid 6-digit pincode are required.' },
        { status: 400 }
      );
    }

    const cleanPincode = String(pincode).trim().slice(0, 6);
    if (!/^\d{6}$/.test(cleanPincode)) {
      return NextResponse.json(
        { error: 'Pincode must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    const result = db.createOrder(user.id, address, cleanPincode, couponCode);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
    });
  } catch (err: unknown) {
    const mode = db.getSecurityMode();
    // VULN-007: In SECURE mode, hide internal execution stack traces from client
    if (mode === 'SECURE') {
      return NextResponse.json(
        { error: 'An unexpected processing error occurred during checkout. Your card has not been charged.' },
        { status: 500 }
      );
    } else {
      const errorMsg = err instanceof Error ? err.stack || err.message : String(err);
      return NextResponse.json(
        { error: `LAB_MODE_EXCEPTION: ${errorMsg}` },
        { status: 500 }
      );
    }
  }
}
