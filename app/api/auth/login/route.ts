import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    const mode = db.getSecurityMode();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      if (mode === 'SECURE') {
        db.logAuditEvent(null, 'LOGIN_FAILED', `Failed login attempt for non-existent user: ${username}`);
      }
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    let isValid = false;
    if (user.password_hash.startsWith('md5_')) {
      const calc = 'md5_' + crypto.createHash('md5').update(password).digest('hex');
      isValid = (calc === user.password_hash);
    } else {
      isValid = bcrypt.compareSync(password, user.password_hash);
    }

    if (!isValid) {
      if (mode === 'SECURE') {
        db.logAuditEvent(user.id, 'LOGIN_FAILED', `Failed login attempt for user: ${username}`);
      }
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    await setSessionCookie(user);
    if (mode === 'SECURE') {
      db.logAuditEvent(user.id, 'USER_LOGIN', `User ${user.username} logged in successfully.`);
    }

    return NextResponse.json({
      success: true,
      securityMode: mode,
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
