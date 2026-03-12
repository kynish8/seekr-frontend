import { useRef, useEffect } from "react";

// match home page
const CELL = 16;
const CHARS = " .·:;+=*#%@";
const N_CH = CHARS.length - 1; // 10

// mouse parting: subtract enough field to clear even the densest cells
const MOUSE_R = 150; // influence radius in px
const MOUSE_SUB = 1.2; // subtracted at cursor center (raw max ≈ 1.0, so this fully clears)

// blue density palette, 24 levels
const D_STEPS = 24;
const PALETTE = Array.from({ length: D_STEPS }, (_, di) => {
  const a = (0.06 + (di / (D_STEPS - 1)) * 0.85).toFixed(2);
  return `rgba(37,99,235,${a})`;
});

// field threshold: render 55% of screen cells (covers the scene well without overloading)
const THRESH = -0.05;

export function AsciiBotanical() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let cw = 0,
      ch = 0;
    const startT = performance.now() / 1000;

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `900 ${CELL - 1}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };
    setup();
    window.addEventListener("resize", setup);

    const draw = () => {
      const t = performance.now() / 1000;
      const ts = t * 0.3;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = Math.min((t - startT) / 1.6, 1);

      const rows = Math.ceil(ch / CELL);
      const cols = Math.ceil(cw / CELL);

      const mCol0 = Math.floor((mx - MOUSE_R) / CELL);
      const mCol1 = Math.ceil((mx + MOUSE_R) / CELL);
      const mRow0 = Math.floor((my - MOUSE_R) / CELL);
      const mRow1 = Math.ceil((my + MOUSE_R) / CELL);

      for (let row = 0; row < rows; row++) {
        const py = row * CELL + CELL / 2;
        const ny = py / ch;

        for (let col = 0; col < cols; col++) {
          const px = col * CELL + CELL / 2;
          const nx = px / cw;

          // wave field for large oragnic patches
          //   ~4.5 cycles across × ~3.5 down → individual blob ≈ 320×257px
          const f1 =
            Math.sin(nx * Math.PI * 4.5 + ts * 1.6) *
            Math.cos(ny * Math.PI * 3.5 - ts * 1.2);

          // cascade: diagonal stripes sweeping SW→NE, the "flowing" motion
          const f2 = Math.sin((nx + ny * 0.9) * Math.PI * 3.2 + ts * 2.8 + 1.4);

          // texted: fine-grain variation
          const f3 = Math.sin(
            nx * Math.PI * 9.1 - ny * Math.PI * 7.4 + ts * 3.5 + 2.6,
          );

          // weighted sum: primary defines shape, cascade defines motion, texture adds life
          const raw = 0.5 * f1 + 0.35 * f2 + 0.15 * f3;
          // raw range: ≈ ±1.0

          // mouse parting hole
          let hole = 0;
          if (col >= mCol0 && col <= mCol1 && row >= mRow0 && row <= mRow1) {
            const ddx = px - mx;
            const ddy = py - my;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < MOUSE_R) {
              hole = MOUSE_SUB * (1 - dist / MOUSE_R);
            }
          }

          const effective = raw - hole;
          if (effective < THRESH) continue;

          // render
          const norm = Math.min((effective - THRESH) / (1.05 - THRESH), 1);
          const ci = Math.min(Math.floor(norm * N_CH) + 1, N_CH);
          // shimmer in dense areas: adjacent chars flicker
          const shim =
            norm > 0.62 && Math.sin(t * 6.8 + col * 2.3 + row * 3.9) > 0.66;
          const diIdx = Math.min(Math.floor(norm * (D_STEPS - 1)), D_STEPS - 1);

          ctx.fillStyle = PALETTE[diIdx];
          ctx.fillText(CHARS[shim ? Math.max(ci - 1, 1) : ci], px, py);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setup);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
