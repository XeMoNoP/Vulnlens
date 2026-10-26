import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role === 'admin') {
    return NextResponse.json({ orders: db.getOrders() });
  }
  return NextResponse.json({ orders: db.getOrders(user.id) });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    const allowed = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
    if (!orderId || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 });
    }

    const updated = db.updateOrderStatus(Number(orderId), status);
    if (updated) {
      db.logAuditEvent(user.id, 'ORDER_STATUS_UPDATE', `Updated order ID ${orderId} status to ${status}`);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating order';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
