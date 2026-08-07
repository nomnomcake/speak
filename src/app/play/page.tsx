import { Layout, PageTransition } from "@/components/ui";
import {
  CategoryDesktop,
  type DesktopFolder,
} from "@/components/CategoryDesktop";
import { tabsFor } from "@/lib/nav";
import {
  ALL_TOPICS,
  CATEGORIES,
  TIMINGS,
  fileNameFor,
  topicsInCategory,
} from "@/lib/topics";
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

function toFolder(id: string, label: string, topics: readonly Topic[]) {
  return {
    id,
    label,
    count: topics.length,
    files: topics.map((topic) => ({
      id: topic.id,
      // Shared with the research screen, so a file cannot be called one thing
      // in the picker and another once opened.
      name: fileNameFor(topic),
      category: topic.category,
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
    toFolder("random", "Random", ALL_TOPICS),
  ];

  return (
    <Layout url="speak.exe/play" tabs={tabsFor("play")}>
      <PageTransition>
        <CategoryDesktop folders={folders} />
      </PageTransition>
    </Layout>
  );
}
