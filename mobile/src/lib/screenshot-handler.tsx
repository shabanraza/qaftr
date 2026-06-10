import { useRouter } from "expo-router";
import { useScreenshotDeepLink } from "snapscene";
import "../../screenshots";

export function ScreenshotDeepLinkHandler() {
  const router = useRouter();
  useScreenshotDeepLink({ ctx: null, router });
  return null;
}
