import "@/test/mediaQueryMock";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { card, clientPlayer } from "@/test/fixtures";
import PlayerHand from "./PlayerHand";

describe("PlayerHand", () => {
  it("renders my cards and allows playing valid ones", async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();

    render(
      <PlayerHand
        player={clientPlayer({ id: "p0", name: "Alice", seatIndex: 0 })}
        hand={[card("h1", "A", "hearts"), card("h2", "2", "clubs")]}
        validCards={new Set(["h1"])}
        isCurrentTurn
        isMe
        onCardClick={onCardClick}
        position="bottom"
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Play A of hearts" }));
    expect(onCardClick).toHaveBeenCalledWith("h1");
  });

  it("shows opponent card backs by count", () => {
    render(
      <PlayerHand
        player={clientPlayer({
          id: "p1",
          name: "Bob",
          seatIndex: 1,
          cardCount: 3,
        })}
        hand={[]}
        validCards={new Set()}
        isCurrentTurn={false}
        isMe={false}
        onCardClick={vi.fn()}
        position="right"
      />
    );

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("highlights current turn in the player badge", () => {
    render(
      <PlayerHand
        player={clientPlayer({ id: "p0", name: "Alice", seatIndex: 0 })}
        hand={[card("h1", "A", "hearts")]}
        validCards={new Set(["h1"])}
        isCurrentTurn
        isMe
        onCardClick={vi.fn()}
        position="bottom"
      />
    );

    expect(
      screen.getByText("Alice", { selector: ".truncate" }).parentElement
    ).toHaveClass("text-amber-400");
  });

  it("shows disconnected indicator", () => {
    render(
      <PlayerHand
        player={clientPlayer({
          id: "p1",
          name: "Bob",
          seatIndex: 1,
          isConnected: false,
          cardCount: 5,
        })}
        hand={[]}
        validCards={new Set()}
        isCurrentTurn={false}
        isMe={false}
        onCardClick={vi.fn()}
        position="top"
      />
    );

    expect(screen.getByText("●")).toBeInTheDocument();
  });
});
