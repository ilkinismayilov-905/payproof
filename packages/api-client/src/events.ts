// Live events client (ADR-0010): fetch-based SSE so the token travels in the Authorization header, not the URL.
import { ApiError, toApiError } from "./client";
import type { components } from "./generated/schema";
import { errorFallback } from "./i18n/az";
import { createSseParser } from "./sse";

type LiveEvent = components["schemas"]["LiveEvent"];

export interface SubscribeEventsOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  onEvent: (event: LiveEvent) => void;
  /** Every (re)connect. Events may have been missed meanwhile — invalidate all server state here. */
  onOpen?: () => void;
  /** Lost connection (it retries) or 401 (it stops for good — send the user to sign in). */
  onError?: (error: ApiError) => void;
  signal?: AbortSignal;
  /** Custom fetch (tests, MSW in node). */
  fetch?: (input: Request) => Promise<Response>;
  /** Reconnect backoff bounds (ms): doubles from `minMs` up to `maxMs`, with jitter. */
  retry?: { minMs: number; maxMs: number };
}

const lost = (cause?: unknown) =>
  new ApiError("NETWORK_ERROR", errorFallback.NETWORK_ERROR, 0, {}, { cause });

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(timer), resolve()), { once: true });
  });

/** Subscribes to GET /v1/events until stopped or 401. Returns `stop`. */
export function subscribeEvents(options: SubscribeEventsOptions): () => void {
  const { baseUrl, getToken, onEvent, onOpen, onError } = options;
  const { minMs, maxMs } = options.retry ?? { minMs: 1_000, maxMs: 30_000 };
  const doFetch = options.fetch ?? ((req: Request) => globalThis.fetch(req));
  const stopper = new AbortController();
  const signal = options.signal
    ? AbortSignal.any([options.signal, stopper.signal])
    : stopper.signal;
  let lastEventId: string | undefined;

  const feed = createSseParser((m) => {
    lastEventId = m.id;
    let event: LiveEvent;
    try {
      event = JSON.parse(m.data) as LiveEvent;
    } catch {
      return; // a malformed frame is skipped; the next (re)connect refetches everything anyway
    }
    onEvent(event);
  });

  void (async () => {
    for (let attempt = 0; !signal.aborted;) {
      try {
        const headers = new Headers({ Accept: "text/event-stream" });
        const token = getToken?.();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        if (lastEventId) headers.set("Last-Event-ID", lastEventId);
        const res = await doFetch(new Request(`${baseUrl}/v1/events`, { headers, signal }));
        if (res.status === 401) return onError?.(await toApiError(res));
        if (!res.ok || !res.body) throw await toApiError(res);
        attempt = 0;
        onOpen?.();
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        for (let r = await reader.read(); !r.done; r = await reader.read()) feed(r.value);
        throw lost(); // the server closed the stream (restart, token expiry) — reconnect
      } catch (e) {
        if (signal.aborted) return;
        onError?.(e instanceof ApiError ? e : lost(e));
        const delay = Math.min(maxMs, minMs * 2 ** attempt++);
        await sleep(delay / 2 + Math.random() * (delay / 2), signal);
      }
    }
  })();
  return () => stopper.abort();
}
