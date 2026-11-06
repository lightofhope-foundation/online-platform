/** Cap internal WebGL resolution vs CSS size (Retina otherwise burns GPU). */
export function webglRenderScale(maxDpr = 1.25): number {
  if (typeof window === "undefined") return 0.75;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  return Math.min(1, 1 / Math.max(dpr, 1));
}

/** Pause continuous rAF loops while the tab is hidden. */
export function bindVisibilityPause(opts: {
  isRunning: () => boolean;
  start: () => void;
  stop: () => void;
}): () => void {
  const onChange = () => {
    if (document.hidden) opts.stop();
    else if (!opts.isRunning()) opts.start();
  };
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}
