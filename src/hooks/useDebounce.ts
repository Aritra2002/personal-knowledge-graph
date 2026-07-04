import { useEffect, useRef, useCallback } from 'react';

export function useDebounce<Args extends unknown[], Return>(callback: (...args: Args) => Return, delay: number) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFunction = useCallback((...args: Args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const result = callbackRef.current(...args);
        if (result instanceof Promise) {
          result.catch(console.error);
        }
      } catch (e) {
        console.error(e);
      }
    }, delay);
  }, [delay]);

  return debouncedFunction;
}
