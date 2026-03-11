import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL || 'https://lms.smartlabs.lk';

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
