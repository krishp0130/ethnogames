import "@/test/mediaQueryMock";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { card, clientGameState, createMockSocket } from "@/test/fixtures";
import { mediaQueryMock } from "@/test/mediaQueryMock";
import GameBoard from "./GameBoard";

describe("GameBoard", () => {
  beforeEach(() => {
    mediaQueryMock.reset();
  });
  it("renders the status message and player names", () => {
    const socket = createMockSocket();

    render(
      <GameBoard
        socket={socket}
        state={clientGameState({ message: "Alice to lead" })}
        hand={[card("h1", "A", "hearts")]}
      />
    );

    expect(screen.getAllByText("Alice to lead").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("emits play_card when a valid card is clicked", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();

    render(
      <GameBoard
        socket={socket}
        state={clientGameState({
          phase: "playing",
          currentPlayerIndex: 0,
          myIndex: 0,
        })}
        hand={[card("h1", "A", "hearts"), card("h2", "2", "clubs")]}
      />
    );

    await user.click(
      screen.getAllByRole("button", { name: "Play A of hearts" })[0]
    );
    expect(socket.emit).toHaveBeenCalledWith("play_card", "h1");
  });

  it("shows hand complete overlay with next hand action", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();

    render(
      <GameBoard
        socket={socket}
        state={clientGameState({
          phase: "hand_complete",
          handResult: "mendikot",
          handWinner: 0,
          score: [1, 0],
          teamTens: [4, 0],
          teamTricks: [10, 3],
        })}
        hand={[]}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mendikot!" })).toBeInTheDocument();
    expect(screen.getByText("Team 1 wins the hand!")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next Hand" }));
    expect(socket.emit).toHaveBeenCalledWith("next_hand");
  });

  it("shows game over overlay with play again action", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();

    render(
      <GameBoard
        socket={socket}
        state={clientGameState({
          phase: "game_over",
          handWinner: 1,
          score: [4, 5],
        })}
        hand={[]}
      />
    );

    expect(screen.getByRole("heading", { name: "Game Over!" })).toBeInTheDocument();
    expect(screen.getByText("Team 2 wins!")).toBeInTheDocument();
    expect(screen.getByText("Final: 4 – 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play Again" }));
    expect(socket.emit).toHaveBeenCalledWith("new_game");
  });
});
