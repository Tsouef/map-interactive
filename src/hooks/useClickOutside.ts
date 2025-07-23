import { useEffect, useRef, RefObject } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Hook that alerts clicks outside of the passed ref
 * 
 * @param ref - Reference or array of references to the element(s)
 * @param handler - Function to call when click outside is detected
 * @param disabled - Optional flag to disable the hook
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: Handler,
  disabled?: boolean
): void {
  const savedHandler = useRef<Handler>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (disabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref];
      
      // Do nothing if clicking ref's element or descendent elements
      const isInside = refs.some(r => {
        return r.current && r.current.contains(event.target as Node);
      });

      if (!isInside) {
        savedHandler.current(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, disabled]);
}