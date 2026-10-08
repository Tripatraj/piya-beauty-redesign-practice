import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Load the source as an ES module without changing this site's package format.
const source = await readFile(new URL("../src/hero-film.js", import.meta.url), "utf8");
const { selectRendition, mountHeroFilm } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

class Events {
  listeners = new Map();
  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(listener);
  }
  removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
  emit(name) { this.listeners.get(name)?.forEach(listener => listener()); }
}

function fixture({ reduced = false, visible = true, rejectPlay = false } = {}) {
  const motion = Object.assign(new Events(), { matches: reduced });
  const document = Object.assign(new Events(), {
    hidden: false,
    createElement: tagName => ({ tagName })
  });
  const classSet = new Set();
  const video = Object.assign(new Events(), {
    paused: true,
    readyState: 0,
    children: [],
    playCalls: 0,
    loadCalls: 0,
    pause() { this.paused = true; },
    play() {
      this.playCalls += 1;
      if (rejectPlay) return Promise.reject(new Error("Autoplay not allowed"));
      this.paused = false;
      return Promise.resolve();
    },
    replaceChildren(...children) { this.children = children; },
    removeAttribute(name) { delete this[name]; },
    load() { this.loadCalls += 1; },
    requestVideoFrameCallback(callback) { this.frame = callback; return 1; },
    cancelVideoFrameCallback() { this.frame = undefined; }
  });
  const poster = {};
  const posterSources = [{}, {}];
  const picture = {
    querySelector: selector => selector === "img" ? poster : null,
    querySelectorAll: () => posterSources
  };
  let bounds = { top: visible ? 0 : 1200, bottom: visible ? 600 : 1800, width: 600, height: 600 };
  const media = {
    dataset: {},
    classList: {
      add: name => classSet.add(name),
      remove: name => classSet.delete(name),
      contains: name => classSet.has(name)
    },
    querySelector: selector => selector === "video" ? video : selector === "picture" ? picture : null,
    getBoundingClientRect: () => bounds
  };
  let intersectionCallback;
  let resizeCallback;
  const environment = Object.assign(new Events(), {
    document,
    innerHeight: 900,
    matchMedia: () => motion,
    requestAnimationFrame: callback => callback(),
    setTimeout: callback => { callback(); return 1; },
    clearTimeout: () => {},
    IntersectionObserver: class {
      constructor(callback) { intersectionCallback = callback; }
      observe() {}
      disconnect() {}
    },
    ResizeObserver: class {
      constructor(callback) { resizeCallback = callback; }
      observe() {}
      disconnect() {}
    }
  });
  const cleanup = mountHeroFilm(media, environment);
  return {
    media, video, poster, posterSources, motion, document, cleanup,
    setVisible: isIntersecting => intersectionCallback([{ isIntersecting }]),
    resize: (width, height) => { bounds = { ...bounds, width, height }; resizeCallback(); },
    frame: () => { video.readyState = 2; video.frame?.(); }
  };
}

const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test("rendition selection uses actual media-box aspect ratio", () => {
  assert.equal(selectRendition(725, 758), "square");
  assert.equal(selectRendition(514, 626), "portrait");
  assert.equal(selectRendition(708, 408), "wide");
  assert.equal(selectRendition(330, 332), "square");
  assert.equal(selectRendition(0, 0), "square");
});

test("reduced motion never attaches or requests video sources", () => {
  const player = fixture({ reduced: true });
  assert.deepEqual(player.video.children, []);
  assert.equal(player.video.loadCalls, 0);
  assert.equal(player.video.playCalls, 0);
  assert.match(player.poster.src, /piya-poster-square\.webp$/);
  player.cleanup();
});

test("the poster stays visible until the first painted frame", async () => {
  const player = fixture();
  assert.deepEqual(player.video.children.map(source => source.type), ["video/webm", "video/mp4"]);
  assert.equal(player.media.classList.contains("is-playing"), false);
  await settle();
  assert.equal(player.media.classList.contains("is-playing"), false);
  player.frame();
  assert.equal(player.media.classList.contains("is-playing"), true);
  player.cleanup();
});

test("autoplay rejection keeps the poster with no unhandled rejection", async () => {
  const player = fixture({ rejectPlay: true });
  await settle();
  assert.equal(player.media.classList.contains("is-playing"), false);
  player.cleanup();
});

test("offscreen heroes do not load video until entering the viewport", async () => {
  const player = fixture({ visible: false });
  assert.equal(player.video.children.length, 0);
  player.setVisible(true);
  await settle();
  assert.equal(player.video.children.length, 2);
  assert.equal(player.video.paused, false);
  player.setVisible(false);
  assert.equal(player.video.paused, true);
  player.cleanup();
});

test("hidden documents pause and resume only when visible", async () => {
  const player = fixture();
  await settle();
  player.document.hidden = true;
  player.document.emit("visibilitychange");
  assert.equal(player.video.paused, true);
  player.document.hidden = false;
  player.document.emit("visibilitychange");
  await settle();
  assert.equal(player.video.paused, false);
  player.cleanup();
});

test("motion preference changes cancel playback, remove sources, and restore poster", async () => {
  const player = fixture();
  await settle();
  player.frame();
  player.motion.matches = true;
  player.motion.emit("change");
  assert.equal(player.video.paused, true);
  assert.equal(player.video.children.length, 0);
  assert.equal(player.media.classList.contains("is-playing"), false);
  player.motion.matches = false;
  player.motion.emit("change");
  await settle();
  assert.equal(player.video.children.length, 2);
  player.cleanup();
});

test("resizing selects a new composition but does not reload the same one", async () => {
  const player = fixture();
  await settle();
  const loads = player.video.loadCalls;
  player.resize(700, 700);
  assert.equal(player.video.loadCalls, loads);
  player.resize(700, 400);
  assert.equal(player.media.dataset.rendition, "wide");
  assert.match(player.poster.src, /piya-poster-wide\.webp$/);
  assert.match(player.video.children[0].src, /piya-film-wide\.webm$/);
  assert.equal(player.video.loadCalls, loads + 1);
  player.cleanup();
});

test("video errors return to the poster and do not loop failed retries", async () => {
  const player = fixture();
  await settle();
  player.frame();
  player.video.emit("error");
  assert.equal(player.media.classList.contains("is-playing"), false);
  const calls = player.video.playCalls;
  player.setVisible(false);
  player.setVisible(true);
  assert.equal(player.video.playCalls, calls);
  player.cleanup();
});

test("cleanup stops playback and ignores late frame callbacks", async () => {
  const player = fixture();
  await settle();
  const callback = player.video.frame;
  player.cleanup();
  callback?.();
  assert.equal(player.video.paused, true);
  assert.equal(player.media.classList.contains("is-playing"), false);
});
