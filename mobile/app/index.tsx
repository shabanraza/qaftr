import { SplashLoader } from "@/components/ui/AppLoader";

// AuthGate in _layout.tsx owns routing — show a brief loader while it redirects.
export default function Root() {
  return <SplashLoader variant="brand" />;
}
