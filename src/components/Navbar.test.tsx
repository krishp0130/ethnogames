import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock } from "@/test/setup";
import Navbar from "./Navbar";

describe("Navbar", () => {
  beforeEach(() => {
    navigationMock.pathname = "/";
  });

  it("renders brand and primary navigation links", () => {
    render(<Navbar />);

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ethnogames/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /play now|play/i })).toHaveAttribute(
      "href",
      "/mendicot/play"
    );
  });

  it("marks the current page with aria-current", () => {
    navigationMock.pathname = "/mendicot";
    render(<Navbar />);

    const mendicotLink = screen.getByRole("link", { name: /mendicot/i });
    expect(mendicotLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
