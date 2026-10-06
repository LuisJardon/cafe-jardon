// Arranque común de movimiento: GSAP + ScrollTrigger sincronizados con Lenis (scroll suave).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

// La clase la pone Demo.astro: sistema con "reducir movimiento" y el visitante no las ha activado.
export const reduceMotion = document.documentElement.classList.contains("reduce");
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function startSmoothScroll() {
  if (reduceMotion) return null;
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Los enlaces internos (#carta…) también se desplazan con Lenis.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href")!);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -20 });
    });
  });
  return lenis;
}

/** Botón magnético: se desplaza hacia el cursor y vuelve con muelle al salir. */
export function magnetic(el: HTMLElement, strength = 0.35) {
  if (reduceMotion || !finePointer) return;
  const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
  const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    x((e.clientX - r.left - r.width / 2) * strength);
    y((e.clientY - r.top - r.height / 2) * strength);
  });
  el.addEventListener("pointerleave", () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
  });
}

export { gsap, ScrollTrigger, SplitText };
