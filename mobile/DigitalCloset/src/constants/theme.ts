/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#A99B75';
const tintColorDark = '#C4B694';

export const Colors = {
  light: {
    text: '#2D2A24',
    secondaryText: '#6B6659',
    actionText: '#7A7EA3',
    error: '#E57373',
    success: '#81C784',
    background: '#EDEBE8',
    tint: tintColorLight,
    icon: '#6B6659',
    tabIconDefault: '#6B6659',
    tabIconSelected: tintColorLight,
    primary: '#A99B75',
    secondary: '#EDEBE8',
    alternate: '#9B9FC2',
  },
  dark: {
    text: '#EDEBE8',
    secondaryText: '#A99B75',
    actionText: '#BFC3E0',
    error: '#E57373',
    success: '#81C784',
    background: '#1A1918',
    tint: tintColorDark,
    icon: '#A99B75',
    tabIconDefault: '#A99B75',
    tabIconSelected: tintColorDark,
    primary: '#C4B694',
    secondary: '#1A1918',
    alternate: '#9B9FC2',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
