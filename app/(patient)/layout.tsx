import type { ReactNode } from "react";

// Legacy group layout: keep neutral to ensure immediate 308 redirects from legacy routes.
export default function LegacyPatientLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
