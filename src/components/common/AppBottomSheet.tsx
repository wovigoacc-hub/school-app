import React, {
    useRef,
    useCallback,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    type ViewStyle,
} from 'react-native';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { AppText } from './AppText';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
    closeBottomSheet,
    selectActiveBottomSheet,
} from '../../store/slices/uiSlice';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../constants/spacing';

// ─── Imperative handle (for programmatic control) ─────────────────────────────

export interface AppBottomSheetHandle {
    open: () => void;
    close: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppBottomSheetProps {
    /** Unique ID — must match what's passed to openBottomSheet(id) */
    sheetId?: string;
    /** Snap point heights — defaults to ['50%', '90%'] */
    snapPoints?: (string | number)[];
    /** Initial snap index — 0 = first snap point */
    initialIndex?: number;
    title?: string;
    /** Show the × close button in the header */
    showClose?: boolean;
    /** Always render content (false = unmount when closed) */
    persistent?: boolean;
    /** Callback when sheet fully closes */
    onClose?: () => void;
    /** Use scrollable content variant */
    scrollable?: boolean;
    style?: ViewStyle;
    children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AppBottomSheet = forwardRef<AppBottomSheetHandle, AppBottomSheetProps>(
    (
        {
            sheetId,
            snapPoints = ['50%', '90%'],
            initialIndex = -1,
            title,
            showClose = true,
            persistent = false,
            onClose,
            scrollable = false,
            style,
            children,
        },
        ref,
    ) => {
        const dispatch = useAppDispatch();
        const activeSheet = useAppSelector(selectActiveBottomSheet);
        const bottomSheetRef = useRef<BottomSheet>(null);

        const isOpen = sheetId ? activeSheet === sheetId : false;

        // ─── Imperative handle ──────────────────────────────────────────────────
        useImperativeHandle(ref, () => ({
            open: () => bottomSheetRef.current?.expand(),
            close: () => bottomSheetRef.current?.close(),
        }));

        // ─── Sync with Redux when sheetId provided ──────────────────────────────
        useEffect(() => {
            if (!sheetId) return;
            if (isOpen) {
                bottomSheetRef.current?.expand();
            } else {
                bottomSheetRef.current?.close();
            }
        }, [isOpen, sheetId]);

        // ─── Handlers ──────────────────────────────────────────────────────────
        const handleClose = useCallback(() => {
            if (sheetId) dispatch(closeBottomSheet());
            onClose?.();
        }, [dispatch, sheetId, onClose]);

        const handleChange = useCallback(
            (index: number) => {
                if (index === -1) handleClose();
            },
            [handleClose],
        );

        // ─── Backdrop ───────────────────────────────────────────────────────────
        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                    pressBehavior="close"
                />
            ),
            [],
        );

        // ─── Handle component ───────────────────────────────────────────────────
        const renderHandle = useCallback(
            () => (
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                    {(title || showClose) && (
                        <View style={styles.header}>
                            <View style={styles.headerLeft} />
                            {title && (
                                <AppText variant="subtitle1" center style={styles.headerTitle}>
                                    {title}
                                </AppText>
                            )}
                            {showClose ? (
                                <TouchableOpacity
                                    onPress={() => bottomSheetRef.current?.close()}
                                    style={styles.closeButton}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close"
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <AppText variant="body1" secondary>✕</AppText>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.headerLeft} />
                            )}
                        </View>
                    )}
                </View>
            ),
            [title, showClose],
        );

        const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={initialIndex}
                snapPoints={snapPoints}
                onChange={handleChange}
                backdropComponent={renderBackdrop}
                handleComponent={renderHandle}
                enablePanDownToClose
                backgroundStyle={styles.background}
                style={style}
            >
                <ContentWrapper
                    style={styles.content}
                    contentContainerStyle={scrollable ? styles.scrollContent : undefined}
                >
                    {children}
                </ContentWrapper>
            </BottomSheet>
        );
    },
);

AppBottomSheet.displayName = 'AppBottomSheet';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    background: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius['3xl'],
        borderTopRightRadius: BorderRadius['3xl'],
    },
    handleContainer: {
        paddingTop: Spacing[2],
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.grey300,
        alignSelf: 'center',
        marginBottom: Spacing[2],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.screenPaddingH,
        paddingBottom: Spacing[3],
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    headerLeft: {
        width: 28,  // mirror close button width for centering
    },
    headerTitle: {
        flex: 1,
    },
    closeButton: {
        width: 28,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing[10],
    },
});