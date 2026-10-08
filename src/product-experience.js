import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".frame-story");
const canvas = document.querySelector("#piya-frame-canvas");

if (section && canvas) {
  const context = canvas.getContext("2d", { alpha: false });
  const chapters = [...section.querySelectorAll(".frame-chapter")];
  const frameCount = 240;
  const frames = new Array(frameCount);
  const state = { frame: 0 };
  let renderedFrame = -1;

  const frameUrl = index => `/piya-frames/frame_${String(index + 1).padStart(4, "0")}.webp?v=2`;
  const draw = index => {
    const image = frames[index];
    if (!image?.complete || !image.naturalWidth) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = "#18291f";
    context.fillRect(0, 0, width, height);
    const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const coverWidth = image.naturalWidth * coverScale;
    const coverHeight = image.naturalHeight * coverScale;
    context.globalAlpha = .48;
    context.drawImage(image, (width - coverWidth) / 2, (height - coverHeight) / 2, coverWidth, coverHeight);
    context.globalAlpha = 1;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    renderedFrame = index;
  };

  const requestFrame = () => {
    const index = Math.max(0, Math.min(frameCount - 1, Math.round(state.frame)));
    if (index !== renderedFrame) draw(index);
  };

  for (let index = 0; index < frameCount; index += 1) {
    const image = new Image();
    image.decoding = "async";
    image.src = frameUrl(index);
    image.addEventListener("load", () => {
      if (index === 0 || index === Math.round(state.frame)) draw(index);
      if (index === frameCount - 1) ScrollTrigger.refresh();
    }, { once: true });
    frames[index] = image;
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
          onEnter: () => document.querySelector(".nav")?.classList.add("over-frame"),
          onEnterBack: () => document.querySelector(".nav")?.classList.add("over-frame"),
          onLeave: () => document.querySelector(".nav")?.classList.remove("over-frame"),
          onLeaveBack: () => document.querySelector(".nav")?.classList.remove("over-frame")
        }
      });

      timeline.to(state, { frame: frameCount - 1, duration: 1, onUpdate: requestFrame }, 0);
      chapters.slice(1).forEach(chapter => gsap.set(chapter, { autoAlpha: 0, y: 24 }));
      timeline
        .to(chapters[0], { autoAlpha: 0, y: -20, duration: .05 }, .42)
        .to(chapters[1], { autoAlpha: 1, y: 0, duration: .05 }, .47)
        .to(chapters[1], { autoAlpha: 0, y: -20, duration: .05 }, .72)
        .to(chapters[2], { autoAlpha: 1, y: 0, duration: .05 }, .77);
    }, section);
  }

  const resize = () => {
    renderedFrame = -1;
    requestFrame();
    ScrollTrigger.refresh();
  };
  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 140);
  }, { passive: true });
}

const products = document.querySelector("#products");
const productTrack = products?.querySelector(".product-story");

if (products && productTrack && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const horizontalDistance = () => Math.max(0, productTrack.scrollWidth - innerWidth);
  const travelDistance = horizontalDistance();
  const endHoldDistance = Math.round(innerHeight * .75);
  const horizontalContext = gsap.context(() => {
    const horizontalTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: products,
        start: "top top",
        end: `+=${travelDistance + endHoldDistance}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    horizontalTimeline
      .to(productTrack, { x: -travelDistance, duration: travelDistance, ease: "none" })
      .to({}, { duration: endHoldDistance });
  }, products);

  Promise.all([...productTrack.querySelectorAll("img")].map(image => image.complete
    ? Promise.resolve()
    : new Promise(resolve => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })
  )).then(() => ScrollTrigger.refresh());

  addEventListener("pagehide", () => horizontalContext.revert(), { once: true });
}
