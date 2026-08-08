import { Layout, PageTransition } from "@/components/ui";
import { Dashboard } from "@/components/Dashboard";
import { tabsFor } from "@/lib/nav";

/**
 * Dashboard — progress across every session.
 *
 * Reads mock completions for now. Nothing is persisted yet, so the figures are
 * derived from a fixed list of topic ids rather than from attempts; when
 * storage lands, only that list changes. See lib/progress.ts.
 */
export default function DashboardPage() {
  return (
    <Layout tabs={tabsFor("dashboard")}>
      <PageTransition>
        <Dashboard />
      </PageTransition>
    </Layout>
  );
}
