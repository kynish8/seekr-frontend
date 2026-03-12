import { useRef, useEffect, useCallback } from "react";

const ASCII_CHARS = " .·:;+=*#%@";
const CELL_SIZE = 16;
const RIPPLE_SPEED = 120; // px per second
const RIPPLE_RING_WIDTH = 30;
const CLIP_THRESHOLD = 0.38;

interface Ripple {
  x: number;
  y: number;
  radius: number;
  amplitude: number;
}

interface Props {
  blueOverlayRef?: React.RefObject<HTMLElement | null>;
}

export function AsciiOrangeBackground({ blueOverlayRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const rafRef = useRef(0);
  const lastSpawn = useRef({ x: -100, y: -100 });
  const lastTime = useRef(performance.now());
  const gridW = useRef(0);
  const gridH = useRef(0);
  const grid = useRef<Float32Array>(new Float32Array(0));

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, button, a, [data-no-trail]")) return;

    const dx = e.clientX - lastSpawn.current.x;
    const dy = e.clientY - lastSpawn.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 30) {
      lastSpawn.current = { x: e.clientX, y: e.clientY };
      ripples.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        amplitude: 1.0,
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gridW.current = Math.ceil(window.innerWidth / CELL_SIZE);
      gridH.current = Math.ceil(window.innerHeight / CELL_SIZE);
      grid.current = new Float32Array(gridW.current * gridH.current);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = (now: number) => {
      const dt = (now - lastTime.current) / 1000;
      lastTime.current = now;

      const w = gridW.current;
      const h = gridH.current;
      const g = grid.current;

      g.fill(0);

      ripples.current = ripples.current.filter((r) => r.amplitude > 0.01);

      for (const r of ripples.current) {
        r.radius += RIPPLE_SPEED * dt;
        r.amplitude *= 1 - dt * 1.2;

        const minR = Math.max(0, r.radius - RIPPLE_RING_WIDTH * 2);
        const maxR = r.radius + RIPPLE_RING_WIDTH * 2;

        const cellMinX = Math.max(0, Math.floor((r.x - maxR) / CELL_SIZE));
        const cellMaxX = Math.min(w - 1, Math.ceil((r.x + maxR) / CELL_SIZE));
        const cellMinY = Math.max(0, Math.floor((r.y - maxR) / CELL_SIZE));
        const cellMaxY = Math.min(h - 1, Math.ceil((r.y + maxR) / CELL_SIZE));

        for (let cy = cellMinY; cy <= cellMaxY; cy++) {
          for (let cx = cellMinX; cx <= cellMaxX; cx++) {
            const px = cx * CELL_SIZE + CELL_SIZE / 2;
            const py = cy * CELL_SIZE + CELL_SIZE / 2;
            const dx = px - r.x;
            const dy = py - r.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minR || dist > maxR) continue;

            const phase = ((dist - r.radius) / RIPPLE_RING_WIDTH) * Math.PI;
            const wave = Math.cos(phase) * 0.5 + 0.5;
            const falloff =
              1 - Math.abs(dist - r.radius) / (RIPPLE_RING_WIDTH * 2);
            const value = wave * Math.max(falloff, 0) * r.amplitude;

            g[cy * w + cx] = Math.min(1, g[cy * w + cx] + value);
          }
        }
      }

      // render orange ASCII
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `900 ${CELL_SIZE - 1}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const charCount = ASCII_CHARS.length - 1;

      for (let cy = 0; cy < h; cy++) {
        for (let cx = 0; cx < w; cx++) {
          const val = g[cy * w + cx];
          if (val < 0.02) continue;

          const charIdx = Math.min(Math.floor(val * charCount) + 1, charCount);
          const char = ASCII_CHARS[charIdx];

          ctx.globalAlpha = Math.min(val * 1.2, 0.9);
          ctx.fillStyle = "#FF6900";
          ctx.fillText(
            char,
            cx * CELL_SIZE + CELL_SIZE / 2,
            cy * CELL_SIZE + CELL_SIZE / 2,
          );
        }
      }

      ctx.globalAlpha = 1;

      // update blue title overlay clip-path
      const overlay = blueOverlayRef?.current;
      if (overlay) {
        const rect = overlay.getBoundingClientRect();
        const parts: string[] = [];

        for (let cy = 0; cy < h; cy++) {
          for (let cx = 0; cx < w; cx++) {
            if (g[cy * w + cx] < CLIP_THRESHOLD) continue;

            const cellX = cx * CELL_SIZE;
            const cellY = cy * CELL_SIZE;

            // skipp cells that don't overlap the overlay element
            if (
              cellX + CELL_SIZE <= rect.left ||
              cellX >= rect.right ||
              cellY + CELL_SIZE <= rect.top ||
              cellY >= rect.bottom
            )
              continue;

            // coordinates relative to overlay element's top-left
            const lx = Math.round(cellX - rect.left);
            const ly = Math.round(cellY - rect.top);
            const s = CELL_SIZE;
            parts.push(`M${lx} ${ly}H${lx + s}V${ly + s}H${lx}Z`);
          }
        }

        overlay.style.clipPath =
          parts.length > 0 ? `path("${parts.join(" ")}")` : "inset(0 100% 0 0)";
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, [handleMouseMove, blueOverlayRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
