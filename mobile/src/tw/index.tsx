import { useCssElement, useNativeVariable as useFunctionalVariable, styled } from "react-native-css";
import { Link as RouterLink } from "expo-router";
import Animated from "react-native-reanimated";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableHighlight as RNTouchableHighlight,
  type ViewProps as RNViewProps,
  type TextProps as RNTextProps,
  type PressableProps,
  type ScrollViewProps,
  type TextInputProps,
  type TouchableHighlightProps,
} from "react-native";

export const useCSSVariable =
  process.env.EXPO_OS !== "web"
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

export type ViewProps = RNViewProps & { className?: string };
export const View = (props: ViewProps) =>
  useCssElement(RNView, props, { className: "style" });
View.displayName = "CSS(View)";

export type TextProps = RNTextProps & { className?: string };
export const Text = (props: TextProps) =>
  useCssElement(RNText, props, { className: "style" });
Text.displayName = "CSS(Text)";

export type TWScrollViewProps = ScrollViewProps & {
  className?: string;
  contentContainerClassName?: string;
};
export const ScrollView = (props: TWScrollViewProps) =>
  useCssElement(RNScrollView, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
ScrollView.displayName = "CSS(ScrollView)";

export type TWPressableProps = PressableProps & { className?: string };
export const Pressable = (props: TWPressableProps) =>
  useCssElement(RNPressable, props, { className: "style" });
Pressable.displayName = "CSS(Pressable)";

export type TWTextInputProps = TextInputProps & { className?: string };
export const TextInput = (props: TWTextInputProps) =>
  useCssElement(RNTextInput, props, { className: "style" });
TextInput.displayName = "CSS(TextInput)";

function _TouchableHighlight(props: TouchableHighlightProps) {
  const { underlayColor, ...style } = StyleSheet.flatten(props.style) ?? {};
  return (
    <RNTouchableHighlight underlayColor={underlayColor as string | undefined} {...props} style={style} />
  );
}
export const TouchableHighlight = (props: TouchableHighlightProps) =>
  useCssElement(_TouchableHighlight, props, { className: "style" });
TouchableHighlight.displayName = "CSS(TouchableHighlight)";

export type TWLinkProps = React.ComponentProps<typeof RouterLink> & { className?: string };
export const Link = (props: TWLinkProps) =>
  useCssElement(RouterLink, props, { className: "style" });
Link.Trigger = RouterLink.Trigger;
Link.Menu = RouterLink.Menu;
Link.MenuAction = RouterLink.MenuAction;
Link.Preview = RouterLink.Preview;

// Animated wrapper with className support via styled (cssInterop equivalent)
const _AnimatedRNView = Animated.createAnimatedComponent(RNView);
export const AnimatedView = styled(_AnimatedRNView, { className: "style" }) as React.ComponentType<
  React.ComponentProps<typeof RNView> & {
    className?: string;
    entering?: unknown;
    exiting?: unknown;
    layout?: unknown;
  }
>;
