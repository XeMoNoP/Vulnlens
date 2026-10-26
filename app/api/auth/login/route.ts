import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const user = db.getUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      db.logAuditEvent(null, 'LOGIN_FAILED', `Failed login attempt for username: ${username}`);
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    await setSessionCookie(user);
    db.logAuditEvent(user.id, 'USER_LOGIN', `User ${user.username} logged in successfully.`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        pincode: user.pincode,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
