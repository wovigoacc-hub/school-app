import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    type RefreshControlProps,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ─── Styled refresh control ───────────────────────────────────────────────────

interface AppRefreshControlProps
    extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh' | 'colors' | 'tintColor'> {
    refreshing: boolean;
    onRefresh: () => void | Promise<void>;
}

/**
 * Drop-in RefreshControl with consistent brand colours.
 *
 * Usage:
 *   <ScrollView
 *     refreshControl={
 *       <AppRefreshControl
 *         refreshing={isFetching}
 *         onRefresh={refetch}
 *       />
 *     }
 *   />
 */
export function AppRefreshControl({
    refreshing,
    onRefresh,
    ...rest
}: AppRefreshControlProps) {
    return (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // iOS spinner colour
            tintColor={Colors.primary}
            // Android spinner colour (array — cycles through colours)
            colors={[Colors.primary, Colors.primaryLight]}
            // Android progress background
            progressBackgroundColor={Colors.surface}
            {...rest}
        />
    );
}

// ─── useRefresh hook — wraps async refetch + refreshing state ─────────────────

/**
 * Manages the refreshing boolean so you don't have to.
 *
 * Usage:
 *   const { refreshing, onRefresh } = useRefresh(refetch);
 *   <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 */
export function useRefresh(
    refetchFn: () => Promise<unknown> | unknown,
): {
    refreshing: boolean;
    onRefresh: () => Promise<void>;
} {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetchFn();
        } finally {
            setRefreshing(false);
        }
    }, [refetchFn]);

    return { refreshing, onRefresh };
}