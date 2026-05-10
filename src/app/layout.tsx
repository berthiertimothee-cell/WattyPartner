import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getCurrentUser, getDashboardMetrics, getNotifications, getOrganization } from "@/lib/data";

export const metadata: Metadata = {
  title: "PartnerOS by Watty — Partner Success Platform for EV charging",
  description: "PartnerOS centralizes partner communication, site performance, incidents, royalties, deployments, campaigns, documents and AI-generated summaries for EV charging operators (CPOs).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const org = getOrganization();
  const metrics = getDashboardMetrics();
  const unreadAlerts = getNotifications({ unreadOnly: true }).length;
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar orgName={org.name} openIncidents={metrics.openIncidentsCount} unreadAlerts={unreadAlerts} />
          <div className="flex min-h-screen flex-1 flex-col">
            <Topbar user={user} orgName={org.name} unreadAlerts={unreadAlerts} />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
