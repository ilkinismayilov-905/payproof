import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Skeleton, SkeletonTable, SkeletonText } from "./skeleton";

test("announces loading once; the shapes are hidden from assistive tech", () => {
  render(<SkeletonText lines={3} />);
  const status = screen.getByRole("status", { name: "Yüklənir…" });
  const bars = status.querySelectorAll("[data-skeleton]");
  expect(bars).toHaveLength(3);
  bars.forEach((bar) => expect(bar.closest("[aria-hidden='true']")).not.toBeNull());
});

test("table skeleton: rows × columns", () => {
  render(<SkeletonTable rows={4} columns={5} />);
  expect(screen.getByRole("status").querySelectorAll("[data-skeleton]")).toHaveLength(20);
});

test("a single block takes its size from className and animates only without reduced motion", () => {
  render(<Skeleton className="h-24 w-full" />);
  const bar = screen.getByRole("status").querySelector("[data-skeleton]")!;
  expect(bar).toHaveClass("h-24", "w-full", "motion-safe:animate-pulse");
});
