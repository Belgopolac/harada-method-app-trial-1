// Drop-in replacement for useState that survives app restarts.
// Requires: @react-native-async-storage/async-storage
//
// Usage inside useHaradaGrids (keep your existing return shape, just swap
// the storage of the grids array):
//
//   const [grids, setGrids, loaded] = usePersistentState<HaradaGrid[]>(
//     'harada:grids',
//     [],
//   );
//
// Render a loading state until `loaded` is true, otherwise you'll briefly
// show the empty default.

import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef<T>(initialValue);

  // Load once per storage key.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!cancelled && raw != null) {
          const parsed = JSON.parse(raw) as T;
          latest.current = parsed;
          setValue(parsed);
        }
      } catch (error) {
        console.warn(`[storage] failed to load "${key}"`, error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  // Update local state immediately and persist the resolved value.
  const update = useCallback((next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function'
      ? (next as (prev: T) => T)(latest.current)
      : next;
    latest.current = resolved;
    setValue(resolved);
    AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(error => {
      console.warn(`[storage] failed to save "${key}"`, error);
    });
  }, [key]);

  return [value, update, loaded];
}

export default usePersistentState;
