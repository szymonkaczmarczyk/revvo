"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, MessagesSquare, Pause, Play, RotateCcw } from "lucide-react";
import { type CarLayer, PACKED, createCarLayer } from "./hero-car-layer";

type PlayState = "idle" | "playing" | "paused" | "ended";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** Efekt „auto przed napisem” tylko na szerokich ekranach (≥ 1024 px, proporcje ≥ 3:2) —
 *  na telefonie i ekranach 4:3 nagłówek wypadłby poza lewą krawędź albo zniknąłby za autem */
const DEPTH_EFFECT = "(min-width: 1024px) and (min-aspect-ratio: 3/2)";

/* Geometria nagłówka w pikselach wideo 1080p (efekt głębi), wyliczona z metryk Syncopate Bold i obrysu auta
   w ostatniej klatce: „TWOJE AUTO MÓ” widoczne, krawędź auta między „Ó” a „W”, „WI,” za autem,
   2. linia („KIM JESTEŚ.”, 0,774 em) kończy się ~140 px przed przodem auta.
   Rozmiar 1. linii = 78 px wideo — klasa lg:text-[calc(var(--hs)*78px)] na <h1>. */
const TITLE = { line1Top: 526, left: 240 };

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}
const useMedia = (query: string) =>
  useSyncExternalStore(subscribeMedia(query), () => window.matchMedia(query).matches, () => false);

/**
 * Hero z wideo tła (8 s: brama garażu się otwiera, auto wyjeżdża). Odtwarzane raz, stop na ostatniej klatce.
 * Wideo jest „spakowane” (klatka + maska auta), więc auto może przejechać przed nagłówkiem — patrz hero-car-layer.ts.
 */
