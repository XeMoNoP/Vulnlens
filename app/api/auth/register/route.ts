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

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existing = db.getUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken.' },
        { status: 409 }
      );
    }

    // BCrypt hashing with standard salt rounds
    const hash = bcrypt.hashSync(password, 10);
    const newUser = db.createUser(username, hash, 'customer');

    await setSessionCookie(newUser);
    db.logAuditEvent(newUser.id, 'USER_REGISTER', `New user registered: ${username}`);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
