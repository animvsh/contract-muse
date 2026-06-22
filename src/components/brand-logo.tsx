import logoUrl from "@/assets/beevr-logo.png";

type Props = {
  className?: string;
  alt?: string;
};

export function BrandLogo({ className, alt = "Beevr" }: Props) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className ?? "h-8 w-8 object-contain"}
      draggable={false}
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      width={64}
      height={64}
    />
  );
}
