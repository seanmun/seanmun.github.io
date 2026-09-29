// File: src/hooks/useDeferredMount.ts
// Purpose: When to mount something heavy (three.js scenes, 3D models):
// once the browser is idle, or — with whenVisible — only once the element
// scrolls within 300px of the viewport. Keeps it out of the initial load.

import { RefObject, useEffect, useState } from 'react';

export function useDeferredMount(ref: RefObject<HTMLElement | null>, whenVisible = false) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (whenVisible) {
      const element = ref.current;
      if (!element) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEnabled(true);
            observer.disconnect();
          }
        },
        { rootMargin: '300px' }
      );
      observer.observe(element);
      return () => observer.disconnect();
    }

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const enable = () => setEnabled(true);
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(enable, 400);
    }
    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [ref, whenVisible]);

  return enabled;
}
