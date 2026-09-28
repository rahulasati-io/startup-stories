import Image from "next/image";

export default function SiteLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brand/misterstory-logo.svg"
      width={1280}
      height={280}
      alt="MisterStory"
      className={className}
      unoptimized
    />
  );
}
