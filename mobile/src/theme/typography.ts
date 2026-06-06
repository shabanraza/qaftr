import type { TextStyle } from "react-native";

export const fonts = {
  regular: "ReadexPro_400Regular",
  medium: "ReadexPro_500Medium",
  semiBold: "ReadexPro_600SemiBold",
  bold: "ReadexPro_700Bold",
} as const;

export type TypeRole =
  | "display"
  | "title"
  | "headline"
  | "body"
  | "bodyMedium"
  | "caption"
  | "label"
  | "money"
  | "moneyLg";

const SCALE: Record<TypeRole, TextStyle> = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  money: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  moneyLg: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
  },
};

export function typeStyle(role: TypeRole): TextStyle {
  return SCALE[role];
}
