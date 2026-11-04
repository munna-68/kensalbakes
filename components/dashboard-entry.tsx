"use client";

// The dashboard renders client-only: its demo data is time-relative ("2h ago"),
// so rendering it on the server would never match the browser.
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Dashboard = dynamic(() => import("./dashboard"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-cream" />,
});

export default function DashboardEntry() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
