import { useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    Animated,
    Platform,
    type KeyboardEvent,
} from 'react-native';

interface UseKeyboardReturn {
    keyboardHeight: number;
    keyboardAnimatedValue: Animated.Value;
    isKeyboardVisible: boolean;
}

/**
 * Tracks keyboard height with an Animated.Value for smooth transitions.
 *
 * Usage in a screen:
 *   const { keyboardHeight, isKeyboardVisible } = useKeyboard();
 *   // Pad a ScrollView or absolute bottom bar by keyboardHeight
 */
export function useKeyboard(): UseKeyboardReturn {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvent = Platform.OS === 'ios'
            ? 'keyboardWillShow'
            : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios'
            ? 'keyboardWillHide'
            : 'keyboardDidHide';

        const onShow = (e: KeyboardEvent) => {
            const height = e.endCoordinates.height;
            setKeyboardHeight(height);
            setIsKeyboardVisible(true);

            Animated.timing(animatedHeight, {
                toValue: height,
                duration: Platform.OS === 'ios' ? e.duration : 200,
                useNativeDriver: false,
            }).start();
        };

        const onHide = (e: KeyboardEvent) => {
            setIsKeyboardVisible(false);

            Animated.timing(animatedHeight, {
                toValue: 0,
                duration: Platform.OS === 'ios' ? e.duration : 200,
                useNativeDriver: false,
            }).start(() => setKeyboardHeight(0));
        };

        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [animatedHeight]);

    return {
        keyboardHeight,
        keyboardAnimatedValue: animatedHeight,
        isKeyboardVisible,
    };
}

/**
 * Simple boolean — just tells you if the keyboard is up.
 * Use this when you don't need the height value.
 */
export function useIsKeyboardVisible(): boolean {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () =>
            setIsVisible(true),
        );
        const hideSub = Keyboard.addListener('keyboardDidHide', () =>
            setIsVisible(false),
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return isVisible;
}