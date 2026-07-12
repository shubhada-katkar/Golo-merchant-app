import { Fonts } from "../assets/font";

export const fontSizes = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  xxxl: 24,
};

export const fontFamilies = {
  regular: Fonts.regular,
  medium: Fonts.medium,
  semibold: Fonts.semibold,
  bold: Fonts.bold,
};

export const textPresets = {
  body: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: Math.round(fontSizes.xs * 1.5),
  },
  title: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xl,
    lineHeight: Math.round(fontSizes.xl * 1.5),
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    lineHeight: Math.round(fontSizes.md * 1.5),
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xxs,
    lineHeight: Math.round(fontSizes.xxs * 1.5),
  },
};
