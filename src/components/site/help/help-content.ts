export type HelpTopic = {
  id: string;
  icon: string;
  title: string;
  blurb: string;
  count: string;
  keywords: string[];
};

export type HelpArticle = {
  id: string;
  question: string;
  answer: string;
  topic: string;
  keywords: string[];
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    icon: "arrow-right",
    title: "Getting started",
    blurb: "Plans, sign-up, first booking",
    count: "12 articles",
    keywords: ["plan", "sign-up", "signup", "first", "booking", "start"],
  },
  {
    id: "coins",
    icon: "wallet",
    title: "Coins and wallet",
    blurb: "Balances, rollover, top-ups",
    count: "18 articles",
    keywords: ["coin", "wallet", "balance", "rollover", "top-up", "topup"],
  },
  {
    id: "payments",
    icon: "phone",
    title: "Payments and billing",
    blurb: "M-Pesa, cards, renewals, receipts",
    count: "15 articles",
    keywords: ["mpesa", "m-pesa", "card", "renewal", "receipt", "payment", "billing"],
  },
  {
    id: "bookings",
    icon: "calendar",
    title: "Bookings",
    blurb: "Changes, cancellations, PINs",
    count: "21 articles",
    keywords: ["booking", "cancel", "pin", "arrival", "miss"],
  },
  {
    id: "trust",
    icon: "shield-check",
    title: "Trust and safety",
    blurb: "Vetting, disputes, refunds",
    count: "9 articles",
    keywords: ["vetting", "dispute", "refund", "safety", "trust"],
  },
  {
    id: "account",
    icon: "user",
    title: "Your account",
    blurb: "Profile, phone number, privacy",
    count: "11 articles",
    keywords: ["profile", "phone", "privacy", "account", "m-pesa number"],
  },
];

/** Popular articles — answers grounded in live coin rules. */
export const POPULAR_ARTICLES: HelpArticle[] = [
  {
    id: "coins-not-updated",
    question: "Why haven’t my coins updated after paying?",
    answer:
      "M-Pesa and card top-ups usually land within a few minutes. If your renewal cleared but the balance is unchanged, wait for the confirmation SMS, then refresh the app. Still missing after 15 minutes? Message us from Contact with your M-Pesa code.",
    topic: "payments",
    keywords: ["coins not showing", "coins", "mpesa", "renewal", "updated", "paying"],
  },
  {
    id: "rollover",
    question: "How does the 80% rollover work?",
    answer:
      "At renewal, 80% of your unused coins carry into the new month and can be used until that month ends. The other 20% are taken back. One coin is worth Ksh 10 of service value.",
    topic: "coins",
    keywords: ["rollover", "80%", "unused", "expire"],
  },
  {
    id: "basic-unlock",
    question: "Can a Basic member book an Intermediate provider?",
    answer:
      "Yes. Basic members can unlock a higher-class provider by paying a 10% unlock fee in coins on that booking. Intermediate and Premium members already cover those studios in their plan.",
    topic: "coins",
    keywords: ["basic", "intermediate", "unlock", "fee", "book"],
  },
  {
    id: "miss-booking",
    question: "What happens if I miss my booking?",
    answer:
      "Coins stay held until the provider confirms arrival with your PIN. If you miss the slot without cancelling in time, the hold may still release back to your wallet after the dispute window — open a dispute within 48 hours if something went wrong.",
    topic: "bookings",
    keywords: ["miss", "booking", "no-show", "cancel", "pin"],
  },
  {
    id: "mpesa-number",
    question: "How do I change my M-Pesa number?",
    answer:
      "Update the phone on your account in the app under Your account. New renewals and top-ups use the updated number; receipts follow the same contact.",
    topic: "account",
    keywords: ["m-pesa", "mpesa", "phone", "number", "change"],
  },
];

export const COIN_FAQS: HelpArticle[] = [
  {
    id: "rollover-faq",
    question: "How does the 80% rollover work?",
    answer:
      "At renewal, 80% of your unused coins carry into the new month and can be used until that month ends. The other 20% are taken back.",
    topic: "coins",
    keywords: ["rollover", "80%"],
  },
  {
    id: "pause",
    question: "Can I pause my plan?",
    answer:
      "You can cancel before the next renewal so no new coins are issued. Pausing mid-cycle isn’t available yet — use remaining coins or top up with M-Pesa or card if you need more.",
    topic: "payments",
    keywords: ["pause", "cancel", "plan", "subscription"],
  },
  {
    id: "home-visits",
    question: "Do coins work for home visits?",
    answer:
      "Yes on plans that include them. Coins are held in escrow until the provider enters your arrival PIN, then released. Convenience add-ons (travel, meals) are priced in coins too.",
    topic: "bookings",
    keywords: ["home", "visit", "office", "pin"],
  },
  {
    id: "refunds",
    question: "How do refunds work?",
    answer:
      "Raise a dispute from the booking within 48 hours. We review with the provider and can redo the service or return coins to your wallet. Cash at the salon is never required.",
    topic: "trust",
    keywords: ["refund", "dispute", "48"],
  },
];

export const SEARCH_CHIPS = ["Coins not showing", "Change plan", "Arrival PIN", "Refunds"] as const;

export function filterHelp(query: string): {
  topics: HelpTopic[];
  popular: HelpArticle[];
  faqs: HelpArticle[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { topics: HELP_TOPICS, popular: POPULAR_ARTICLES, faqs: COIN_FAQS };
  }
  const match = (hay: string[]) =>
    hay.some((h) => h.toLowerCase().includes(q) || q.includes(h.toLowerCase()));
  return {
    topics: HELP_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q) || match(t.keywords),
    ),
    popular: POPULAR_ARTICLES.filter(
      (a) =>
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        match(a.keywords),
    ),
    faqs: COIN_FAQS.filter(
      (a) =>
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        match(a.keywords),
    ),
  };
}
