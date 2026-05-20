import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useCustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const moveCursor = (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: "power2.out"
      });
    };

    const handleHover = () => {
      gsap.to(cursor, {
        scale: 2.5,
        backgroundColor: "rgba(0, 255, 163, 0.2)", 
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    };

    const handleHoverOut = () => {
      gsap.to(cursor, {
        scale: 1,
        backgroundColor: "rgba(157, 78, 221, 0.8)", 
        duration: 0.3,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', moveCursor);

    // Initial query
    const interactiveElements = document.querySelectorAll('button, a, input, select, .interactive, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleHover);
      el.addEventListener('mouseleave', handleHoverOut);
    });

    // Observer for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
           const dynamicallyAdded = document.querySelectorAll('button, a, input, select, .interactive, [role="button"]');
           dynamicallyAdded.forEach(el => {
              // avoid duplicate listeners by removing then adding
              el.removeEventListener('mouseenter', handleHover);
              el.removeEventListener('mouseleave', handleHoverOut);
              el.addEventListener('mouseenter', handleHover);
              el.addEventListener('mouseleave', handleHoverOut);
           });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      observer.disconnect();
    };
  }, []);

  return cursorRef;
}
