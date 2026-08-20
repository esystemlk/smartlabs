import { redirect } from 'next/navigation';

// The old course catalogue page has been retired — PTE course plans now live
// on the registration page. Any /courses link lands there.
export default function CoursesPage() {
  redirect('/pte-registration');
}
