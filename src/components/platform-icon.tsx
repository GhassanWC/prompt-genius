import { Flame, Heart, Database, FileCode, CodeSquare, Bot, Workflow } from "lucide-react";
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
    case "supabase":
      return <Database {...props} />;
    case "n8n":
      return <Workflow {...props} />;
    case "chatgpt":
      return <Bot {...props} />;
    default:
      return <FileCode {...props} />;
  }
}
