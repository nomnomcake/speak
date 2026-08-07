import { Layout, PageTransition } from "@/components/ui";
import { ResearchWindow } from "@/components/ResearchWindow";
import { tabsFor } from "@/lib/nav";
import { getTopic, topicForDate } from "@/lib/topics";
import { CURRENT_DATE } from "@/lib/mock";

/**
 * Research.
 *
 * The topic comes from `?topic=<id>`, which is how the randomiser hands one
 * over. An unknown or missing id falls back to the day's topic rather than
 * erroring — arriving here from the tab bar with no query is a normal way in,
 * not a mistake.
 */

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: requestedId } = await searchParams;
  const topic =
    (requestedId ? getTopic(requestedId) : undefined) ??
    topicForDate(CURRENT_DATE);

  return (
    <Layout
      url={`speak.exe/research?topic=${topic.id}`}
      // Research has no tab of its own — it is a page within Play, so that tab
      // stays active while the address bar shows where you actually are.
      tabs={tabsFor("play")}
    >
      <PageTransition>
        <ResearchWindow topic={topic} />
      </PageTransition>
    </Layout>
  );
}
