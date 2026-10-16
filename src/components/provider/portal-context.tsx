import { createContext, useContext } from "react";
import type { PortalData } from "@/lib/provider-portal-data";

const PortalCtx = createContext<PortalData | null>(null);

export function PortalProvider({
  value,
  children,
}: {
  value: PortalData;
  children: React.ReactNode;
}) {
  return <PortalCtx.Provider value={value}>{children}</PortalCtx.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalCtx);
  if (!ctx) throw new Error("usePortal requires PortalProvider");
  return ctx;
}
