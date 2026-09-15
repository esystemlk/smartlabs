import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Mail, Clock, Database, Archive } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delete Your Account | SmartLabs',
  description:
    'How to request deletion of your SmartLabs account and associated data, what is deleted, and what is retained.',
};

const SUPPORT_EMAIL = 'info@smartlabs.lk';

/**
 * Account & data deletion page — required by the Google Play Data safety form
 * for the SmartLabs PTE app (package lk.smartlabs.app). Publicly reachable at
 * /delete-account so it can be linked from the Play Store listing.
 */
export default function DeleteAccountPage() {
  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <Trash2 className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Delete Your Account</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              This page explains how to request deletion of your <strong>SmartLabs</strong> account
              (used across the SmartLabs website and the <strong>SmartLabs PTE</strong> mobile app) and
              the data associated with it.
            </p>
          </div>

          <div className="space-y-12">
            {/* How to request */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">How to request account deletion</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>You can request that your SmartLabs account and its data be deleted at any time:</p>
                <ol>
                  <li>
                    Send an email to{' '}
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20SmartLabs%20account`} className="text-primary font-medium">
                      {SUPPORT_EMAIL}
                    </a>{' '}
                    <strong>from the email address registered to your account</strong>, with the subject
                    line <em>“Delete my SmartLabs account”</em>.
                  </li>
                  <li>
                    In the message, confirm the name and email on the account so we can verify it is yours.
                  </li>
                  <li>
                    We will verify your identity and permanently delete your account, then email you to
                    confirm once it is done.
                  </li>
                </ol>
                <p>
                  Alternatively, you may contact us through the{' '}
                  <a href="/contact" className="text-primary font-medium">contact page</a>{' '}
                  and ask for your account to be deleted.
                </p>
              </CardContent>
            </Card>

            {/* What gets deleted */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <Database className="h-6 w-6 text-destructive" />
                  </div>
                  <CardTitle className="font-headline text-2xl">What data is deleted</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>When your deletion request is processed, we permanently remove:</p>
                <ul>
                  <li>Your account profile — name, email address and account settings</li>
                  <li>Your sign-in credentials and authentication record (email/password and Google sign-in link)</li>
                  <li>Your practice history — attempts, answers, AI scores and progress data</li>
                  <li>Your AI credit balance and course/access records tied to the account</li>
                </ul>
              </CardContent>
            </Card>

            {/* What is kept */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary rounded-lg">
                    <Archive className="h-6 w-6 text-foreground/70" />
                  </div>
                  <CardTitle className="font-headline text-2xl">What we keep, and for how long</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <ul>
                  <li>
                    <strong>Payment and invoice records:</strong> transaction records required for
                    accounting, tax and legal compliance are retained for the period required by
                    applicable law. These are kept separately from your account profile and are not used
                    to identify you for any other purpose.
                  </li>
                  <li>
                    <strong>Encrypted backups:</strong> residual copies of your data in routine encrypted
                    backups are purged within <strong>90 days</strong> of your account being deleted.
                  </li>
                  <li>
                    <strong>Anonymised data:</strong> aggregated, anonymised statistics that can no longer
                    identify you may be retained to improve the service.
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>
                  Verified deletion requests are actioned within <strong>30 days</strong>. Once your
                  account is deleted the action cannot be undone — you would need to create a new account
                  to use SmartLabs again.
                </p>
                <p>
                  Questions about this process? Email us at{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium">{SUPPORT_EMAIL}</a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
