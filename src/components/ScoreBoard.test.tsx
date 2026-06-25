import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { clientGameState } from "@/test/fixtures";
import ScoreBoard from "./ScoreBoard";

describe("ScoreBoard", () => {
  it("shows team scores and player names", () => {
    render(
      <ScoreBoard
        state={clientGameState({
          score: [2, 1],
          teamTricks: [7, 6],
          teamTens: [2, 2],
          trickNumber: 5,
        })}
      />
    );

    expect(screen.getByRole("heading", { name: "Scoreboard" })).toBeInTheDocument();
    expect(screen.getByText("Team 1")).toBeInTheDocument();
    expect(screen.getByText("Team 2")).toBeInTheDocument();
    expect(screen.getByText("Alice & Carol")).toBeInTheDocument();
    expect(screen.getByText("Bob & Dave")).toBeInTheDocument();
    expect(screen.getByText("7 – 6")).toBeInTheDocument();
    expect(screen.getByText("2 – 2")).toBeInTheDocument();
    expect(screen.getByText("5 / 13")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows trump when revealed", () => {
    render(
      <ScoreBoard
        state={clientGameState({
          trumpSuit: "hearts",
          trumpRevealed: true,
        })}
      />
    );

    expect(screen.getByText(/Trump/)).toBeInTheDocument();
    expect(screen.getByText(/♥ Hearts/)).toBeInTheDocument();
  });

  it("hides trump when not revealed", () => {
    render(
      <ScoreBoard
        state={clientGameState({
          trumpSuit: "hearts",
          trumpRevealed: false,
        })}
      />
    );

    expect(screen.queryByText("♥ Hearts")).not.toBeInTheDocument();
  });
});
