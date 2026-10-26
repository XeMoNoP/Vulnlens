import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || undefined;
  const category = searchParams.get('category') || undefined;

  const products = db.getProducts(q, category);
  const categories = db.getCategories();

  return NextResponse.json({
    products,
    categories,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, category_id, mrp, dmart_price, stock, image } = body;

    if (!name || !category_id || typeof mrp !== 'number' || typeof dmart_price !== 'number') {
      return NextResponse.json({ error: 'Invalid product parameters.' }, { status: 400 });
    }

    const newProduct = db.createProduct({
      name,
      description: description || '',
      category_id: Number(category_id),
      mrp: Number(mrp),
      dmart_price: Number(dmart_price),
      stock: Number(stock) || 0,
      image: image || 'placeholder.png',
    });

    db.logAuditEvent(user.id, 'PRODUCT_CREATE', `Created new product: ${name} (ID: ${newProduct.id})`);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating product';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required.' }, { status: 400 });
    }

    const updated = db.updateProduct(Number(id), data);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    db.logAuditEvent(user.id, 'PRODUCT_EDIT', `Updated product: ${updated.name} (ID: ${id})`);

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating product';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product ID required.' }, { status: 400 });
  }

  const deleted = db.deleteProduct(Number(id));
  if (deleted) {
    db.logAuditEvent(user.id, 'PRODUCT_DELETE', `Deleted product ID: ${id}`);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
}
