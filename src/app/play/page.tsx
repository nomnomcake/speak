import { Layout, PageTransition } from "@/components/ui";
import {
  CategoryDesktop,
  type DesktopFolder,
} from "@/components/CategoryDesktop";
import { tabsFor } from "@/lib/nav";
import { ALL_TOPICS, CATEGORIES, TIMINGS, topicsInCategory } from "@/lib/topics";
import type { Topic } from "@/lib/topics";

/**
 * Play — category selection.
 *
 * Folders are derived from the registry, so counts are real and a category
 * can never render an empty folder without someone noticing here first.
 *
 * Files are listed by generated filename, never by topic title — a title is a
 * summary, and revealing it would hand over the synthesis the session is
 * asking for. See docs/topic-schema.md.
 */

function fileNameFor(topic: Topic, index: number): string {
  const prefix = topic.category.slice(0, 3).toUpperCase();
  return `${prefix}_${String(index + 1).padStart(3, "0")}.TXT`;
}

function toFolder(id: string, label: string, topics: readonly Topic[]) {
  return {
    id,
    label,
    count: topics.length,
    files: topics.map((topic, i) => ({
      name: fileNameFor(topic, i),
      difficulty: topic.difficulty,
      speakSeconds: TIMINGS[topic.difficulty].speakSeconds,
    })),
  } satisfies DesktopFolder;
}

export default function PlayPage() {
  const folders: DesktopFolder[] = [
    ...CATEGORIES.map((category) =>
      toFolder(
        category,
        category.charAt(0).toUpperCase() + category.slice(1),
        topicsInCategory(category),
      ),
    ),
    toFolder("mixed", "Mixed", ALL_TOPICS),
  ];

  return (
    <Layout url="speak.exe/play" tabs={tabsFor("play")}>
      <PageTransition>
        <CategoryDesktop folders={folders} />
      </PageTransition>
    </Layout>
  );
}
