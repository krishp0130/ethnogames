import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MendicotRulesContent from "./MendicotRulesContent";

describe("MendicotRulesContent", () => {
  it("renders rule sections and play link", () => {
    render(<MendicotRulesContent />);

    expect(screen.getByRole("heading", { name: "Mendicot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How to Play" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The Setup" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Setting Trump (Hukum)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /play mendicot/i })).toHaveAttribute(
      "href",
      "/mendicot/play"
    );
    expect(
      screen.getAllByRole("link", { name: /play now/i }).some(
        (link) => link.getAttribute("href") === "/mendicot/play"
      )
    ).toBe(true);
  });
});
