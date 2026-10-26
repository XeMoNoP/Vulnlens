import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const mode = db.getSecurityMode();

  // VULN-008: Security Misconfiguration Dual Mode
  if (mode === 'SECURE') {
    return new NextResponse('403 Forbidden: Directory indexing and file inspection disabled.', {
      status: 403,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  }

  // VULNERABLE LAB MODE: Directory listing enabled, disclosing sensitive project files
  const exposedDirectory = {
    directory: '/uploads/system_backups',
    status: 'Index of /uploads',
    files: [
      { name: '.env', size: '1.2 KB', modified: '2026-10-25 10:14:00', type: 'Plaintext Environment Config' },
      { name: 'setup.sql', size: '12.4 KB', modified: '2026-10-25 11:20:00', type: 'Database Schema Dump' },
      { name: 'backup_users.tar.gz', size: '4.8 MB', modified: '2026-10-25 12:00:00', type: 'Archive' },
      { name: 'avatar_admin_shell.php', size: '240 B', modified: '2026-10-25 14:30:00', type: 'Uploaded PHP Script' },
    ],
    server_banner: 'Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12',
    warning: '[LAB MODE] Directory listing enabled. Sensitive configuration files publicly accessible.',
  };

  return NextResponse.json(exposedDirectory, {
    status: 200,
    headers: {
      'X-Powered-By': 'PHP/8.2.12-VulnLab',
      'Server': 'Apache/2.4.58 (Win64)',
    },
  });
}