export function HeroVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef({ x: 0, y: 0, scale: 1 });
  const [state, setState] = useState<PlayState>("idle");
  const [hasFrame, setHasFrame] = useState(false);
  const reducedMotion = useMedia(REDUCED_MOTION);
  const depthEffect = useMedia(DEPTH_EFFECT);

  // Źródło (720p na telefonach), pozycjonowanie „cover” górnej części spakowanej klatki, rysowanie auta
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const small = window.matchMedia("(max-width: 767px)").matches;
    const src = `/video/background-revvo-packed-${small ? "720p" : "1080p"}.mp4`;
    if (!video.src.endsWith(src)) video.src = src;

    let layer: CarLayer | null = null;
    if (depthEffect && canvasRef.current) layer = createCarLayer(canvasRef.current, video);
    const draw = () => layer?.draw(layoutRef.current);

    const place = () => {
      const { width: W, height: H } = section.getBoundingClientRect();
      const scale = Math.max(W / PACKED.w, H / PACKED.frameH);
      const x = (W - PACKED.w * scale) / 2;
      const y = (H - PACKED.frameH * scale) / 2;
      layoutRef.current = { x, y, scale };
      placeTitle(W, H, x, y, scale);
      Object.assign(video.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${PACKED.w * scale}px`,
        height: `${PACKED.h * scale}px`,
      });
      draw();
    };
    // Nagłówek w układzie wideo: rozmiar ∝ skali klatki, pozycja względem auta
    const placeTitle = (W: number, H: number, x: number, y: number, scale: number) => {
      const content = contentRef.current;
      const inner = innerRef.current;
      if (!content || !inner) return;
      if (!depthEffect) {
        section.style.removeProperty("--hs");
        content.style.paddingBottom = "";
        inner.style.marginLeft = "";
        return;
      }
      section.style.setProperty("--hs", String(scale));
      inner.style.marginLeft = "";
      const sectionLeft = section.getBoundingClientRect().left;
      const containerLeft = inner.getBoundingClientRect().left - sectionLeft;
      inner.style.marginLeft = `${x + TITLE.left * scale - containerLeft}px`;
      const desiredTop = y + TITLE.line1Top * scale;
      const pb = H - desiredTop - inner.offsetHeight;
      content.style.paddingBottom = `${Math.min(H * 0.45, Math.max(40, pb))}px`;
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(section);
    document.fonts?.ready.then(place);

    // Rysuj auto dokładnie przy każdej nowej klatce wideo
    let rvfc = 0;
    let raf = 0;
    const onFrame = () => {
      draw();
      if ("requestVideoFrameCallback" in video) rvfc = video.requestVideoFrameCallback(onFrame);
      else raf = requestAnimationFrame(onFrame);
    };
    onFrame();

    const onData = () => {
      setHasFrame(true);
      if (reducedMotion) video.currentTime = Math.max(0, video.duration - 0.05);
      else video.play().catch(() => setState("paused"));
      draw();
    };
    const onSeeked = () => draw();
    video.addEventListener("loadeddata", onData);
    video.addEventListener("seeked", onSeeked);
    if (video.readyState >= 2) onData();

    return () => {
      ro.disconnect();
      if (rvfc && "cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(rvfc);
      cancelAnimationFrame(raf);
      video.removeEventListener("loadeddata", onData);
      video.removeEventListener("seeked", onSeeked);
      layer?.dispose();
    };
  }, [reducedMotion, depthEffect]);

  // Pauza, gdy hero jest poza ekranem; wznowienie po powrocie
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section || reducedMotion) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.paused) {
        video.pause();
        video.dataset.autoPaused = "1";
      } else if (entry.isIntersecting && video.dataset.autoPaused) {
        delete video.dataset.autoPaused;
        video.play().catch(() => {});
      }
    });
    io.observe(section);
    return () => io.disconnect();
  }, [reducedMotion]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (state === "ended") {
      video.currentTime = 0;
      video.play();
    } else if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const ended = state === "ended" || reducedMotion;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
    >
      <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
        {/* Pierwsza klatka, zanim wideo się załaduje */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reducedMotion ? "/video/background-revvo-poster.webp" : "/video/background-revvo-poster-start.webp"}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${hasFrame ? "opacity-0" : "opacity-100"}`}
        />
        <video
          ref={videoRef}
          className="absolute max-w-none"
          muted
          playsInline
          preload="auto"
          onPlay={() => setState("playing")}
          onPause={(e) => {
            if (!e.currentTarget.ended) setState("paused");
          }}
          onEnded={() => setState("ended")}
        />
      </div>

      {/* Scrim: jasne, dzienne wideo → kontrast tekstu ≥ 4.5:1 i płynne przejście w grafit.
          Te same gradienty są odtworzone w shaderze auta (hero-car-layer.ts) — zmieniaj oba miejsca razem. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/55 to-black/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/40 to-transparent" />

      <div
        ref={contentRef}
        className="mx-auto w-full max-w-7xl px-4 pb-20 pt-[calc(var(--header-h)+48px)] sm:px-6 sm:pb-24 lg:px-8"
      >
        <div ref={innerRef} className="max-w-4xl">
          {/* Nagłówek pod warstwą auta — auto „przejeżdża” przed nim */}
          <h1
            id="hero-title"
            aria-label="Twoje auto mówi, kim jesteś."
            className="font-display text-[clamp(2.1rem,6vw,4.2rem)] font-bold uppercase leading-[1.02] tracking-[-0.01em] [perspective:900px] lg:text-[calc(var(--hs,0.75)*78px)]"
          >
            <HeroLine text="Twoje auto mówi," startIndex={0} className="text-ink" />
            <HeroLine
              text="kim jesteś."
              startIndex={16}
              className="text-[0.774em] text-copper [text-shadow:0_0_40px_rgba(200,122,75,0.35)]"
            />
          </h1>

          {/* Akapit i przyciski nad autem — zawsze czytelne i klikalne */}
          <div className="relative z-20">
            <p className="rv-rise mt-7 max-w-xl text-base leading-relaxed text-ink/85 [animation-delay:650ms] sm:text-lg [text-wrap:pretty]">
              Na <strong className="font-bold text-ink">Revvo</strong> nie jesteś anonimowym nickiem. Obok każdego posta
              stoi Twój samochód — ze specyfikacją, historią modyfikacji i zdjęciami.
            </p>

            <div className="rv-rise mt-9 grid gap-3 [animation-delay:800ms] sm:w-fit sm:grid-cols-2">
              <Link
                href="/rejestracja"
                className={`rv-sheen group relative inline-flex h-14 items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-copper px-7 text-base font-bold text-on-copper transition-[background-color,box-shadow,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:bg-copper-hover active:translate-y-0 active:bg-copper-press ${
                  ended
                    ? "shadow-[0_0_0_1px_rgba(200,122,75,0.5),0_14px_44px_rgba(200,122,75,0.4)]"
                    : "shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                }`}
              >
                Załóż garaż za darmo
                <ArrowRight
                  className="size-5 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/forum"
                className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-lg border border-white/25 bg-white/[0.06] px-7 text-base font-semibold text-ink backdrop-blur-md transition-[background-color,border-color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:border-white/40 hover:bg-white/[0.12] active:translate-y-0"
              >
                <MessagesSquare className="size-5 text-ink-muted transition-colors group-hover:text-ink" aria-hidden="true" />
                Przeglądaj forum
              </Link>
            </div>
          </div>
        </div>
      </div>

      {depthEffect && (
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden="true" />
      )}

      {!reducedMotion && (
        <button
          type="button"
          onClick={toggle}
          className="absolute bottom-6 right-4 z-20 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-bg/60 px-4 text-sm font-medium text-ink backdrop-blur transition-colors duration-200 hover:bg-bg/80 sm:right-6 lg:right-8"
        >
          {state === "ended" ? (
            <>
              <RotateCcw className="size-4" aria-hidden="true" /> Odtwórz ponownie
            </>
          ) : state === "playing" ? (
            <>
              <Pause className="size-4" aria-hidden="true" /> Pauza
            </>
          ) : (
            <>
              <Play className="size-4" aria-hidden="true" /> Odtwórz
            </>
          )}
        </button>
      )}
    </section>
  );
}

/** Linia nagłówka rozbita na litery — każda wjeżdża od dołu z lekkim obrotem (kaskada co 28 ms). */
function HeroLine({ text, startIndex, className }: { text: string; startIndex: number; className: string }) {
  let i = startIndex;
  const words = text.split(" ");
  return (
    <span aria-hidden="true" className={`block sm:whitespace-nowrap ${className}`}>
      {words.map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {[...word].map((ch) => (
            <span key={i} className="rv-char inline-block" style={{ "--i": i++ } as React.CSSProperties}>
              {ch}
            </span>
          ))}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
