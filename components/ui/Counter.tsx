"use client";
import { useEffect, useRef, useState } from "react";

interface CounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function Counter({ value, duration = 1200, decimals = 0, prefix = "", suffix = "", className }: CounterProps) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        startRef.current = performance.now();
        startValue.current = displayed;

        const animate = (now: number) => {
          const t = Math.min((now - startRef.current) / duration, 1);
          const eased = easeOutExpo(t);
          setDisplayed(startValue.current + (value - startValue.current) * eased);
          if (t < 1) frame.current = requestAnimationFrame(animate);
        };

        frame.current = requestAnimationFrame(animate);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = displayed.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value.toFixed(decimals)}${suffix}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
