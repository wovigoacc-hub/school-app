/**
 * SchoolBridge — React Native App Entry Point
 */
import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store, useAppSelector, useAppDispatch } from './src/app/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppText } from './src/components/common/AppText';
import {
  selectToasts,
  dismissToast,
  type Toast,
  type ToastType,
} from './src/store/slices/uiSlice';
import { Colors } from './src/constants/colors';
import { BorderRadius, Spacing, ZIndex, Layout } from './src/constants/spacing';
import { FontSize, FontWeight } from './src/constants/typography';
import './src/i18n';   // initialise i18next side-effect

// ─── Toast colours ────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: Colors.successLight, icon: '✓', border: Colors.success },
  error: { bg: Colors.errorLight, icon: '✕', border: Colors.error },
  warning: { bg: Colors.warningLight, icon: '⚠', border: Colors.warning },
  info: { bg: Colors.infoLight, icon: 'ℹ', border: Colors.info },
};

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => dispatch(dismissToast(toast.id)));
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [opacity, toast.id, toast.duration, dispatch]);

  return (
    <Animated.View style={[styles.toast, { opacity, borderLeftColor: config.border, backgroundColor: config.bg }]}>
      <AppText style={[styles.toastIcon, { color: config.border }]}>
        {config.icon}
      </AppText>
      <AppText
        variant="body2"
        style={styles.toastText}
        numberOfLines={2}
      >
        {toast.message}
      </AppText>
      <TouchableOpacity
        onPress={() => dispatch(dismissToast(toast.id))}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <AppText style={styles.toastClose} secondary>✕</AppText>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────

function ToastContainer() {
  const toasts = useAppSelector(selectToasts);
  if (!toasts.length) return null;

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

// ─── Inner app (needs Provider context) ──────────────────────────────────────

function AppInner() {
  return (
    <View style={styles.root}>
      <RootNavigator />
      <ToastContainer />
    </View>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <AppInner />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: Layout.screenPaddingH,
    right: Layout.screenPaddingH,
    zIndex: ZIndex.toast,
    gap: Spacing[2],
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    paddingVertical: Spacing[3],
    paddingRight: Spacing[3],
    paddingLeft: Spacing[3],
    gap: Spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  toastIcon: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    flexShrink: 0,
  },
  toastText: {
    flex: 1,
    lineHeight: 18,
  },
  toastClose: {
    fontSize: FontSize.sm,
    flexShrink: 0,
  },
});