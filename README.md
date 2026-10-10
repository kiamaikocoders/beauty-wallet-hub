# Beauty Wallet Hub

Build the Beauty Wallet platform as a PWA-ready web application with a public marketing presence and the three connected operational portals:

1. Brand & Design Direction:
- Palette: Charcoal, warm cream/alabaster, dusty rose/blush accents, and subtle pale gold badges matching the luxury grooming brand asset ('Curated beauty & grooming, styled securely').
- Currency: Kenyan Shillings (Ksh) throughout, anchored against internal subscription coins.

2. Public Marketing Experience (Landing / Before Login):
- High-impact luxury hero section explaining Beauty Wallet's subscription model for beauty and grooming for men and women.
- 'How It Works' visual steps (Subscribe & receive monthly coins, discover vetted salons across Nairobi with zero cash paid on site, arrive with your 4-digit pass).
- Tier & Pricing comparison (Basic, Intermediate, Premium) in Ksh with monthly coin allowances, perks, and tier discount badges.
- Curated Marketplace Preview showcasing popular treatments in Nairobi (Westlands, Kilimani, Karen) with Ksh cash reference and coin prices, plus tier-gated teasers.
- 'For Vendors' section highlighting steady demand, reduced marketing spend, and direct M-Pesa/bank payouts, with partner application form.
- FAQ and trust information.

3. Role Switcher & Portal Navigation:
Provide a quick demo/role switcher in the navigation so users can explore and test all three perspectives:
- User / Subscriber Portal:
  - Wallet balance display showing Available Coins vs. Escrow (Reserved) Coins.
  - Marketplace browse and search with tier gating (unlocked services vs. locked higher-tier treatments with upgrade prompts).
  - Booking drawer showing duration, Ksh cash anchor, tier discount, convenience add-ons, and Escrow Hold authorization.
  - Active booking pass with a dynamic 4-digit arrival PIN code and QR view.
  - Grouped booking option to bundle multiple services (e.g. hair + beard + facial) with combined coin savings.
- Vendor Portal ('The Order Board' Queue):
  - In-salon daily order board without cumbersome chair tracking or chair timers.
  - Quick top lookup bar for verifying 4-digit arrival PINs or 6-character walk-in tokens.
  - Clean appointment queue (Upcoming, In Service, Completed) showing customer name, service, and net vendor payout in Ksh.
  - One-tap 'Start Service' upon PIN validation and 'Mark Complete' to trigger escrow release.
  - Live summary of today's completed earnings in Ksh.
- Super Admin Portal (The Control Tower):
  - Operational dashboard with active subscribers, MRR, coins issued vs. redeemed, and active Nairobi vendors.
  - Vendor Vetting & Management queue: review applicant profiles, KYC documents, assign provider classes (Basic, Intermediate, Premium), and toggle Verified badges.
  - Coin Rules & Tier Manager: configure coin-to-Ksh ratios, monthly allowances, tier discounts, and rollover rules.
  - Payout Runs: batch vendor payout calculations in Ksh for M-Pesa / bank disbursements.
  - Live Bookings & Disputes monitor.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2bffcaad-a7fc-43eb-bf17-f564df126bd9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
