import Link from "next/link";
import { BarsIcon } from "./icons";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

const tones = {
  onLight: {
    tile: "bg-primary text-white",
    name: "text-ink",
  },
  onDark: {
    tile: "bg-white text-primary",
    name: "text-white",
  },
};

export default function BrandLogo({
  href = "/",
  tone = "onLight",
  className = "",
  wordmarkClassName = "",
  showTagline = false,
}) {
  const palette = tones[tone] ?? tones.onLight;

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-2 md:gap-2.5 ${className}`}
      aria-label={APP_NAME}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-lg ${palette.tile}`}
      >
        <BarsIcon className="h-5 w-5" />
      </span>
      <span className={`leading-none ${wordmarkClassName}`}>
        <span
          className={`block font-display text-[19px] font-bold tracking-tight ${palette.name}`}
        >
          {APP_NAME}
        </span>
        {showTagline ? (
          <span
            className={`mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] ${
              tone === "onDark" ? "text-white/60" : "text-primary"
            }`}
          >
            {APP_TAGLINE}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
