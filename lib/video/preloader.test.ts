import { describe, expect, it, vi } from "vitest";
import { createPreloader } from "./preloader";

function chunkedResponse(chunks: number[], headers: Record<string, string> = {}) {
  let index = 0;
  const body = {
    getReader: () => ({
      read: async () =>
        index < chunks.length
          ? { done: false, value: new Uint8Array(chunks[index++]) }
          : { done: true, value: undefined },
    }),
  };
  return {
    ok: true,
    status: 200,
    body,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as Response;
}

function fakeVideo(readyState = 4) {
  const listeners = new Map<string, Set<() => void>>();
  const video = {
    readyState,
    src: "",
    preload: "",
    muted: false,
    currentTime: 0,
    load: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    addEventListener: (type: string, fn: () => void) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(fn));
    },
    removeEventListener: (type: string, fn: () => void) => listeners.get(type)?.delete(fn),
    emit: (type: string) => listeners.get(type)?.forEach((fn) => fn()),
  };
  return video as unknown as HTMLVideoElement & { emit: (type: string) => void };
}

describe("createPreloader", () => {
  it("reports monotonic progress capped at 95% until the element can play, then 100%", async () => {
    const fetchImpl = vi.fn(async () => chunkedResponse([250, 250, 500], { "content-length": "1000" }));
    const createObjectURL = vi.fn(() => "blob:reveal");
    const preloader = createPreloader({ fetchImpl, createObjectURL });
    const seen: number[] = [];
    preloader.subscribe(() => seen.push(preloader.getSnapshot().progress));

    await preloader.start("/media/reveal-web.mp4");
    expect(preloader.getSnapshot().status).toBe("attaching");
    expect(preloader.getSnapshot().objectUrl).toBe("blob:reveal");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    expect(Math.max(...seen)).toBeLessThanOrEqual(0.95);

    const video = fakeVideo(4);
    await preloader.attach(video);
    expect(video.src).toBe("blob:reveal");
    expect(video.preload).toBe("auto");
    expect(preloader.getSnapshot()).toMatchObject({ status: "ready", progress: 1, degraded: false });
  });

  it("uses the known byte size when Content-Length is missing", async () => {
    const fetchImpl = vi.fn(async () => chunkedResponse([500, 500]));
    const preloader = createPreloader({ fetchImpl, createObjectURL: () => "blob:x" });
    const seen: number[] = [];
    preloader.subscribe(() => seen.push(preloader.getSnapshot().progress));
    await preloader.start("/clip.mp4", 1000);
    expect(seen).toContain(0.5);
  });

  it("is idempotent for the same url", async () => {
    const fetchImpl = vi.fn(async () => chunkedResponse([10]));
    const preloader = createPreloader({ fetchImpl, createObjectURL: () => "blob:x" });
    const first = preloader.start("/clip.mp4");
    const second = preloader.start("/clip.mp4");
    expect(second).toBe(first);
    await first;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back to the direct url when the download fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    });
    const preloader = createPreloader({ fetchImpl, createObjectURL: () => "blob:x" });
    await preloader.start("/clip.mp4");
    expect(preloader.getSnapshot()).toMatchObject({ status: "attaching", usedFallback: true, error: "offline" });
    const video = fakeVideo(4);
    await preloader.attach(video);
    expect(video.src).toBe("/clip.mp4");
    expect(preloader.getSnapshot().status).toBe("ready");
  });

  it("waits for canplaythrough when the element is not ready yet", async () => {
    const preloader = createPreloader({
      fetchImpl: async () => chunkedResponse([10]),
      createObjectURL: () => "blob:x",
    });
    await preloader.start("/clip.mp4");
    const video = fakeVideo(1);
    const attaching = preloader.attach(video);
    expect(preloader.getSnapshot().status).toBe("attaching");
    video.emit("canplaythrough");
    await attaching;
    expect(preloader.getSnapshot().status).toBe("ready");
  });

  it("marks the state degraded when the timeout passes without enough data", async () => {
    vi.useFakeTimers();
    try {
      const preloader = createPreloader({
        fetchImpl: async () => chunkedResponse([10]),
        createObjectURL: () => "blob:x",
        attachTimeoutMs: 50,
      });
      await preloader.start("/clip.mp4");
      const video = fakeVideo(2);
      const attaching = preloader.attach(video);
      await vi.advanceTimersByTimeAsync(60);
      await attaching;
      expect(preloader.getSnapshot()).toMatchObject({ status: "ready", degraded: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it("unlock plays then pauses and applies the sound preference", async () => {
    const preloader = createPreloader();
    const video = fakeVideo(4);
    preloader.unlock(video, true);
    expect(video.muted).toBe(false);
    expect(video.play).toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();
    expect(video.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });
});
