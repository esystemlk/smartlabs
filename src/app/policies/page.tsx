
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Ban, Shield, FileText, Cookie } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <div className="w-full">
      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Our Policies</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              Please review our policies regarding refunds, privacy, cookies, and terms of service.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: 23 November 2026</p>
          </div>

          <div className="space-y-12">
            <Card id="refunds" className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-destructive/10 rounded-lg">
                        <Ban className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Refund Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>At Smart Labs, we strive to maintain transparency and fairness in all our services.</p>
                <ul>
                    <li>All payments made through our website are non-refundable under any circumstances.</li>
                    <li>Once a course is purchased, the payment cannot be transferred to another course, class, or programme.</li>
                    <li>Students are advised to carefully review course details before making a payment to ensure the correct course is selected.</li>
                    <li>Payments made for a course are valid for one individual only. Access cannot be shared, transferred, or reassigned to another person.</li>
                    <li>Smart Labs is not responsible for incorrect course selection, failure to attend classes, or personal schedule conflicts after payment is completed.</li>
                    <li>By proceeding with payment, you acknowledge and agree to this refund policy.</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="privacy" className="scroll-mt-24">
              <CardHeader>
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Privacy Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>Smart Labs respects your privacy and is committed to protecting your personal information.</p>
                 <ul>
                    <li>We collect personal details such as name, email address, contact number, and payment information solely for registration, communication, and service delivery purposes.</li>
                    <li>All payment transactions are processed securely through trusted third-party payment gateways. Smart Labs does not store sensitive payment details.</li>
                    <li>Personal information will not be shared, sold, or disclosed to third parties except where required by law or necessary to provide our services.</li>
                    <li>We may use your contact details to send important updates related to your courses, schedules, or platform improvements.</li>
                    <li>Students are responsible for maintaining the confidentiality of their login credentials.</li>
                    <li>By using our website, you consent to the collection and use of information as outlined in this policy.</li>
                </ul>
                <h2>Services that process your data</h2>
                <ul>
                    <li><strong>Google Firebase</strong> stores your account, course progress and practice results.</li>
                    <li><strong>Vercel</strong> hosts this website.</li>
                    <li><strong>PayHere</strong> processes card and online payments. We never see or store your full card number.</li>
                    <li><strong>Google Gemini AI</strong> scores the essays, summaries and other answers you submit to our AI practice tools. Only the text or audio of your answer is sent, not your name or contact details.</li>
                    <li><strong>YouTube</strong> plays the videos embedded on our pages.</li>
                    <li><strong>Meta (Facebook)</strong> measures how our adverts perform (see Cookies below).</li>
                </ul>
                <h2>How long we keep your data</h2>
                <ul>
                    <li>We keep your account and learning records while your account is active, so you can return to your courses and results.</li>
                    <li>Payment records are kept for as long as accounting and tax law requires.</li>
                    <li>When you delete your account, we remove your personal details, except records we must keep by law.</li>
                </ul>
                <h2>Your rights</h2>
                <ul>
                    <li>You can ask to see, correct or delete the personal information we hold about you.</li>
                    <li>You can delete your account at any time from the <Link href="/delete-account">account deletion page</Link>.</li>
                    <li>You can unsubscribe from marketing messages at any time.</li>
                </ul>
                <h2>Children</h2>
                <ul>
                    <li>Learners under 18 should use our website and pay for courses only with a parent or guardian's permission.</li>
                </ul>
                <h2>Contact us about privacy</h2>
                <p>Email <a href="mailto:info@smartlabs.lk">info@smartlabs.lk</a> or call 076 691 4650. We reply to privacy requests within 30 days.</p>
              </CardContent>
            </Card>

            <Card id="cookies" className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Cookie className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Cookie Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>Cookies are small files your browser stores for a website.</p>
                <ul>
                    <li><strong>Essential:</strong> keep you signed in and remember your settings, such as dark mode. The site does not work without them.</li>
                    <li><strong>Advertising measurement:</strong> the Meta (Facebook) Pixel tells us which adverts bring visitors to our website.</li>
                    <li><strong>Embedded videos:</strong> YouTube may set its own cookies when you play a video.</li>
                </ul>
                <p>You can block or delete cookies in your browser settings. Blocking essential cookies will sign you out.</p>
              </CardContent>
            </Card>

            <Card id="terms" className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary rounded-lg">
                        <FileText className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Terms and Conditions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p>Welcome to Smart Labs. By accessing our website and enrolling in courses, you agree to the following terms:</p>
                <h2>Course Access</h2>
                <ul>
                    <li>Course access is granted only to the individual who completed the payment.</li>
                    <li>Sharing login credentials or course materials with others is strictly prohibited.</li>
                </ul>
                <h2>Payments</h2>
                <ul>
                    <li>All payments must be completed through the website or approved payment methods.</li>
                    <li>Once payment is made, it cannot be reversed, transferred, or reassigned.</li>
                </ul>
                 <h2>Course Selection</h2>
                <ul>
                    <li>Students are solely responsible for selecting the correct course before payment.</li>
                    <li>Smart Labs will not change or adjust enrollments due to incorrect selection.</li>
                </ul>
                 <h2>Usage Policy</h2>
                <ul>
                    <li>Course materials, recordings, and resources are for personal educational use only.</li>
                    <li>Any reproduction, redistribution, or commercial use is not permitted.</li>
                </ul>
                 <h2>Platform Changes</h2>
                <ul>
                    <li>Smart Labs reserves the right to modify course content, schedules, instructors, or platform features, when necessary, while maintaining educational quality.</li>
                </ul>
                 <h2>Termination of Access</h2>
                <ul>
                    <li>Violation of these terms may result in suspension or termination of access without refund.</li>
                </ul>
                 <h2>Liability</h2>
                <ul>
                    <li>Smart Labs is not responsible for technical issues arising from a student’s device, internet connection, or external factors beyond our control.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
