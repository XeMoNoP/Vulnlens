import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const mode = db.getSecurityMode();
  const user = await getCurrentUser();

  const { orderNo } = await params;
  if (!orderNo) {
    return new NextResponse('Invoice reference required.', { status: 400 });
  }

  const order = db.getOrderByOrderNo(orderNo);
  if (!order) {
    return new NextResponse('Invoice not found.', { status: 404 });
  }

  // VULN-003 IDOR: Dual Mode Behavior
  if (mode === 'SECURE') {
    // SECURE MODE: Strictly enforce authentication and session user ownership
    if (!user) {
      return new NextResponse('Unauthorized Access. Please login first.', { status: 401 });
    }

    if (order.user_id !== user.id && user.role !== 'admin') {
      db.logAuditEvent(
        user.id,
        'UNAUTHORIZED_INVOICE_READ',
        `User ${user.username} (ID: ${user.id}) attempted to read invoice ${orderNo} belonging to user ID ${order.user_id}`
      );
      return new NextResponse('Access Denied: Invoice not found or unauthorized access.', { status: 403 });
    }
  } else {
    // LAB MODE (VULNERABLE): IDOR active! Ownership check bypassed!
    // Anyone can read any customer's full invoice details across accounts without validation!
  }

  // Format Plaintext Invoice
  let invoiceText = '';
  invoiceText += '==================================================\n';
  invoiceText += '              DMART CyberLab Invoice             \n';
  invoiceText += `              Mode: ${mode}                      \n`;
  invoiceText += '==================================================\n';
  invoiceText += `Invoice No : ${order.order_no}\n`;
  invoiceText += `Date       : ${new Date(order.created_at).toLocaleString()}\n`;
  invoiceText += `Customer   : ${order.username || 'Customer'}\n`;
  invoiceText += `Customer ID: ${order.user_id}\n`;
  invoiceText += `Deliver To : ${order.delivery_address}\n`;
  invoiceText += `Pincode    : ${order.delivery_pincode}\n`;
  invoiceText += '--------------------------------------------------\n';
  invoiceText += 'Item Name                        Qty   Price (INR)\n';
  invoiceText += '--------------------------------------------------\n';

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const name = item.product_name.padEnd(32, ' ').slice(0, 32);
      const qty = String(item.quantity).padStart(3, ' ');
      const price = item.price.toFixed(2).padStart(10, ' ');
      invoiceText += `${name} ${qty}   ${price}\n`;
    }
  }

  invoiceText += '--------------------------------------------------\n';
  invoiceText += `TOTAL AMOUNT PAID:               INR  ${order.total_amount.toFixed(2)}\n`;
  invoiceText += '==================================================\n';
  invoiceText += 'Thank you for shopping with DMART CyberLab!\n';

  return new NextResponse(invoiceText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="Invoice_${order.order_no}.txt"`,
      'X-Security-Mode': mode,
    },
  });
}
