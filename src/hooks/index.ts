/**
 * Custom React Hooks for WhimsyWall
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to detect clicks outside a component
 */
export const useClickOutside = (
  callback: () => void
): React.RefObject<HTMLDivElement> => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
};

/**
 * Hook to handle keyboard events
 */
export const useKeyDown = (
  key: string,
  callback: () => void
): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback]);
};

/**
 * Hook to track previous value
 */
export const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Hook for managing boolean state with toggle
 */
export const useToggle = (
  initialValue: boolean = false
): [boolean, () => void] => {
  const [value, setValue] = React.useState(initialValue);
  const toggle = () => setValue(!value);
  return [value, toggle];
};

// Import React for useToggle
import * as React from 'react';
