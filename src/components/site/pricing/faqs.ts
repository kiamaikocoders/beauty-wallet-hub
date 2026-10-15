import { pct, type CoinRules } from "@/lib/pricing";

export function pricingFaqs(rules: CoinRules) {
  const roll = pct(rules.rolloverPct);
  return [
    {
      question: "Can I change plans later?",
      answer:
        "Yes. Upgrades apply straight away and you get the extra coins for the rest of the month. Downgrades apply from your next renewal.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. Cancel from your wallet anytime. You keep access until the end of the month you’ve paid for.",
    },
    {
      question: "Do coins expire?",
      answer: `Most unused coins expire on your renewal date. ${roll} roll over into next month and last one more month.`,
    },
    {
      question: "What payment methods do you accept?",
      answer: "M-Pesa and any Visa or Mastercard debit or credit card.",
    },
  ] as const;
}
