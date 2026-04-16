import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../constants/spacing';
import { BUILD_FLAGS } from '../../constants/config';

// ─── Props & state ────────────────────────────────────────────────────────────

interface Props {
    children: ReactNode;
    /** Custom fallback UI — receives error and retry handler */
    fallback?: (error: Error, retry: () => void) => ReactNode;
    /** Callback for logging to Sentry / Crashlytics */
    onError?: (error: Error, info: ErrorInfo) => void;
    /** Screen name for error context */
    screenName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
}

// ─── Error boundary ───────────────────────────────────────────────────────────

export class AppErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.setState({ errorInfo: info });
        this.props.onError?.(error, info);

        // In development, log to console for easy debugging
        if (BUILD_FLAGS.IS_DEV) {
            console.error('[AppErrorBoundary]', error);
            console.error(info.componentStack);
        }
        // TODO: Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }

    retry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        });
    };

    toggleDetails = () => {
        this.setState((prev) => ({ showDetails: !prev.showDetails }));
    };

    render() {
        const { hasError, error, errorInfo, showDetails } = this.state;
        const { children, fallback, screenName } = this.props;

        if (!hasError) return children;

        // Custom fallback
        if (fallback && error) return fallback(error, this.retry);

        // Default fallback UI
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <AppText style={styles.icon}>⚠️</AppText>

                    <AppText variant="h4" center style={styles.title}>
                        Something went wrong
                    </AppText>

                    <AppText variant="body2" secondary center style={styles.message}>
                        {screenName
                            ? `An error occurred on the ${screenName} screen.`
                            : 'An unexpected error occurred.'}
                        {'\n'}Please try again or contact support if it persists.
                    </AppText>

                    <AppButton
                        label="Try Again"
                        onPress={this.retry}
                        variant="primary"
                        style={styles.retryButton}
                        fullWidth
                    />

                    {/* Dev-only: show error details */}
                    {BUILD_FLAGS.IS_DEV && error && (
                        <>
                            <TouchableOpacity
                                onPress={this.toggleDetails}
                                style={styles.detailsToggle}
                            >
                                <AppText variant="labelSmall" color={Colors.textTertiary}>
                                    {showDetails ? 'Hide' : 'Show'} error details
                                </AppText>
                            </TouchableOpacity>

                            {showDetails && (
                                <ScrollView style={styles.detailsBox}>
                                    <AppText
                                        variant="mono"
                                        color={Colors.error}
                                        style={styles.errorText}
                                    >
                                        {error.name}: {error.message}
                                    </AppText>
                                    {errorInfo?.componentStack && (
                                        <AppText
                                            variant="mono"
                                            secondary
                                            style={styles.stackText}
                                        >
                                            {errorInfo.componentStack}
                                        </AppText>
                                    )}
                                </ScrollView>
                            )}
                        </>
                    )}
                </View>
            </View>
        );
    }
}

// ─── Functional wrapper for per-screen use ────────────────────────────────────

interface ErrorBoundaryProps {
    children: ReactNode;
    screenName?: string;
    onError?: (error: Error, info: ErrorInfo) => void;
}

export function ScreenErrorBoundary({ children, screenName, onError }: ErrorBoundaryProps) {
    return (
        <AppErrorBoundary screenName={screenName} onError={onError}>
            {children}
        </AppErrorBoundary>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Layout.screenPaddingH,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing[6],
        width: '100%',
        alignItems: 'center',
    },
    icon: {
        fontSize: 48,
        marginBottom: Spacing[3],
    },
    title: {
        marginBottom: Spacing[2],
    },
    message: {
        marginBottom: Spacing[5],
        lineHeight: 22,
    },
    retryButton: {
        marginBottom: Spacing[3],
    },
    detailsToggle: {
        paddingVertical: Spacing[2],
    },
    detailsBox: {
        maxHeight: 200,
        marginTop: Spacing[2],
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing[3],
        width: '100%',
    },
    errorText: {
        fontSize: 11,
        marginBottom: Spacing[2],
    },
    stackText: {
        fontSize: 10,
    },
});