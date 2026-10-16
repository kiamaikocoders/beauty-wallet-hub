import { createContext, useContext, type ReactNode } from "react";
import type { MemberSession } from "@/lib/app-data";

type MemberCtx = {
  member: MemberSession | null;
  demo: string | null;
  refresh: () => void;
};

const Ctx = createContext<MemberCtx>({ member: null, demo: null, refresh: () => {} });

export function MemberProvider({
  member,
  demo,
  refresh,
  children,
}: MemberCtx & { children: ReactNode }) {
  return <Ctx.Provider value={{ member, demo, refresh }}>{children}</Ctx.Provider>;
}

export function useMember() {
  return useContext(Ctx);
}
