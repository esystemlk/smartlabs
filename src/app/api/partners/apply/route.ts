import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';

interface ApplyBody {
  partnerType?: 'business' | 'individual';
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  businessName?: string;
  website?: string;
  businessRegNo?: string;
  referralDescription?: string;
  estimatedVolume?: string;
  password?: string;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  agreeAuthority?: boolean;
  agreeLogo?: boolean; // business only
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
const genRef = () => `PA-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const b = (await request.json()) as ApplyBody;

    // ── Server-side validation (do not trust the client) ──────────────────────
    const partnerType = b.partnerType === 'business' ? 'business' : b.partnerType === 'individual' ? 'individual' : null;
    const fullName = (b.fullName ?? '').trim();
    const username = (b.username ?? '').trim();
    const usernameLower = username.toLowerCase();
    const email = (b.email ?? '').trim().toLowerCase();
    const phone = (b.phone ?? '').trim();
    const location = (b.location ?? '').trim();
    const referralDescription = (b.referralDescription ?? '').trim();
    const businessName = (b.businessName ?? '').trim();
    const password = b.password ?? '';

    if (!partnerType) return NextResponse.json({ error: 'Choose Business or Individual.' }, { status: 400 });
    if (fullName.length < 2) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    if (!USERNAME_RE.test(username)) return NextResponse.json({ error: 'Username must be 3–30 letters, numbers or underscores.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    if (phone.length < 6) return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    if (!location) return NextResponse.json({ error: 'District or city is required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    if (partnerType === 'business' && businessName.length < 2) return NextResponse.json({ error: 'Business name is required for a business partner.' }, { status: 400 });
    if (!b.agreeTerms || !b.agreePrivacy || !b.agreeAuthority) return NextResponse.json({ error: 'Please accept the required agreements.' }, { status: 400 });
    if (partnerType === 'business' && !b.agreeLogo) return NextResponse.json({ error: 'Please grant logo display permission.' }, { status: 400 });

    // ── Uniqueness pre-checks ─────────────────────────────────────────────────
    const unameRef = adminDb.collection('partner_usernames').doc(usernameLower);
    if ((await unameRef.get()).exists) {
      return NextResponse.json({ error: 'That username is already taken.', code: 'USERNAME_TAKEN' }, { status: 409 });
    }
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json({ error: 'An account already exists with that email. Please sign in instead.', code: 'EMAIL_EXISTS' }, { status: 409 });
    } catch { /* not found — good */ }

    // ── Create the partner auth account ───────────────────────────────────────
    const userRecord = await adminAuth.createUser({ email, password, displayName: fullName, emailVerified: false });
    const uid = userRecord.uid;
    const ref = genRef();

    try {
      // Atomic: claim the username, write the application and the partner profile.
      await adminDb.runTransaction(async (tx) => {
        const fresh = await tx.get(unameRef);
        if (fresh.exists) throw new Error('USERNAME_RACE');

        const now = FieldValue.serverTimestamp();
        tx.set(unameRef, { uid, createdAt: now });
        tx.set(adminDb!.collection('partner_applications').doc(ref), {
          ref, uid, partnerType, fullName, username, usernameLower, email, phone, location,
          address: (b.address ?? '').trim() || null,
          businessName: partnerType === 'business' ? businessName : null,
          website: (b.website ?? '').trim() || null,
          businessRegNo: (b.businessRegNo ?? '').trim() || null,
          referralDescription: referralDescription || null,
          estimatedVolume: (b.estimatedVolume ?? '').trim() || null,
          reviewStatus: 'pending',      // pending | needs_info | approved | rejected | withdrawn
          emailVerified: false,
          logoStatus: partnerType === 'business' ? 'not_uploaded' : 'n/a',
          createdAt: now,
          updatedAt: now,
        });
        tx.set(adminDb!.collection('partners').doc(uid), {
          uid, ref, partnerType, fullName, username, usernameLower, email, phone, location,
          businessName: partnerType === 'business' ? businessName : null,
          reviewStatus: 'pending',
          accountState: 'pending_activation', // pending_activation | active | suspended | closed
          emailVerified: false,
          logoStatus: partnerType === 'business' ? 'not_uploaded' : 'n/a',
          logoVisible: false,
          createdAt: now,
          updatedAt: now,
        });
      });
    } catch (txErr) {
      // Roll back the auth account if we couldn't persist the application.
      try { await adminAuth.deleteUser(uid); } catch { /* ignore */ }
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      if (msg === 'USERNAME_RACE') {
        return NextResponse.json({ error: 'That username was just taken. Please choose another.', code: 'USERNAME_TAKEN' }, { status: 409 });
      }
      throw txErr;
    }

    // ── Emails (best effort — a saved application must survive email failures) ──
    let verifyLink: string | null = null;
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk';
      verifyLink = await adminAuth.generateEmailVerificationLink(email, { url: `${appUrl}/partners/login` });
    } catch { /* verification link optional; can be resent at login */ }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk';
    // IMPORTANT: await the emails. On Vercel serverless the function is killed as
    // soon as the response is sent, so fire-and-forget mail never actually goes
    // out. The application is already saved, so a mail failure is non-fatal.
    const emailResults = await Promise.allSettled([
      sendMail({
        to: email,
        replyTo: CONTACT,
        subject: `SmartLabs partner application received — ${ref}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
          <h2 style="color:#163C69">Thank you for applying, ${esc(fullName)}</h2>
          <p>We have received your request to become a SmartLabs referral partner and notified our team at ${CONTACT}.</p>
          <p>Your application reference is <b>${esc(ref)}</b>. Your application is <b>pending review</b>. You can sign in any time to check its status.</p>
          ${verifyLink ? `<p style="margin:20px 0"><a href="${verifyLink}" style="background:#163C69;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Verify your email</a></p>` : ''}
          <p style="margin-top:20px"><a href="${appUrl}/partners/login">Sign in to your partner account →</a></p>
          <p style="color:#64748b;font-size:12px;margin-top:24px">This email confirms receipt of the application; it does not confirm approval.</p>
        </div>`,
      }),
      sendMail({
        to: CONTACT,
        replyTo: email,
        subject: `New partner application — ${ref} (${partnerType})`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
          <h3>New referral partner application</h3>
          <p><b>Reference:</b> ${esc(ref)}<br/>
             <b>Type:</b> ${esc(partnerType)}<br/>
             <b>Name:</b> ${esc(fullName)}<br/>
             <b>Username:</b> ${esc(username)}<br/>
             <b>Email:</b> ${esc(email)}<br/>
             <b>Phone:</b> ${esc(phone)}<br/>
             <b>Location:</b> ${esc(location)}<br/>
             ${partnerType === 'business' ? `<b>Business:</b> ${esc(businessName)}<br/>` : ''}
             ${referralDescription ? `<b>How they'll refer:</b> ${esc(referralDescription)}<br/>` : ''}</p>
          <p>Review it in the admin partners queue.</p>
        </div>`,
      }),
    ]);
    emailResults.forEach((r, i) => { if (r.status === 'rejected') console.error(`[partners/apply] email ${i === 0 ? 'ack' : 'admin'} failed:`, r.reason); });
    const ackSent = emailResults[0].status === 'fulfilled';

    return NextResponse.json({ success: true, ref, ackSent });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/apply] error:', error);
    return NextResponse.json({ error: `Could not submit your application: ${msg}` }, { status: 500 });
  }
}
