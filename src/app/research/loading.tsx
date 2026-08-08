import { LoadingScreen } from "@/components/LoadingScreen";
import { tabsFor } from "@/lib/nav";

// Research has no tab of its own; it is a page inside Play, so that tab stays
// active while it loads.
export default function Loading() {
  return <LoadingScreen tabs={tabsFor("play")} label="Pulling the file" />;
}
