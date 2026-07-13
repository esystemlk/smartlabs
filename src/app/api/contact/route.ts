import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Very small in-memory rate limit (per server instance) to slow abuse of the
// public form. 5 messages per 10 minutes per IP.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 10 * 60 * 1000;
  const list = (hits.get(ip) ?? []).filter(t => t > windowStart);
  if (list.length >= 5) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? request.headers.get('x-real-ip')
            ?? 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many messages — please try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

    const { name, email, message, website } = body as {
      name?: string; email?: string; message?: string; website?: string;
    };

    // Honeypot field — real users never fill it. Pretend success for bots.
    if (website && website.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    const n = (name ?? '').trim();
    const e = (email ?? '').trim();
    const m = (message ?? '').trim();
    if (!n || !e || !m) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
    }
    if (n.length > MAX_NAME || e.length > MAX_EMAIL || m.length > MAX_MESSAGE || !EMAIL_RE.test(e)) {
      return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
    }

    // Store the message (Admin SDK — bypasses client rules; collection stays server-only).
    if (adminDb) {
      await adminDb.collection('contact_messages').add({
        name: n, email: e, message: m, ip,
        createdAt: new Date(),
        status: 'new',
      }).catch(err => console.warn('[contact] firestore save failed:', err));
    }

    // Notify the team inbox.
    await sendMail({
      to: 'info@smartlabs.lk',
      subject: `New contact message from ${n}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #3b82f6; padding: 16px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 18px;">SMARTLABS — Contact Form</h1>
          </div>
          <div style="padding: 24px;">
            <p><strong>Name:</strong> ${esc(n)}</p>
            <p><strong>Email:</strong> ${esc(e)}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${esc(m)}</div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[contact] error:', error);
    return NextResponse.json({ error: 'Failed to send your message. Please email info@smartlabs.lk directly.' }, { status: 500 });
  }
}
