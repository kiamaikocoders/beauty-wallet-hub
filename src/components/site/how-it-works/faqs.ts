import { ksh, pct, type CoinRules } from "@/lib/pricing";

export function howItWorksFaqs(rules: CoinRules) {
  const inter = pct(rules.tiers.intermediate.discount);
  const prem = pct(rules.tiers.premium.discount);
  return [
    {
      question: "How much is one coin worth?",
      answer: `About ${ksh(rules.kshPerCoin)} of service value. Intermediate members need ${inter} fewer coins for the same service and Premium members ${prem} fewer.`,
    },
    {
      question: "Do I pay the salon anything?",
      answer:
        "No. Your coins cover the service. Nothing changes hands at the salon — providers are paid by Beauty Wallet after your PIN check-in.",
    },
    {
      question: "Can I book for someone else?",
      answer:
        "Yes. Book under your wallet and share the arrival PIN with them. Coins still come from your balance.",
    },
    {
      question: "What happens if I cancel?",
      answer:
        "Cancel before the visit and the coins on hold return to your wallet. Late cancellations follow the booking rules shown when you book.",
    },
  ] as const;
}
