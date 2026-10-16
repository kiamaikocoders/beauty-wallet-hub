import type { TierId } from "@/lib/pricing";

export type TeamsSeatStatus = "active" | "invited" | "leaving" | "ended";

export type TeamsSeat = {
  id: string;
  fullName: string;
  phone: string;
  team: string;
  tier: TierId;
  coinsUsed: number;
  coinsAllowance: number;
  status: TeamsSeatStatus;
  statusLabel: string;
  initials: string;
};

export type TeamsInvoice = {
  id: string;
  number: string;
  period: string;
  seats: number;
  amountKsh: number;
  paidWith: string;
  status: "paid" | "due" | "overdue";
  statusLabel: string;
};

export const TEAMS_DEMO_SESSION_KEY = "bw-teams-hr";

export const TEAMS_DEMO = {
  company: "Savannah Logistics",
  companyLegal: "Savannah Logistics Ltd",
  hrName: "Lucy Njambi",
  hrTitle: "HR · Savannah Logistics",
  hrPhone: "0722 456 789",
  hrEmail: "hr@savannahlogistics.co.ke",
  billingEmail: "finance@savannahlogistics.co.ke",
  address: "Mombasa Road, Nairobi",
  nextInvoiceDate: "Sun 1 Nov",
  nextInvoiceKsh: 246_000,
  seats: 20,
  active: 18,
  invited: 2,
  coinsUsed: 11_420,
  coinsTotal: 24_600,
  booked: 14,
  paidSoFar: 687_000,
  tiers: [
    { tier: "basic" as TierId, seats: 8, monthlyKsh: 56_000, used: 2130, total: 5600 },
    { tier: "intermediate" as TierId, seats: 10, monthlyKsh: 150_000, used: 6440, total: 15000 },
    { tier: "premium" as TierId, seats: 2, monthlyKsh: 40_000, used: 2850, total: 4000 },
  ],
  notBooked: [
    { initials: "AW", name: "Ann Wairimu", line: "Basic · 700 left" },
    { initials: "PM", name: "Paul Mutiso", line: "Intermediate · 1,500 left" },
    { initials: "EN", name: "Esther Njeri", line: "Basic · 700 left" },
    { initials: "CO", name: "Collins Otieno", line: "Intermediate · 1,500 left" },
  ],
  waiting: [
    { initials: "BK", name: "Brian Kamau", line: "Invited Mon 12 Oct · Basic" },
    { initials: "SA", name: "Sharon Akinyi", line: "Invited Wed 14 Oct · Intermediate" },
  ],
  activity: [
    { title: "You invited Sharon Akinyi", when: "Wed 14 Oct" },
    { title: "Brian Kamau was invited by Aisha", when: "Mon 12 Oct" },
    { title: "October invoice paid by M-Pesa", when: "Thu 1 Oct · Ksh 246,000" },
    { title: "New coins added for 18 staff", when: "Thu 1 Oct" },
  ],
  seatsList: [
    {
      id: "s1",
      fullName: "Mercy Wambui",
      phone: "0711 204 556",
      team: "Operations",
      tier: "intermediate" as TierId,
      coinsUsed: 1120,
      coinsAllowance: 1500,
      status: "active" as TeamsSeatStatus,
      statusLabel: "Active",
      initials: "MW",
    },
    {
      id: "s2",
      fullName: "Kevin Ochieng",
      phone: "0722 318 940",
      team: "Warehouse",
      tier: "basic" as TierId,
      coinsUsed: 420,
      coinsAllowance: 700,
      status: "active" as TeamsSeatStatus,
      statusLabel: "Active",
      initials: "KO",
    },
    {
      id: "s3",
      fullName: "Grace Atieno",
      phone: "0733 562 118",
      team: "Finance",
      tier: "premium" as TierId,
      coinsUsed: 1640,
      coinsAllowance: 2000,
      status: "active" as TeamsSeatStatus,
      statusLabel: "Active",
      initials: "GA",
    },
    {
      id: "s4",
      fullName: "Daniel Kiprop",
      phone: "0745 901 337",
      team: "Sales",
      tier: "intermediate" as TierId,
      coinsUsed: 300,
      coinsAllowance: 1500,
      status: "active" as TeamsSeatStatus,
      statusLabel: "Active",
      initials: "DK",
    },
    {
      id: "s5",
      fullName: "Tom Mwangi",
      phone: "0702 671 184",
      team: "Drivers",
      tier: "basic" as TierId,
      coinsUsed: 560,
      coinsAllowance: 700,
      status: "leaving" as TeamsSeatStatus,
      statusLabel: "Leaving Fri 30 Oct",
      initials: "TM",
    },
    {
      id: "s6",
      fullName: "Ann Wairimu",
      phone: "0791 350 662",
      team: "Operations",
      tier: "basic" as TierId,
      coinsUsed: 0,
      coinsAllowance: 700,
      status: "active" as TeamsSeatStatus,
      statusLabel: "Active",
      initials: "AW",
    },
    {
      id: "s7",
      fullName: "Brian Kamau",
      phone: "0729 815 403",
      team: "Warehouse",
      tier: "basic" as TierId,
      coinsUsed: 0,
      coinsAllowance: 700,
      status: "invited" as TeamsSeatStatus,
      statusLabel: "Invite sent Mon 12 Oct",
      initials: "BK",
    },
    {
      id: "s8",
      fullName: "Sharon Akinyi",
      phone: "0715 277 619",
      team: "Customer care",
      tier: "intermediate" as TierId,
      coinsUsed: 0,
      coinsAllowance: 1500,
      status: "invited" as TeamsSeatStatus,
      statusLabel: "Invite sent Wed 14 Oct",
      initials: "SA",
    },
  ] satisfies TeamsSeat[],
  invoices: [
    {
      id: "i3",
      number: "INV-SL-0003",
      period: "October 2026",
      seats: 20,
      amountKsh: 246_000,
      paidWith: "M-Pesa",
      status: "paid" as const,
      statusLabel: "Paid Thu 1 Oct",
    },
    {
      id: "i2",
      number: "INV-SL-0002",
      period: "September 2026",
      seats: 19,
      amountKsh: 239_000,
      paidWith: "Card ending 4410",
      status: "paid" as const,
      statusLabel: "Paid Tue 1 Sep",
    },
    {
      id: "i1",
      number: "INV-SL-0001",
      period: "August 2026",
      seats: 16,
      amountKsh: 202_000,
      paidWith: "M-Pesa",
      status: "paid" as const,
      statusLabel: "Paid Sat 1 Aug",
    },
  ] satisfies TeamsInvoice[],
  joinInvite: {
    code: "sharon-demo",
    firstName: "Sharon",
    fullName: "Sharon Akinyi",
    phone: "0715 277 619",
    tier: "intermediate" as TierId,
    coins: 1500,
    message: "Welcome to our wellness perk. Enjoy!",
    from: "Lucy Njambi, HR · Wed 14 Oct",
  },
};

export function isTeamsHrSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TEAMS_DEMO_SESSION_KEY) === "1";
}

export function setTeamsHrSession(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(TEAMS_DEMO_SESSION_KEY, "1");
  else window.localStorage.removeItem(TEAMS_DEMO_SESSION_KEY);
}
