import { Layout, PageTransition } from "@/components/ui";
import { Archive } from "@/components/Archive";
import { tabsFor } from "@/lib/nav";

/**
 * Archive — session history.
 *
 * Separate from the dashboard on purpose: that answers "how am I doing" with
 * derived figures, this answers "what did I say that time" with the take
 * itself. See user-flow.md.
 */
export default function ArchivePage() {
  return (
    <Layout tabs={tabsFor("archive")}>
      <PageTransition>
        <Archive />
      </PageTransition>
    </Layout>
  );
}
