'use client';

import Link from "next/link";
import Image from "next/image";
import { Youtube, Mail, Phone, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { SeasonalLogo } from '@/components/seasonal/seasonal-logo';
import { DEV_CONSOLE_PATH } from "@/lib/site-mode";
import { LMS_URL, IELTS_URL } from "@/lib/constants";

const columns: { title: string; links: { name: string; href: string }[] }[] = [
  {
    title: "Courses",
    links: [
      { name: "All Courses", href: "/courses" },
      { name: "PTE Registration", href: "/pte-registration" },
      { name: "IELTS Studio", href: IELTS_URL },
      { name: "Grammar Clinic", href: "/courses/grammar-clinic" },
      { name: "One-to-One Sessions", href: "/one-to-one" },
      { name: "Feedback Club", href: "/feedback-club" },
      { name: "Corporate Training", href: "/corporate-training" },
      { name: "Workshops", href: "/workshops" },
      { name: "Webinar", href: "/webinar" },
      { name: "LMS Portal", href: LMS_URL },
    ],
  },
  {
    title: "Practice",
    links: [
      { name: "Free Level Test", href: "/level-test" },
      { name: "PTE Mock Tests", href: "/mock-tests" },
      { name: "AI Write Essay", href: "/ai-essay-practice" },
      { name: "Summarize Written Text", href: "/swt-trainer" },
      { name: "Summarize Spoken Text", href: "/ai-sst-practice" },
      { name: "Write From Dictation", href: "/ai-wfd-practice" },
      { name: "IELTS Mock Tests", href: IELTS_URL },
      { name: "Study Plan", href: "/study-plan" },
      { name: "Credits", href: "/credits" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "Videos", href: "/videos" },
      { name: "Resources", href: "/resources" },
      { name: "Essay Topics 2026", href: "/resources/essay-topics-2026" },
      { name: "PTE Exam Guide", href: "/pte-exam-guide" },
      { name: "Website Guide", href: "/guide" },
      { name: "Apps", href: "/apps" },
      { name: "Windows App", href: "/download/windows" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "Contact Us", href: "/contact" },
      { name: "Help Center", href: "/support" },
      { name: "Become a Partner", href: "/partners" },
      { name: "Partner Login", href: "/partners/login" },
      { name: "Certificate Request", href: "/dashboard/certificate-request" },
      { name: "Refund Policy", href: "/policies#refunds" },
      { name: "Delete Account", href: "/delete-account" },
    ],
  },
];

const phones = [
  { label: "076 691 4650", tel: "+94766914650" },
  { label: "077 453 3233", tel: "+94774533233" },
  { label: "070 691 4652", tel: "+94706914652" },
];

const MAP_SRC = "https://maps.google.com/maps?q=Smart%20Labs%2C%2019%2F3%20Poorwarama%20Rd%2C%20Nugegoda&z=16&output=embed";
const MAP_LINK = "https://www.google.com/maps/search/?api=1&query=Smart+Labs+19%2F3+Poorwarama+Rd+Nugegoda";

export default function Footer() {
  const pathname = usePathname();
  const isSpecialLayout = pathname.startsWith('/studio') || pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/welcome' || pathname.startsWith('/payment')
    || pathname === '/ai-sst-practice' || pathname === '/swt-trainer' || pathname.startsWith('/ai-wfd-practice') || pathname.startsWith('/mock/') || pathname === '/site-status' || pathname.startsWith(DEV_CONSOLE_PATH);

  if (isSpecialLayout) return null;

  return (
    // Extra bottom space on the homepage so the phone tab bar never covers the legal links.
    // relative z-10: stays above the homepage's fixed blurred backdrop.
    <footer className={`relative z-10 bg-[#f5f7fc] text-[#0a1733] border-t border-white ${pathname === '/' ? 'pb-28 md:pb-0' : ''}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Contact + map */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 rounded-[28px] border border-white bg-white p-6 sm:p-8 shadow-[0_14px_34px_-26px_rgba(10,23,51,0.4)]">
            <Link href="/" className="inline-flex items-center rounded-2xl bg-[#f5f7fc] px-4 py-2">
              <SeasonalLogo area="footer" />
            </Link>
            <p className="mt-4 text-sm text-slate-600 max-w-sm">PTE and IELTS coaching with expert lecturers, real exam mocks and AI practice. Online and in Nugegoda.</p>

            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-[#d97706]" aria-hidden="true" />
                <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-[#2563eb] transition-colors">19/3 Poorwarama Rd, Nugegoda 10250, Sri Lanka</a>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-[#d97706]" aria-hidden="true" />
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {phones.map(p => <a key={p.tel} href={`tel:${p.tel}`} className="hover:text-[#2563eb] transition-colors whitespace-nowrap">{p.label}</a>)}
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-[#d97706]" aria-hidden="true" />
                <a href="mailto:info@smartlabs.lk" className="hover:text-[#2563eb] transition-colors">info@smartlabs.lk</a>
              </li>
              <li className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-[#d97706]" aria-hidden="true" />
                <span>Sat – Thu: 9:00 AM – 6:30 PM · Friday: Closed</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://www.youtube.com/@SmartLabs-Official" target="_blank" rel="noopener noreferrer" aria-label="Smart Labs on YouTube"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors">
                <Youtube className="h-4 w-4" aria-hidden="true" /> YouTube
              </a>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#fab605] px-4 py-2 text-sm font-bold text-[#0a1733] hover:bg-[#fcd34d] transition-colors">
                Contact us <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3 relative min-h-[280px] overflow-hidden rounded-[28px] border border-white bg-white p-1.5 shadow-[0_14px_34px_-26px_rgba(10,23,51,0.4)]">
            <iframe
              title="Smart Labs on Google Maps"
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[268px] w-full rounded-[22px] border-0"
            />
            <a href={MAP_LINK} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#0a1733] px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-[#2563eb] transition-colors">
              Get directions <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* All links */}
        <nav aria-label="Footer" className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10">
          {columns.map(col => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563eb]">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(l => (
                  <li key={l.name}>
                    <Link href={l.href} className="text-sm text-slate-600 hover:text-[#0a1733] transition-colors">{l.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* PayHere */}
        <div className="mt-12 flex justify-center rounded-2xl bg-white p-3 border border-white shadow-[0_10px_26px_-22px_rgba(10,23,51,0.4)]">
          <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
            <Image
              src="https://www.payhere.lk/downloads/images/payhere_long_banner.png"
              alt="Payments secured by PayHere"
              width={800}
              height={100}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
              unoptimized
            />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} Smart Labs. All rights reserved.</p>
            <p>
              Website Powered and Hosted by{' '}
              <a href="https://www.esystemlk.xyz" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2563eb] hover:underline">Esystemlk</a>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/policies#privacy" className="hover:text-[#0a1733] transition-colors">Privacy</Link>
            <Link href="/policies#terms" className="hover:text-[#0a1733] transition-colors">Terms</Link>
            <Link href="/policies#cookies" className="hover:text-[#0a1733] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
