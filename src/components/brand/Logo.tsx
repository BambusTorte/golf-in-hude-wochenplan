import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Golf in Hude Logo"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority
    />
  );
}
