import type { Schemas, SubscribeEventsOptions } from "@payproof/api-client";
import { act } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { packageKeys } from "@/features/packages";
import { renderHookWithQuery, testQueryClient } from "@/test/render";
import { onLiveEvent, useLiveUpdates } from "./live";

const sub = vi.hoisted(() => ({
  options: undefined as SubscribeEventsOptions | undefined,
  stop: vi.fn(),
}));
vi.mock("@payproof/api-client", async (original) => ({
  ...(await original<typeof import("@payproof/api-client")>()),
  subscribeEvents: (options: SubscribeEventsOptions) => {
    sub.options = options;
    return sub.stop;
  },
}));
beforeEach(() => sub.stop.mockClear());

const event = (type: string): Schemas["LiveEvent"] => ({
  event_id: "e1",
  company_id: "c1",
  type: type as Schemas["LiveEventType"],
  package_id: "p1",
  package_version: 2,
  actor_id: "u2",
  at: "2026-11-08T09:12:00Z",
});

const setup = () => {
  const client = testQueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const view = renderHookWithQuery(() => useLiveUpdates(), client);
  return { invalidate, view };
};

test("subscribes once with the API base URL and the session token", () => {
  setup();
  expect(sub.options?.baseUrl).toBe("http://localhost:8000");
  expect(typeof sub.options?.getToken).toBe("function");
});

test("an event invalidates its keys and reaches live listeners", () => {
  const { invalidate } = setup();
  const seen = vi.fn();
  const off = onLiveEvent(seen);
  act(() => sub.options!.onEvent(event("package.approved")));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: packageKeys.all });
  expect(seen).toHaveBeenCalledWith(expect.objectContaining({ type: "package.approved" }));
  off();
});

test("first connect refetches nothing; a reconnect refetches everything (events may be missed)", () => {
  const { invalidate } = setup();
  act(() => sub.options!.onOpen!());
  expect(invalidate).not.toHaveBeenCalled();
  act(() => sub.options!.onOpen!());
  expect(invalidate).toHaveBeenCalledWith();
});

test("an unknown event type invalidates everything", () => {
  const { invalidate } = setup();
  act(() => sub.options!.onEvent(event("package.renamed")));
  expect(invalidate).toHaveBeenCalledWith();
});

test("unmount (sign-out, 401 → login) stops the stream", () => {
  const { view } = setup();
  view.unmount();
  expect(sub.stop).toHaveBeenCalledOnce();
});
