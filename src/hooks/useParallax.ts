import { useState, useEffect, useRef } from "react";

export function useParallax(strength = 1) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const raf = useRef(0);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2 * strength,
        y: (e.clientY / window.innerHeight - 0.5) * 2 * strength,
      };
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      setOffset({ x: current.current.x, y: current.current.y });
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [strength]);

  return offset;
}
