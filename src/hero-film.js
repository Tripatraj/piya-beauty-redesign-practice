const MEDIA_ROOT = "/media/hero";

export function selectRendition(width, height) {
  if (!(width > 0) || !(height > 0)) return "square";
  const ratio = width / height;
  return ratio > 1.35 ? "wide" : ratio < 0.85 ? "portrait" : "square";
}

export function mountHeroFilm(media, environment = window) {
  const video = media.querySelector("video");
  const picture = media.querySelector("picture");
  const poster = picture?.querySelector("img");
  if (!video || !poster) return () => {};

  const doc = environment.document;
  const motion = environment.matchMedia("(prefers-reduced-motion: reduce)");
  const bounds = media.getBoundingClientRect();
  let visible = bounds.bottom > 0 && bounds.top < environment.innerHeight;
  let rendition;
  let loadedRendition;
  let failed = false;
  let playPending = false;
  let generation = 0;
  let frameRequest;
  let resizeTimer;
  let destroyed = false;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.controls = false;

  const showPoster = () => media.classList.remove("is-playing");
  const canPlay = () => !destroyed && visible && !doc.hidden && !motion.matches && !failed;

  const cancelFrame = () => {
    if (frameRequest !== undefined && video.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(frameRequest);
    }
    frameRequest = undefined;
  };

  const revealFrame = () => {
    cancelFrame();
    const requestedGeneration = generation;
    const reveal = () => {
      frameRequest = undefined;
      if (requestedGeneration === generation && canPlay() && !video.paused && video.readyState >= 2) {
        media.classList.add("is-playing");
      }
    };
    if (video.requestVideoFrameCallback) {
      frameRequest = video.requestVideoFrameCallback(reveal);
    } else {
      // Older browsers need a painted frame, not just metadata, before the fade.
      environment.requestAnimationFrame(() => environment.requestAnimationFrame(reveal));
    }
  };

  const play = () => {
    if (!canPlay() || playPending || !loadedRendition) return;
    if (!video.paused) {
      if (!media.classList.contains("is-playing")) revealFrame();
      return;
    }
    const requestedGeneration = generation;
    playPending = true;
    Promise.resolve(video.play()).then(() => {
      if (requestedGeneration === generation) {
        playPending = false;
        if (canPlay()) revealFrame();
        else video.pause();
      }
    }).catch(() => {
      if (requestedGeneration === generation) {
        playPending = false;
        showPoster();
      }
    });
  };

  const attachSources = () => {
    if (loadedRendition === rendition) return;
    generation += 1;
    playPending = false;
    cancelFrame();
    showPoster();
    video.pause();
    const sources = [["webm", "video/webm"], ["mp4", "video/mp4"]].map(([extension, type]) => {
      const source = doc.createElement("source");
      source.src = `${MEDIA_ROOT}/piya-film-${rendition}.${extension}`;
      source.type = type;
      return source;
    });
    video.replaceChildren(...sources);
    video.preload = "auto";
    loadedRendition = rendition;
    video.load();
  };

  const updatePlayback = () => {
    if (!canPlay()) {
      video.pause();
      cancelFrame();
      return;
    }
    attachSources();
    play();
  };

  const updateRendition = () => {
    if (destroyed) return;
    const rect = media.getBoundingClientRect();
    const next = selectRendition(rect.width, rect.height);
    if (next !== rendition) {
      rendition = next;
      failed = false;
      const url = `${MEDIA_ROOT}/piya-poster-${rendition}.webp`;
      picture.querySelectorAll("source").forEach(source => { source.srcset = url; });
      poster.src = url;
      media.dataset.rendition = rendition;
      updatePlayback();
    }
  };

  const onMotionChange = () => {
    if (motion.matches) {
      generation += 1;
      playPending = false;
      video.pause();
      cancelFrame();
      showPoster();
      // Cancel outstanding transfers and never retain a source in reduced motion.
      video.removeAttribute("src");
      video.replaceChildren();
      video.preload = "none";
      loadedRendition = undefined;
      video.load();
    } else {
      failed = false;
      updatePlayback();
    }
  };

  const onError = () => {
    failed = true;
    video.pause();
    cancelFrame();
    showPoster();
  };
  const onPlaying = () => {
    if (canPlay()) revealFrame();
    else video.pause();
  };
  const onResize = () => {
    environment.clearTimeout(resizeTimer);
    resizeTimer = environment.setTimeout(updateRendition, 140);
  };

  video.addEventListener("playing", onPlaying);
  video.addEventListener("error", onError);
  doc.addEventListener("visibilitychange", updatePlayback);
  motion.addEventListener("change", onMotionChange);

  const intersection = environment.IntersectionObserver ? new environment.IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    updatePlayback();
  }, { threshold: 0.01 }) : null;
  intersection?.observe(media);

  const resize = environment.ResizeObserver ? new environment.ResizeObserver(onResize) : null;
  resize?.observe(media);
  if (!resize) environment.addEventListener("resize", onResize, { passive: true });

  updateRendition();

  return () => {
    destroyed = true;
    generation += 1;
    video.pause();
    cancelFrame();
    showPoster();
    environment.clearTimeout(resizeTimer);
    intersection?.disconnect();
    resize?.disconnect();
    environment.removeEventListener("resize", onResize);
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("error", onError);
    doc.removeEventListener("visibilitychange", updatePlayback);
    motion.removeEventListener("change", onMotionChange);
  };
}

if (typeof window !== "undefined" && window.document) {
  const media = window.document.querySelector(".hero-film");
  if (media) mountHeroFilm(media);
}
