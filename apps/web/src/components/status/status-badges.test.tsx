import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, test } from "vitest";
import {
  CheckOutcomeBadge,
  DocumentStatusBadge,
  PackageStatusBadge,
  TaskStatusBadge,
} from "./status-badges";

// The glossary is the source of truth for status texts: parse it instead of copying it here.
const glossary = readFileSync(resolve("../../docs/product/glossary.md"), "utf8");
const section = (title: string) => glossary.slice(glossary.indexOf(title)).split("\n\n**")[0]!;
const pairs = (title: string): [string, string][] => {
  const text = section(title);
  const table = [...text.matchAll(/^\| `([A-Z_]+)` \| ([^|]+?) \|/gm)];
  const inline = [...text.matchAll(/`([A-Z_]+)` ([^`·]+?)(?= ·|\n|$)/g)];
  return (table.length ? table : inline).map((m) => [m[1]!, m[2]!.trim()]);
};

const cases = [
  ["**Paket**", PackageStatusBadge],
  ["**Yoxlama**", CheckOutcomeBadge],
  ["**Tapşırıq**", TaskStatusBadge],
  ["**Sənəd versiyası**", DocumentStatusBadge],
] as const;

describe.each(cases)("%s", (title, StatusBadge) => {
  const Badge = StatusBadge as ComponentType<{ status: string }>;
  const statuses = pairs(title);

  test("covers every glossary status", () => {
    expect(statuses.length).toBeGreaterThanOrEqual(4);
  });

  test.each(statuses)("%s → %s", (status, label) => {
    const { container } = render(<Badge status={status} />);
    const badge = container.firstElementChild!;
    expect(badge).toHaveTextContent(label);
    // never colour alone: an icon goes with the text
    expect(badge.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });
});

test("badge markup", () => {
  const { container } = render(
    <>
      <PackageStatusBadge status="NEEDS_FIX" />
      <CheckOutcomeBadge status="UNKNOWN" />
      <TaskStatusBadge status="RESOLVED" />
      <DocumentStatusBadge status="UPLOADED" />
    </>,
  );
  const badges = [...container.children].map((el) => ({
    tone: el.className.match(/bg-[\w-]+ text-[\w-]+$/)?.[0],
    icon: el.querySelector("svg")?.classList[1],
    text: el.textContent,
  }));
  expect(badges).toMatchInlineSnapshot(`
    [
      {
        "icon": "lucide-circle-x",
        "text": "Düzəliş tələb edir",
        "tone": "bg-danger-bg text-danger",
      },
      {
        "icon": "lucide-circle-question-mark",
        "text": "Naməlum",
        "tone": "bg-warning-bg text-warning",
      },
      {
        "icon": "lucide-circle-check",
        "text": "Həll edilib",
        "tone": "bg-success-bg text-success",
      },
      {
        "icon": "lucide-upload",
        "text": "Yükləndi",
        "tone": "bg-info-bg text-info",
      },
    ]
  `);
});
