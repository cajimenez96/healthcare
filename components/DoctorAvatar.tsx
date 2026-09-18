import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DoctorAvatarProps {
  name: string;
  image?: string;
  size?: number;
  className?: string;
}

// "Dr./Dra." (and similar) titles are dropped before computing initials so
// a doctor named "Dra. Jane Powell" falls back to "JP", not "DP".
function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !word.endsWith("."));
  const source = words.length > 0 ? words : name.trim().split(/\s+/);
  const initials = source
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "?";
}

// Generic doctor photo renderer (TASK-036): shows the real photo when
// `image` is set and loads successfully; falls back to the doctor's
// initials — instead of a broken image icon — when there's no photo or it
// fails to load. Radix's Avatar.Fallback detects the load failure natively,
// no onError handler needed.
export function DoctorAvatar({ name, image, size = 40, className }: DoctorAvatarProps) {
  return (
    <Avatar
      className={cn("border border-dark-500", className)}
      style={{ width: size, height: size }}
    >
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="text-12-semibold bg-dark-400 text-dark-700">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
