import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { card } from "@/test/fixtures";
import PlayingCard from "./PlayingCard";

describe("PlayingCard", () => {
  it("renders face-up card rank and suit", () => {
    render(<PlayingCard card={card("c1", "K", "hearts")} animate={false} />);

    expect(screen.getByLabelText("K of hearts")).toBeInTheDocument();
    expect(screen.getAllByText("K").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("♥").length).toBeGreaterThanOrEqual(1);
  });

  it("fits two-digit ranks on compact cards", () => {
    render(
      <PlayingCard card={card("c1", "10", "hearts")} size="sm" animate={false} />
    );

    expect(screen.getByLabelText("10 of hearts")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("calls onClick when playable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <PlayingCard
        card={card("c1", "A", "spades")}
        onClick={onClick}
        animate={false}
      />
    );

    await user.click(screen.getByRole("button", { name: "Play A of spades" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <PlayingCard
        card={card("c1", "A", "spades")}
        onClick={onClick}
        disabled
        animate={false}
      />
    );

    await user.click(screen.getByLabelText("A of spades"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders face-down card without a button", () => {
    render(
      <PlayingCard
        card={card("back", "A", "spades")}
        faceDown
        animate={false}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
