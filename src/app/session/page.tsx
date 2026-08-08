import { Layout, Panel, PageTransition } from "@/components/ui";
import { PresentationMode } from "@/components/PresentationMode";
import { tabsFor } from "@/lib/nav";
import { getTopic, topicForDate } from "@/lib/topics";
import { CURRENT_DATE } from "@/lib/mock";

/**
 * Session — lockout and transmit, one route with two states.
 *
 * Deliberately not two routes. user-flow.md is explicit that navigation
 * between them must be impossible: no back button, no URL to edit, no refresh
 * to escape. A lockout that can be undone is not a lockout.
 *
 * Arriving here is what makes the notes and sources disappear — they are on
 * `/research`, and this is not `/research`.
 */

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: requestedId } = await searchParams;
  const topic =
    (requestedId ? getTopic(requestedId) : undefined) ??
    topicForDate(CURRENT_DATE);

  return (
    <Layout tabs={tabsFor("play")}>
      <PageTransition>
        {/* Ink, because the surface inverting is the loudest way to say the
            application changed mode without playing an animation at anyone. */}
        {/* Carries the screen's one sprig — the dialogs and the review window
            inside it go without. */}
        <Panel chrome="window" title="Speak" tone="ink" notch={6}>
          <PresentationMode topic={topic} />
        </Panel>
      </PageTransition>
    </Layout>
  );
}
