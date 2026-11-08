import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

test("renders the shadcn button on token colors", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "PayProof" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Təsdiqlə" })).toHaveClass("bg-primary");
});
