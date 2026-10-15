export const PROVIDER_FAQS = [
  {
    question: "How is my payout rate set?",
    answer:
      "We agree a rate with you during vetting, based on your category, location and service level. It stays fixed for at least six months.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Every Friday for bookings completed in the prior week, paid to your M-Pesa till, paybill or bank.",
  },
  {
    question: "Can I still serve walk-in clients?",
    answer:
      "Yes. Members book prepaid slots through Beauty Wallet. Walk-ins and your own clients stay yours.",
  },
  {
    question: "What does it cost to join?",
    answer: "Nothing. Free to list, no setup fees, and no card or cash fees on payouts.",
  },
] as const;

export const REQUIREMENTS = [
  "A registered business or licensed freelancer",
  "At least one year serving clients in Nairobi",
  "Clean, safe space or a kit for home visits",
  "An M-Pesa till, paybill or bank account",
  "A smartphone to check PINs and manage bookings",
] as const;

export const STEPS = [
  {
    icon: "clipboard-check",
    number: "01",
    title: "Apply and get vetted",
    body: "Tell us about your business. We visit, check hygiene and quality, and agree your payout rate.",
  },
  {
    icon: "calendar-slots",
    number: "02",
    title: "Set your menu and hours",
    body: "Add services with your walk-in prices, photos and open slots. Members see them in coins.",
  },
  {
    icon: "wallet",
    number: "03",
    title: "Check PINs, get paid weekly",
    body: "Members show a 4-digit PIN when they arrive. Completed bookings are paid out every Friday.",
  },
] as const;
