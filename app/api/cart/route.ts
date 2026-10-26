import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  const cart = db.getCart(user?.id);
  const subtotal = cart.reduce((acc, curr) => acc + curr.product.dmart_price * curr.quantity, 0);

  return NextResponse.json({
    items: cart,
    subtotal,
    count: cart.reduce((acc, curr) => acc + curr.quantity, 0),
    securityMode: db.getSecurityMode(),
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const mode = db.getSecurityMode();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    // VULN-006 Parameter Tampering: Dual Mode
    if (mode === 'SECURE') {
      // SECURE MODE: Strict positive integer constraint and stock bounds check
      if (!productId || isNaN(productId) || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return NextResponse.json(
          { error: 'Invalid quantity. Value must be a positive integer.' },
          { status: 400 }
        );
      }

      const result = db.addToCart(productId, quantity, user?.id);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
    } else {
      // VULNERABLE LAB MODE: Parameter validation disabled!
      // Allows negative quantities (-5) or unbounded numbers exceeding inventory!
      const prod = db.getProductById(productId);
      if (!prod) return NextResponse.json({ error: 'Product not found.' }, { status: 400 });

      // Direct addition without stock or positive checks
      db.addToCart(productId, quantity, user?.id);
    }

    return NextResponse.json({ success: true, securityMode: mode });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Cart error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const mode = db.getSecurityMode();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    if (mode === 'SECURE') {
      if (!productId || isNaN(productId) || isNaN(quantity)) {
        return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 });
      }

      const result = db.updateCartQuantity(productId, quantity, user?.id);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
    } else {
      // LAB MODE: Parameter tampering allowed!
      db.updateCartQuantity(productId, quantity, user?.id);
    }

    return NextResponse.json({ success: true, securityMode: mode });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Cart error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get('productId'));

    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Product ID required.' }, { status: 400 });
    }

    db.removeFromCart(productId, user?.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Cart error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
