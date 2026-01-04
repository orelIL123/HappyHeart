import { Platform } from 'react-native';

/**
 * Android-specific style improvements to match iOS appearance
 */

/**
 * Creates platform-specific shadow styles that work better on Android
 */
export const createShadow = (elevation: number = 5) => {
  if (Platform.OS === 'android') {
    return {
      elevation: elevation,
      shadowColor: '#000',
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 0.2,
    shadowRadius: elevation,
  };
};

/**
 * Fixes text clipping issues on Android
 */
export const androidTextFix = Platform.OS === 'android' ? {
  includeFontPadding: false,
  textAlignVertical: 'center' as const,
} : {};

/**
 * Ensures bottom tab bar is visible on Android
 */
export const androidBottomSafeArea = Platform.OS === 'android' ? {
  paddingBottom: 20, // Extra padding for Android to ensure tab bar doesn't cover content
} : {};

/**
 * Better spacing for Android UI elements
 */
export const androidSpacing = {
  paddingHorizontal: Platform.OS === 'android' ? 18 : 16,
  paddingVertical: Platform.OS === 'android' ? 14 : 12,
};

/**
 * Android-specific button styles to prevent text overflow
 */
export const androidButtonFix = Platform.OS === 'android' ? {
  minHeight: 50,
  paddingHorizontal: 20,
  paddingVertical: 12,
} : {};

/**
 * Prevent font scaling issues on Android
 */
export const preventFontScaling = {
  allowFontScaling: false,
};

/**
 * Better text rendering on Android
 */
export const androidTextStyle = Platform.OS === 'android' ? {
  includeFontPadding: false,
  textAlignVertical: 'center' as const,
} : {};

/**
 * Fix for RTL text alignment on Android
 */
export const androidRTLFix = {
  writingDirection: 'rtl' as const,
};
