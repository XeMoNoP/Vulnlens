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

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (mode === 'SECURE' && password.length < 6) {
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

    // VULN-004: Dual Mode Password Hashing
    let passwordHash: string;
    if (mode === 'SECURE') {
      // Strong BCrypt with 10 salt rounds
      passwordHash = bcrypt.hashSync(password, 10);
    } else {
      // VULNERABLE LAB MODE: Weak unsalted fast MD5 hash susceptible to rainbow tables
      passwordHash = 'md5_' + crypto.createHash('md5').update(password).digest('hex');
    }

    const newUser = db.createUser(username, passwordHash, 'customer');

    await setSessionCookie(newUser);
    db.logAuditEvent(newUser.id, 'USER_REGISTER', `New user registered: ${username} (Hash Scheme: ${mode === 'SECURE' ? 'BCrypt' : 'Weak-MD5'})`);

    return NextResponse.json({
      success: true,
      securityMode: mode,
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
