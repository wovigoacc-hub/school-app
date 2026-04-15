import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounces a value — returns the value only after `delay` ms have passed
 * without the value changing.
 *
 * Usage:
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 *   // Use debouncedQuery as the RTK Query arg
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Debounced callback — the function is only called after `delay` ms
 * without being invoked again. Useful for debouncing API calls directly.
 *
 * Usage:
 *   const debouncedSearch = useDebouncedCallback(
 *     (text: string) => doSearch(text),
 *     300,
 *   );
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay = 300,
): (...args: Parameters<T>) => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef<T>(callback);

    // Keep callback ref current without re-creating the debounced function
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay],
    );
}

/**
 * Throttled callback — the function is called at most once per `interval` ms.
 * Useful for scroll handlers or rapid button taps.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    interval = 500,
): (...args: Parameters<T>) => void {
    const lastCalledRef = useRef<number>(0);
    const callbackRef = useRef<T>(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastCalledRef.current >= interval) {
                lastCalledRef.current = now;
                callbackRef.current(...args);
            }
        },
        [interval],
    );
}