import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getCurrentUser, getOrganization, getAlerts } from "@/lib/data";

export const metadata: Metadata = {
  title: "VoltYield — Revenue Management for EV Charging",
  description:
    "Dynamic pricing, competitor benchmarking and AI pricing recommendations for EV charging operators.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, org, alerts] = await Promise.all([getCurrentUser(), getOrganization(), getAlerts({ unreadOnly: true })]);
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar orgName={org.name} />
          <div className="flex min-h-screen flex-1 flex-col">
            <Topbar user={user} orgName={org.name} unreadAlerts={alerts.length} />
            <main className="flex-1 px-6 py-6 lg:px-10">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
