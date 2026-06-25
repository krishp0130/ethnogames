export type CardSize = "sm" | "md" | "lg";

export const TRICK_LAYOUTS: Record<
  CardSize,
  {
    cardW: number;
    cardH: number;
    container: string;
    xOffset: number;
    yOffset: number;
  }
> = {
  sm: { cardW: 44, cardH: 60, container: "w-44 h-48", xOffset: 44, yOffset: 50 },
  md: { cardW: 56, cardH: 72, container: "w-64 h-72", xOffset: 62, yOffset: 66 },
  lg: {
    cardW: 72,
    cardH: 104,
    container: "w-[22rem] h-[22rem]",
    xOffset: 80,
    yOffset: 90,
  },
};

export function trickPositionFor(
  layout: (typeof TRICK_LAYOUTS)[CardSize],
  relativeSeat: number
): { x: number; y: number } {
  switch (relativeSeat) {
    case 0:
      return { x: 0, y: layout.yOffset };
    case 1:
      return { x: layout.xOffset, y: 0 };
    case 2:
      return { x: 0, y: -layout.yOffset };
    case 3:
      return { x: -layout.xOffset, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function trickEntryFor(relativeSeat: number): { x: number; y: number } {
  switch (relativeSeat) {
    case 0:
      return { x: 0, y: 180 };
    case 1:
      return { x: 180, y: 0 };
    case 2:
      return { x: 0, y: -180 };
    case 3:
      return { x: -180, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}
