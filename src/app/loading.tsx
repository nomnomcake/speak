import { LoadingScreen } from "@/components/LoadingScreen";
import { tabsFor } from "@/lib/nav";

export default function Loading() {
  return <LoadingScreen tabs={tabsFor("home")} />;
}
