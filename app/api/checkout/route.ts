import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const mode = db.getSecurityMode();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Please log in to complete checkout.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { address, pincode, couponCode } = body;

    // VULN-007: Dual Mode Input Handling & Exception Leakage
    if (mode === 'SECURE') {
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
    } else {
      // VULNERABLE LAB MODE:
      // Accepts arbitrary/corrupted input, and triggers sensitive internal stack traces on errors
      if (!address || !pincode) {
        throw new Error(
          `UnhandledNullReferenceException in TransactionController.executeCheckout() at D:\\Vulnlens\\app\\api\\checkout\\route.ts:48. Connection string: mysql://root:secret@127.0.0.1:3306/dmart_cyberlab`
        );
      }

      const result = db.createOrder(user.id, address, String(pincode), couponCode);
      if (!result.success) {
        throw new Error(
          `DatabaseIntegrityConstraintViolation: ${result.error}. Host: localhost, PDO_ERRMODE_EXCEPTION enabled.`
        );
      }

      return NextResponse.json({
        success: true,
        order: result.order,
        securityMode: 'LAB',
      });
    }
  } catch (err: unknown) {
    if (mode === 'SECURE') {
      // SECURE MODE: Clean sanitized message, zero internal leakage
      return NextResponse.json(
        { error: 'An unexpected processing error occurred during checkout. Your card has not been charged.' },
        { status: 500 }
      );
    } else {
      // VULNERABLE LAB MODE: Leaks full internal stack trace, file path, environment info
      const errorMsg = err instanceof Error ? (err.stack || err.message) : String(err);
      return NextResponse.json(
        {
          error: `[LAB_MODE_EXCEPTION] Internal Error: ${errorMsg}`,
          server_environment: {
            node_version: process.version,
            platform: process.platform,
            cwd: process.cwd(),
            db_driver: 'MockPDO/SQLite In-Memory',
            debug_trace: err instanceof Error ? err.stack?.split('\n') : [],
          },
        },
        { status: 500 }
      );
    }
  }
}
