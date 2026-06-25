export function overlapForFan(
  cardWidth: number,
  count: number,
  availablePx: number
): number {
  if (count <= 1) return 0;
  const raw = (count * cardWidth - availablePx) / (count - 1);
  return Math.min(58, Math.max(22, Math.ceil(raw)));
}

export function meCardHoverWrapClass(
  position: "bottom" | "right" | "top" | "left",
  isHorizontal: boolean,
  interactable: boolean
): string {
  const base =
    "group/card relative shrink-0 z-0 transition-[transform,z-index] duration-200 ease-out";
  if (!interactable) return base;
  const lift = "hover:!z-[60] focus-within:!z-[60]";
  const touch = isHorizontal ? "card-touch-lift" : "card-touch-lift-side";
  if (isHorizontal) {
    if (position === "bottom") {
      return `${base} ${lift} ${touch} origin-bottom hover:scale-110 hover:-translate-y-4 focus-within:scale-110 focus-within:-translate-y-4`;
    }
    return `${base} ${lift} ${touch} origin-top hover:scale-110 hover:translate-y-4 focus-within:scale-110 focus-within:translate-y-4`;
  }
  if (position === "left") {
    return `${base} ${lift} ${touch} origin-left hover:scale-110 hover:-translate-x-3 focus-within:scale-110 focus-within:-translate-x-3`;
  }
  return `${base} ${lift} ${touch} origin-right hover:scale-110 hover:translate-x-3 focus-within:scale-110 focus-within:translate-x-3`;
}
