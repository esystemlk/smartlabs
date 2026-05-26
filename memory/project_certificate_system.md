---
name: project-certificate-system
description: Certificate request system built for smartlabs.lk — PTE completion certificates and letters
metadata:
  type: project
---

Built a full certificate request system. All new files, zero changes to existing features.

**Why:** Students who complete PTE training with Smart Labs LK need an official certificate and letter signed by Lahiruka Weeraratne (Lecturer).

**How to apply:** When touching certificate-related code, refer to the file list below.

## Pricing
- Digital PDF: LKR 1,500 — emailed as PDF attachment
- Printed & Signed: LKR 3,500 — posted to Sri Lanka only
- International printed: Contact hotline 077 453 3233 (no online payment for international)

## Files Created
- `src/types/certificate.ts` — shared types (CertificateRequest, CertType, etc.)
- `src/lib/services/certificate.service.ts` — Firestore CRUD (server-only)
- `src/lib/pdf/certificate-template.tsx` — react-pdf certificate (landscape A4, navy/gold)
- `src/lib/pdf/letter-template.tsx` — react-pdf letter (portrait A4, professional letterhead)
- `src/components/certificates/CertificatePreview.tsx` — HTML preview with anti-screenshot protection
- `src/components/certificates/RequestForm.tsx` — 4-step wizard form
- `src/components/certificates/AdminCertificateTable.tsx` — admin management table
- `src/app/dashboard/certificate-request/page.tsx` — student page
- `src/app/admin/dashboard/certificates/page.tsx` — admin page
- `src/app/api/certificates/request/route.ts` — create request
- `src/app/api/certificates/create-payment/route.ts` — PayHere payment hash
- `src/app/api/certificates/approve/route.ts` — generate PDF + email student
- `src/app/api/certificates/reject/route.ts` — reject + email student
- `src/app/api/certificates/my-requests/route.ts` — student's own requests
- `src/app/api/admin/certificates/route.ts` — all requests (admin)
- `src/app/api/payhere/certificate-notify/route.ts` — payment webhook

## Firestore Collection
`certificate_requests/{requestId}` — see src/types/certificate.ts for schema

## Dependencies Added
- `@react-pdf/renderer` — server-side PDF generation only

## Existing Files Edited (minor additions only)
- `src/app/dashboard/page.tsx` — added "My Certificate" quick link
- `src/app/admin/dashboard/page.tsx` — added "Certificate Requests" nav card
