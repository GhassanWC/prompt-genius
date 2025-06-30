import { Flame, Heart, Database, FileCode, CodeSquare } from "lucide-react";
import type { LucideProps } from "lucide-react";

type PlatformIconProps = {
  platform: string;
} & LucideProps;

export function PlatformIcon({ platform, ...props }: PlatformIconProps) {
  const safePlatform = platform.toLowerCase();

  switch (safePlatform) {
    case "firebase":
      return <Flame {...props} />;
    case "replit":
      return <CodeSquare {...props} />;
    case "lovable":
      return <Heart {...props} />;
    case "blob":
      return <Database {...props} />;
    default:
      return <FileCode {...props} />;
  }
}
