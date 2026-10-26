export type LegalSlug = "terms" | "privacy" | "coin-policy" | "provider-agreement" | "cookies";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type LegalDoc = {
  slug: LegalSlug;
  navLabel: string;
  title: string;
  updated: string;
  summaryTitle: string;
  summary: string;
  sections: LegalSection[];
  questions: string;
};

export const LEGAL_NAV: { slug: LegalSlug; label: string }[] = [
  { slug: "terms", label: "Terms of service" },
  { slug: "privacy", label: "Privacy policy" },
  { slug: "coin-policy", label: "Coin policy" },
  { slug: "provider-agreement", label: "Provider agreement" },
  { slug: "cookies", label: "Cookie notice" },
];

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  "coin-policy": {
    slug: "coin-policy",
    navLabel: "Coin policy",
    title: "Coin policy",
    updated: "Last updated 1 October 2026",
    summaryTitle: "The short version",
    summary:
      "Coins are for booking services, not cash. 80% of unused coins roll over for one month, and 20% are taken back. Coins only reach a provider after your PIN check-in.",
    sections: [
      {
        id: "what-coins-are",
        title: "What coins are",
        paragraphs: [
          "Coins are an internal unit you use to book services on Beauty Wallet. They are not money, e-money or a deposit, and cannot be withdrawn, sold or transferred to another person.",
          "One coin represents about Ksh 10 of service value. Members on higher tiers need fewer coins for the same service.",
        ],
      },
      {
        id: "how-you-receive-coins",
        title: "How you receive coins",
        paragraphs: [
          "Your plan adds coins to your wallet at the start of each billing month: Basic 700 coins, Intermediate 1,500 coins and Premium 2,000 coins.",
          "You can buy top-up coins at any time at Ksh 10 per coin. Top-up coins follow the same rules as plan coins.",
        ],
      },
      {
        id: "spending-coins",
        title: "Spending coins",
        paragraphs: [
          "When you book, the coin price is moved from your available balance to “on hold”. Coins are released to the provider only after you check in with your arrival PIN and the service is complete.",
        ],
      },
      {
        id: "rollover-and-expiry",
        title: "Rollover and expiry",
        paragraphs: [
          "At renewal, 80% of your unused coins roll over to the new month. Rolled-over coins expire at the end of that month. The other 20% are taken back at renewal.",
        ],
      },
      {
        id: "cancellations-and-refunds",
        title: "Cancellations and refunds",
        paragraphs: [
          "If a booking is cancelled within the cancellation window, the held coins return to your available balance straight away. Coins are never refunded as cash.",
        ],
      },
    ],
    questions: "Questions about this policy? Email legal@beautywallet.co.ke",
  },

  terms: {
    slug: "terms",
    navLabel: "Terms of service",
    title: "Terms of service",
    updated: "Last updated 1 October 2026",
    summaryTitle: "The short version",
    summary:
      "Beauty Wallet Ltd runs a membership platform for beauty and grooming in Kenya. You pay in Ksh, receive coins, and spend them at vetted providers. Coins are not cash.",
    sections: [
      {
        id: "who-we-are",
        title: "Who we are",
        paragraphs: [
          "These terms are between you and Beauty Wallet Ltd (“Beauty Wallet”, “we”, “us”), a company registered in Kenya with its principal place of business in Nairobi.",
          "By creating an account, buying a plan or gift, or using the site or app, you agree to these terms and to our Coin policy and Privacy policy.",
        ],
      },
      {
        id: "the-service",
        title: "The service",
        paragraphs: [
          "Beauty Wallet lets members subscribe for a monthly coin wallet and book services at independent salons, barbers and spas that have joined the network.",
          "Providers set their own menus and cash-anchor prices. We convert those prices into coins using the rates in the Coin policy. We are not the provider of the beauty or grooming service itself.",
        ],
      },
      {
        id: "accounts-and-eligibility",
        title: "Accounts and eligibility",
        paragraphs: [
          "You must be at least 18 and able to form a binding contract under Kenyan law. You are responsible for keeping your phone number, email and arrival PIN confidential.",
          "We may suspend or close an account that we reasonably believe is abusive, fraudulent or used to circumvent coin rules.",
        ],
      },
      {
        id: "payments",
        title: "Payments",
        paragraphs: [
          "Plans, gifts and top-ups are paid in Kenya Shillings by M-Pesa or card. Prices shown include applicable taxes unless we say otherwise.",
          "Subscription fees renew each billing month until you cancel. Cancelling stops the next renewal; unused coins still follow the Coin policy.",
        ],
      },
      {
        id: "coins",
        title: "Coins",
        paragraphs: [
          "Coins are an internal booking unit. They are not e-money, a stored-value facility or a claim for cash. Full rules are in the Coin policy, which forms part of these terms.",
          "80% of unused coins roll over for one month. The other 20% are taken back at renewal. Coins only leave your wallet for a provider after PIN check-in and completion of the service.",
        ],
      },
      {
        id: "bookings-and-conduct",
        title: "Bookings and conduct",
        paragraphs: [
          "When you book, we place the coin price on hold. You must arrive with a valid pass and treat providers and their premises with respect.",
          "Providers may refuse service for late arrival, health or safety reasons, or breach of their house rules. Held coins return if a booking is cancelled within the stated window.",
        ],
      },
      {
        id: "liability",
        title: "Liability",
        paragraphs: [
          "We work to keep the platform reliable, but we do not guarantee uninterrupted access or that every provider will always be available.",
          "To the fullest extent allowed by Kenyan law, Beauty Wallet is not liable for the quality of a provider’s service, for loss arising from provider acts or omissions, or for indirect or consequential loss. Nothing in these terms limits liability for fraud or for death or personal injury caused by negligence where such a limit is not permitted.",
        ],
      },
      {
        id: "governing-law",
        title: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of Kenya. Courts in Nairobi have non-exclusive jurisdiction, without limiting any mandatory consumer protections that apply.",
        ],
      },
    ],
    questions: "Questions about these terms? Email legal@beautywallet.co.ke",
  },

  privacy: {
    slug: "privacy",
    navLabel: "Privacy policy",
    title: "Privacy policy",
    updated: "Last updated 1 October 2026",
    summaryTitle: "The short version",
    summary:
      "We collect what we need to run wallets, bookings and payments in Kenya. We follow the Data Protection Act, 2019. We do not sell your personal data.",
    sections: [
      {
        id: "who-controls-your-data",
        title: "Who controls your data",
        paragraphs: [
          "Beauty Wallet Ltd is the data controller for personal data processed through beautywallet.co.ke and our apps. You can reach us at privacy@beautywallet.co.ke or by writing to our Nairobi office.",
          "We process personal data in line with Kenya’s Data Protection Act, 2019 (“DPA 2019”) and guidance from the Office of the Data Protection Commissioner.",
        ],
      },
      {
        id: "what-we-collect",
        title: "What we collect",
        paragraphs: [
          "Account data: name, phone number, email, password or auth tokens, and plan or gift status.",
          "Wallet and booking data: coin balances, holds, renewals, arrival PINs, providers visited, and service history.",
          "Payment data: M-Pesa or card references handled by our payment partners; we do not store full card numbers.",
          "Technical data: device, browser, approximate location from IP, and cookies or similar technologies as described in the Cookie notice.",
        ],
      },
      {
        id: "why-we-use-it",
        title: "Why we use it",
        paragraphs: [
          "We use personal data to create and secure your account, issue and redeem coins, run bookings and PIN check-in, process payments and refunds, prevent fraud, and reply to support requests.",
          "Where the DPA 2019 requires consent (for example some marketing messages), we ask first and you can withdraw it. Otherwise we rely on contract performance, legal obligation or legitimate interests that do not override your rights.",
        ],
      },
      {
        id: "sharing",
        title: "Sharing",
        paragraphs: [
          "Providers see the booking details they need to deliver the service (name or display name, arrival window, PIN status and services booked). They do not receive your full payment history.",
          "We share data with processors who host our systems, send SMS or email, or process M-Pesa and card payments, under contracts that require them to protect the data.",
          "We may disclose information when required by Kenyan law, a court or a regulator such as the ODPC.",
        ],
      },
      {
        id: "retention-and-security",
        title: "Retention and security",
        paragraphs: [
          "We keep account and transaction records for as long as your membership is active and for a reasonable period afterwards to meet tax, dispute and legal requirements.",
          "We use access controls, encryption in transit and staff training to protect personal data. No method of transmission is perfectly secure; please keep your PIN private.",
        ],
      },
      {
        id: "your-rights",
        title: "Your rights under the DPA 2019",
        paragraphs: [
          "You may request access to your personal data, correction of inaccurate data, deletion where the law allows, restriction of processing, and objection to certain processing including direct marketing.",
          "You may lodge a complaint with the Office of the Data Protection Commissioner. To exercise rights with us, email privacy@beautywallet.co.ke. We may need to verify your identity first.",
        ],
      },
      {
        id: "children",
        title: "Children",
        paragraphs: [
          "Beauty Wallet membership is for adults 18 and over. We do not knowingly collect personal data from children for membership accounts.",
        ],
      },
    ],
    questions: "Questions about privacy? Email privacy@beautywallet.co.ke",
  },

  "provider-agreement": {
    slug: "provider-agreement",
    navLabel: "Provider agreement",
    title: "Provider agreement",
    updated: "Last updated 1 October 2026",
    summaryTitle: "The short version",
    summary:
      "Providers list services, honour coin bookings and receive payouts after PIN check-in. Members never pay cash on site for coin bookings.",
    sections: [
      {
        id: "joining-the-network",
        title: "Joining the network",
        paragraphs: [
          "This agreement is between Beauty Wallet Ltd and the salon, barber, spa or independent professional (“Provider”) whose application we approve.",
          "You must hold any licences required under Kenyan law, keep accurate menu and pricing information, and maintain the standard of care members reasonably expect.",
        ],
      },
      {
        id: "listings-and-class",
        title: "Listings and class",
        paragraphs: [
          "We assign a provider class (Basic, Intermediate or Premium) that affects which members can book you without an unlock fee and how coins are priced against your cash anchors.",
          "You may update services, minutes and cash-anchor prices in your dashboard. Misleading prices or photos may lead to suspension.",
        ],
      },
      {
        id: "bookings-and-pins",
        title: "Bookings and PINs",
        paragraphs: [
          "When a member books, coins move to “on hold”. You must check the arrival PIN in the app before starting the service. Coins are released to your payout balance only after check-in and completion.",
          "Do not ask members for cash, M-Pesa or card payment for services already paid in coins. Doing so is a material breach.",
        ],
      },
      {
        id: "payouts",
        title: "Payouts",
        paragraphs: [
          "Payouts follow the rates and bands published in your dashboard and our payout schedule. We settle to the Kenyan mobile money or bank account you register.",
          "We may withhold or reverse payouts for confirmed no-shows caused by you, fraudulent PIN use, or chargebacks tied to your bookings.",
        ],
      },
      {
        id: "data-and-privacy",
        title: "Data and privacy",
        paragraphs: [
          "You receive limited member data to fulfil bookings. You are an independent controller or processor for how you handle that data on your premises and must comply with the Data Protection Act, 2019.",
          "Do not use member contact details for marketing outside Beauty Wallet unless the member clearly agrees with you separately.",
        ],
      },
      {
        id: "suspension-and-ending",
        title: "Suspension and ending",
        paragraphs: [
          "Either party may end this agreement on written notice as set out in the onboarding pack. We may suspend access immediately for safety, fraud or repeated member complaints.",
          "On exit, open bookings must be honoured or cancelled so held coins return to members. Settled payouts already paid are not clawed back except for proven fraud.",
        ],
      },
    ],
    questions: "Questions for providers? Email providers@beautywallet.co.ke",
  },

  cookies: {
    slug: "cookies",
    navLabel: "Cookie notice",
    title: "Cookie notice",
    updated: "Last updated 1 October 2026",
    summaryTitle: "The short version",
    summary:
      "We use necessary cookies to keep you signed in and optional analytics to improve the product. You can control non-essential cookies in your browser settings.",
    sections: [
      {
        id: "what-are-cookies",
        title: "What are cookies",
        paragraphs: [
          "Cookies are small files stored on your device. We also use similar technologies such as local storage (for example saving an arrival pass for offline use under bw:lastPass).",
          "This notice explains what we use and why, under Kenya’s Data Protection Act, 2019 and related guidance.",
        ],
      },
      {
        id: "necessary-cookies",
        title: "Necessary cookies",
        paragraphs: [
          "These are required for security, authentication, fraud prevention and core features such as keeping your session and remembering cookie preferences. The site cannot work properly without them.",
        ],
      },
      {
        id: "analytics-and-performance",
        title: "Analytics and performance",
        paragraphs: [
          "Where enabled, we use analytics cookies or similar tools to understand how pages are used so we can fix errors and improve journeys such as booking and gifting.",
          "These are optional. You can refuse them via our banner when shown, or by blocking cookies in your browser. Refusing them does not stop you from using coin wallets or bookings.",
        ],
      },
      {
        id: "how-long",
        title: "How long they last",
        paragraphs: [
          "Session cookies expire when you close the browser. Persistent cookies and local storage entries last for a set period or until you clear them. Offline pass data stays until you clear site data or a newer pass replaces it.",
        ],
      },
      {
        id: "managing-cookies",
        title: "Managing cookies",
        paragraphs: [
          "Most browsers let you block or delete cookies. If you block all cookies, some sign-in and payment steps may fail.",
          "For more on how we handle personal data generally, see the Privacy policy.",
        ],
      },
    ],
    questions: "Questions about cookies? Email privacy@beautywallet.co.ke",
  },
};

export function getLegalDoc(slug: string): LegalDoc | undefined {
  if (slug in LEGAL_DOCS) return LEGAL_DOCS[slug as LegalSlug];
  return undefined;
}
