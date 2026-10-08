import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".purpose-quote");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (section && !reduceMotion) {
  const items = section.querySelectorAll("[data-purpose-reveal]");

  gsap.set(items, { autoAlpha: 0, y: 24 });
  gsap.to(items, {
    autoAlpha: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.16,
    ease: "power2.out",
    scrollTrigger: {
      trigger: section,
      start: "top 72%",
      once: true,
    },
  });
}
