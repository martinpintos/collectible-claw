import Image from "next/image";
import type { Grader } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

interface SlabCardProps {
  name: string;
  grade: string;
  grader?: Grader;
  set?: string;
  imageSrc: string | null;
  /** `sizes` hint for next/image; defaults to a grid tile. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

const LABEL_STYLE: Record<Grader, string> = {
  PSA: "bg-[#e3262b] text-white",
  BGS: "bg-[#111] text-[#d4af37]",
  CGC: "bg-[#0a3d7a] text-white",
};

/**
 * Square slab tile on the white hex backdrop. Uses the exported photo when the
 * catalog item has one; otherwise renders a stylised graded slab so the grid
 * still reads as "real" while artwork is being exported from Figma.
 */
export function SlabCard({
  name,
  grade,
  grader = "PSA",
  set,
  imageSrc,
  sizes = "(min-width: 1024px) 200px, 45vw",
  priority,
  className,
}: SlabCardProps) {
  return (
    <div className={cn("bg-hex relative aspect-square w-full overflow-hidden", className)}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes={sizes}
          quality={90}
          loading={priority ? "eager" : "lazy"}
          preload={priority}
          className="object-cover"
        />
      ) : (
        <SlabFallback name={name} grade={grade} grader={grader} set={set} />
      )}
    </div>
  );
}

function SlabFallback({
  name,
  grade,
  grader,
  set,
}: Required<Pick<SlabCardProps, "name" | "grade" | "grader">> & { set?: string }) {
  const monogram = (set ?? name).replace(/^\d+\s*/, "").slice(0, 1).toUpperCase() || "?";
  return (
    <div
      role="img"
      aria-label={`${name}, ${grade}`}
      className="absolute inset-[9%] flex flex-col rounded-[6%/4.5%] bg-[#2b2b2b] p-[4%] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
    >
      <div
        className={cn(
          "flex items-center justify-between rounded-[3px] px-[6%] py-[3%] font-semibold uppercase leading-none tracking-wide",
          LABEL_STYLE[grader],
        )}
      >
        <span className="truncate text-[9px] sm:text-[10px]">{grader}</span>
        <span className="text-[10px] sm:text-[11px]">{grade.replace(grader, "").trim() || grade}</span>
      </div>
      <div className="mt-[4%] flex flex-1 items-center justify-center rounded-[3px] bg-[#1c1c1c] p-[5%]">
        <div
          className="flex aspect-[5/7] h-full max-h-full items-center justify-center rounded-[4px] border border-white/10"
          style={{
            background: "linear-gradient(160deg, #4a4a4a 0%, #151515 60%, #262626 100%)",
          }}
        >
          <span
            className="font-bold text-white/85"
            style={{ fontSize: "min(9vw, 48px)" }}
          >
            {monogram}
          </span>
        </div>
      </div>
    </div>
  );
}
