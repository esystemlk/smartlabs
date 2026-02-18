import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL || 'https://lms.smartlabs.lk';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/enroll' || pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(LMS_URL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/enroll', '/dashboard/:path*'],
};
