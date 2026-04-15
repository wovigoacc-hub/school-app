import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

// ─── rootReducer owns RootState — import from there, never re-declare here ───
import rootReducer, { type RootState } from './rootReducer';
import { api } from '../services/root/api';
import offlineMiddleware from '../store/middleware/offlineMiddleware';

// ─── Reactotron enhancer (dev only) ──────────────────────────────────────────

let reactotronEnhancer: any = undefined;

if (__DEV__) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Reactotron = require('../config/reactotron.config').default;
        reactotronEnhancer = Reactotron.createEnhancer?.();
    } catch {
        // Reactotron not configured — skip silently
    }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
    reducer: rootReducer,

    // RTK 2.x: getDefaultMiddleware returns a Tuple — use .concat() which
    // preserves the Tuple type (Array.concat would widen it to any[])
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'api/executeMutation/pending',
                    'api/executeQuery/pending',
                    'api/internalSubscriptions/subscriptionsUpdated',
                ],
                ignoredPaths: [api.reducerPath],
            },
        })
            .concat(api.middleware)
            .concat(offlineMiddleware),

    // enhancers receives the default enhancer builder, not the array directly
    enhancers: reactotronEnhancer
        ? (getDefaultEnhancers) => getDefaultEnhancers().concat(reactotronEnhancer)
        : undefined,

    devTools: __DEV__,
});

// ─── Types ───────────────────────────────────────────────────────────────────
// RootState lives in rootReducer.ts — re-export it from here for convenience
// so callers can import from either place without caring about the distinction

export type { RootState };
export type AppDispatch = typeof store.dispatch;

// ─── Typed hooks ─────────────────────────────────────────────────────────────
// Use useAppDispatch / useAppSelector everywhere — never the plain versions

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;