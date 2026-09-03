/**
 * Framework-agnostic preloader for the reveal clip.
 *
 * Strategy: download the whole file as a Blob (with byte-level progress), hand
 * the object URL to a persistent <video>, and only report `ready` once the
 * element itself says it can play through. At reveal time playback comes from
 * memory – no network, no buffering, no black gap.
 *
 * Exposed as an external store so React reads it with useSyncExternalStore and
 * never has to mirror it into component state.
 */
export type PreloadStatus = "idle" | "fetching" | "attaching" | "ready" | "error";

export interface PreloadState {
  status: PreloadStatus;
  /** 0..1 – download progress, then 1 once the element can play through. */
  progress: number;
  url: string | null;
  objectUrl: string | null;
  /** The blob download failed; the element streams the file directly instead. */
  usedFallback: boolean;
  /** `attach` timed out before readyState reached HAVE_ENOUGH_DATA. */
  degraded: boolean;
  error: string | null;
}

export interface PreloaderOptions {
  fetchImpl?: typeof fetch;
  createObjectURL?: (blob: Blob) => string;
  /** Milliseconds to wait for `canplaythrough` before accepting a lower readyState. */
  attachTimeoutMs?: number;
  now?: () => number;
}

const HAVE_FUTURE_DATA = 3;
const HAVE_ENOUGH_DATA = 4;

export function createPreloader(options: PreloaderOptions = {}) {
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const createObjectURL = options.createObjectURL ?? ((blob: Blob) => URL.createObjectURL(blob));
  const attachTimeoutMs = options.attachTimeoutMs ?? 8000;

  let state: PreloadState = {
    status: "idle",
    progress: 0,
    url: null,
    objectUrl: null,
    usedFallback: false,
    degraded: false,
    error: null,
  };
  const listeners = new Set<() => void>();
  let controller: AbortController | null = null;
  let startPromise: Promise<void> | null = null;
  let attached: HTMLVideoElement | null = null;

  const emit = () => listeners.forEach((listener) => listener());
  const setState = (patch: Partial<PreloadState>) => {
    state = { ...state, ...patch };
    emit();
  };

  async function download(url: string, knownBytes?: number, signal?: AbortSignal) {
    const response = await fetchImpl(url, { signal });
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
    const header = Number(response.headers.get("content-length"));
    const total = Number.isFinite(header) && header > 0 ? header : knownBytes ?? 0;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      if (total > 0) {
        // Never claim 100% from the download alone – the element still has to decode.
        setState({ progress: Math.min(received / total, 0.95) });
      }
    }
    const type = response.headers.get("content-type") ?? "video/mp4";
    return createObjectURL(new Blob(chunks as BlobPart[], { type }));
  }

  /** Idempotent: repeated calls (StrictMode, re-renders) share one download. */
  function start(url: string, knownBytes?: number): Promise<void> {
    if (startPromise && state.url === url) return startPromise;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    setState({ status: "fetching", url, progress: 0, objectUrl: null, usedFallback: false, error: null });

    startPromise = download(url, knownBytes, signal)
      .then((objectUrl) => {
        if (signal.aborted) return;
        setState({ status: "attaching", objectUrl });
      })
      .catch((error: unknown) => {
        if (signal.aborted) return;
        // Fall back to letting the element stream the file with preload="auto".
        setState({
          status: "attaching",
          usedFallback: true,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return startPromise;
  }

  function waitUntilPlayable(video: HTMLVideoElement): Promise<boolean> {
    if (video.readyState >= HAVE_ENOUGH_DATA) return Promise.resolve(true);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        video.removeEventListener("canplaythrough", onReady);
        video.removeEventListener("error", onError);
        clearInterval(poll);
        clearTimeout(timer);
        resolve(ok);
      };
      const onReady = () => finish(true);
      const onError = () => finish(false);
      video.addEventListener("canplaythrough", onReady);
      video.addEventListener("error", onError);
      const poll = setInterval(() => {
        if (video.readyState >= HAVE_ENOUGH_DATA) finish(true);
      }, 100);
      const timer = setTimeout(() => finish(video.readyState >= HAVE_FUTURE_DATA), attachTimeoutMs);
    });
  }

  /** Point the persistent element at the buffered file and wait until it can play through. */
  async function attach(video: HTMLVideoElement): Promise<void> {
    if (state.status !== "attaching" || !state.url) return;
    if (attached === video) return;
    attached = video;
    video.preload = "auto";
    video.src = state.objectUrl ?? state.url;
    video.load();
    const playable = await waitUntilPlayable(video);
    if (attached !== video) return;
    setState({ status: "ready", progress: 1, degraded: !playable });
  }

  /**
   * Must run synchronously inside a user gesture (the Confirm click). Playing and
   * immediately pausing "activates" the element on iOS so the later, programmatic
   * play() at reveal time is allowed – with sound if the user opted in.
   */
  function unlock(video: HTMLVideoElement, soundOn: boolean): void {
    video.muted = !soundOn;
    const attempt = video.play();
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(() => {
          video.pause();
          video.currentTime = 0;
        })
        .catch(() => {
          /* Autoplay policy refused; the reveal falls back to a muted start. */
        });
    }
  }

  function reset(): void {
    controller?.abort();
    controller = null;
    startPromise = null;
    attached = null;
    setState({
      status: "idle",
      progress: 0,
      url: null,
      objectUrl: null,
      usedFallback: false,
      degraded: false,
      error: null,
    });
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    attach,
    unlock,
    reset,
  };
}

export type Preloader = ReturnType<typeof createPreloader>;

const registry = new Map<string, Preloader>();

/** One preloader per clip URL for the lifetime of the page. */
export function getPreloader(url: string): Preloader {
  let preloader = registry.get(url);
  if (!preloader) {
    preloader = createPreloader();
    registry.set(url, preloader);
  }
  return preloader;
}
