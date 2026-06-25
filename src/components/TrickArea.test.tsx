import "@/test/mediaQueryMock";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { card, clientGameState, clientPlayer } from "@/test/fixtures";
import { mediaQueryMock } from "@/test/mediaQueryMock";
import TrickArea from "./TrickArea";

describe("TrickArea", () => {
  beforeEach(() => {
    mediaQueryMock.reset();
  });
  it("shows the table message when the trick is empty", () => {
    render(
      <TrickArea
        currentTrick={[]}
        players={clientGameState().players}
        myIndex={0}
        trumpSuit={null}
        trumpRevealed={false}
        message="Waiting for lead…"
      />
    );

    expect(screen.getByText("Waiting for lead…")).toBeInTheDocument();
  });

  it("shows trump indicator when revealed", () => {
    render(
      <TrickArea
        currentTrick={[]}
        players={clientGameState().players}
        myIndex={0}
        trumpSuit="diamonds"
        trumpRevealed
        message=""
      />
    );

    expect(screen.getByText("Trump")).toBeInTheDocument();
    expect(screen.getByText("♦")).toBeInTheDocument();
  });

  it("renders cards played to the trick", () => {
    const players = clientGameState().players;

    render(
      <TrickArea
        currentTrick={[
          { card: card("t1", "Q", "clubs"), playerIndex: 0 },
          { card: card("t2", "J", "clubs"), playerIndex: 1 },
        ]}
        players={players}
        myIndex={0}
        trumpSuit={null}
        trumpRevealed={false}
        message=""
      />
    );

    expect(screen.getByLabelText("Q of clubs")).toBeInTheDocument();
    expect(screen.getByLabelText("J of clubs")).toBeInTheDocument();
  });

  it("uses compact card layout on narrow viewports", () => {
    mediaQueryMock.setQuery("(max-width: 639.98px)", true);
    mediaQueryMock.setQuery("(max-width: 379.98px)", false);

    const { container } = render(
      <TrickArea
        currentTrick={[]}
        players={[clientPlayer({ id: "p0", name: "Alice", seatIndex: 0 })]}
        myIndex={0}
        trumpSuit={null}
        trumpRevealed={false}
        message="Lead a card"
      />
    );

    expect(container.firstChild).toHaveClass("w-64");
  });
});
