import { useEffect, useRef, useCallback } from 'react';

export function useDebounce<Args extends unknown[], Return>(
  callback: (...args: Args) => Return,
  delay: number,
  onError?: (err: unknown) => void
) {
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
          result.catch(err => {
            if (onError) onError(err);
            else console.error('Debounced function failed:', err);
          });
        }
      } catch (e) {
        if (onError) onError(e);
        else console.error(e);
      }
    }, delay);
  }, [delay, onError]);

  return debouncedFunction;
}
