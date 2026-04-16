import React, { useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import Modal from 'react-native-modal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
    hideModal,
    selectModal,
    type ModalConfig,
} from '../../store/slices/uiSlice';
import { Colors } from '../../constants/colors';
import { BorderRadius, Shadow, Spacing, Layout } from '../../constants/spacing';

// ─── Redux-driven confirmation modal ─────────────────────────────────────────
// Reads from uiSlice.modal — dispatched via showModal() from anywhere in app

export function AppModal() {
    const dispatch = useAppDispatch();
    const config = useAppSelector(selectModal);

    const handleDismiss = useCallback(() => {
        dispatch(hideModal());
    }, [dispatch]);

    const handleConfirm = useCallback(() => {
        dispatch(hideModal());
        // Dispatch the optional confirm action if provided
        if (config?.onConfirmAction) {
            dispatch({ type: config.onConfirmAction, payload: config.payload });
        }
    }, [dispatch, config]);

    return (
        <Modal
            isVisible={!!config}
            onBackdropPress={handleDismiss}
            onBackButtonPress={handleDismiss}
            animationIn="zoomIn"
            animationOut="zoomOut"
            animationInTiming={200}
            animationOutTiming={150}
            backdropOpacity={0.5}
            useNativeDriver
            style={styles.modal}
        >
            {config && (
                <ConfirmationDialog
                    config={config}
                    onConfirm={handleConfirm}
                    onCancel={handleDismiss}
                />
            )}
        </Modal>
    );
}

// ─── Confirmation dialog content ──────────────────────────────────────────────

interface ConfirmationDialogProps {
    config: ModalConfig;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmationDialog({ config, onConfirm, onCancel }: ConfirmationDialogProps) {
    const isDestructive = config.confirmStyle === 'destructive';

    return (
        <View style={styles.dialog}>
            {/* Title */}
            <AppText variant="h4" center style={styles.title}>
                {config.title}
            </AppText>

            {/* Message */}
            {config.message && (
                <AppText
                    variant="body1"
                    secondary
                    center
                    style={styles.message}
                >
                    {config.message}
                </AppText>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <AppButton
                    label={config.cancelLabel ?? 'Cancel'}
                    variant="secondary"
                    onPress={onCancel}
                    style={styles.cancelButton}
                />
                <AppButton
                    label={config.confirmLabel ?? 'Confirm'}
                    variant={isDestructive ? 'destructive' : 'primary'}
                    onPress={onConfirm}
                    style={styles.confirmButton}
                />
            </View>
        </View>
    );
}

// ─── Custom content modal (presentational — not Redux-driven) ─────────────────
// Use this when you need more than a confirmation dialog

interface CustomModalProps {
    visible: boolean;
    onDismiss: () => void;
    children: React.ReactNode;
    title?: string;
    style?: ViewStyle;
    /** Prevent dismissing by tapping backdrop */
    blocking?: boolean;
    /** Full-screen height */
    fullScreen?: boolean;
}

export function CustomModal({
    visible,
    onDismiss,
    children,
    title,
    style,
    blocking = false,
    fullScreen = false,
}: CustomModalProps) {
    return (
        <Modal
            isVisible={visible}
            onBackdropPress={blocking ? undefined : onDismiss}
            onBackButtonPress={blocking ? undefined : onDismiss}
            animationIn={fullScreen ? 'slideInUp' : 'zoomIn'}
            animationOut={fullScreen ? 'slideOutDown' : 'zoomOut'}
            animationInTiming={250}
            animationOutTiming={200}
            backdropOpacity={0.5}
            useNativeDriver
            style={[styles.modal, fullScreen && styles.fullScreenModal]}
        >
            <View style={[styles.dialog, fullScreen && styles.fullScreenDialog, style]}>
                {/* Header */}
                {(title || !blocking) && (
                    <View style={styles.header}>
                        {title && (
                            <AppText variant="h4" style={styles.headerTitle}>
                                {title}
                            </AppText>
                        )}
                        {!blocking && (
                            <TouchableOpacity
                                onPress={onDismiss}
                                style={styles.closeButton}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <AppText variant="body1" color={Colors.textSecondary}>
                                    ✕
                                </AppText>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Content */}
                <View style={styles.customContent}>
                    {children}
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        paddingHorizontal: Spacing[5],
    },
    dialog: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        width: '100%',
        maxWidth: 400,
        padding: Spacing[6],
        ...Shadow.xl,
    },
    title: {
        marginBottom: Spacing[2],
    },
    message: {
        marginBottom: Spacing[6],
    },
    buttonRow: {
        flexDirection: 'row',
        gap: Spacing[3],
        marginTop: Spacing[2],
    },
    cancelButton: {
        flex: 1,
    },
    confirmButton: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing[4],
    },
    headerTitle: {
        flex: 1,
    },
    closeButton: {
        marginLeft: Spacing[2],
    },
    customContent: {
        // children define their own layout
    },
    fullScreenModal: {
        justifyContent: 'flex-end',
        paddingHorizontal: 0,
    },
    fullScreenDialog: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        maxWidth: '100%',
        padding: Spacing[6],
    },
});