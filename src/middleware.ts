import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL || 'https://lms.smartlabs.lk';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // We are now using the local /dashboard for AI scoring and student tools.
  // The external LMS is linked explicitly where needed.
  if (pathname === '/enroll') {
    return NextResponse.redirect(LMS_URL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/enroll'],
};
