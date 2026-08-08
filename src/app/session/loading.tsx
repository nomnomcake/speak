import { LoadingScreen } from "@/components/LoadingScreen";
import { tabsFor } from "@/lib/nav";

// The session lives inside Play, so that tab stays active while it loads.
export default function Loading() {
  return <LoadingScreen tabs={tabsFor("play")} label="Switching modes" />;
}
