import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePageContent from "./HomePageContent";

describe("HomePageContent", () => {
  it("renders hero content and play call-to-action", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", {
        name: /play the card games you grew up with/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/now live — mendicot/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start playing/i })).toHaveAttribute(
      "href",
      "/mendicot/play"
    );
  });

  it("includes the site navbar", () => {
    render(<HomePageContent />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });
});
