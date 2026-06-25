/** Seat index relative to the local player (0 = me/bottom, 1 = right, 2 = top, 3 = left). */
export function getRelativeSeat(seatIndex: number, myIndex: number): number {
  return (seatIndex - myIndex + 4) % 4;
}
