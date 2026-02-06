export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
  category: "Workshop" | "Seminar" | "Live Class" | "Special Offer";
  link: string;
  buttonText: string;
}

export const events: Event[] = [
  {
    id: "pte-masterclass-2026",
    title: "PTE Success Masterclass",
    description: "Join our expert-led masterclass to decode the latest PTE scoring patterns. Get 5 hours of intensive training and 2 mock tests for free!",
    date: "February 25, 2026",
    image: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2070&auto=format&fit=crop",
    category: "Workshop",
    link: "/signup",
    buttonText: "Register Now"
  },
  {
    id: "ielts-writing-workshop",
    title: "IELTS Band 8.5 Writing Workshop",
    description: "Master the art of academic writing with our specialized clinic. Learn how to structure Band 8+ essays and reports.",
    date: "March 10, 2026",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop",
    category: "Seminar",
    link: "/signup",
    buttonText: "Book Your Seat"
  },
  {
    id: "smart-labs-launch-promo",
    title: "Smart Labs Launch Celebration",
    description: "Celebrating our new LMS launch! Get a flat 30% discount on all premium courses for the next 48 hours.",
    date: "Limited Time Only",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
    category: "Special Offer",
    link: "/pte",
    buttonText: "Claim Offer"
  }
];
