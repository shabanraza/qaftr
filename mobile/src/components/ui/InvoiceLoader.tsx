import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

export interface InvoiceLoaderProps {
  /** Outer diameter in px */
  size?: number;
  primary?: string;
  accent?: string;
}

/**
 * Branded loader: rotating arc + QR-corner accents + invoice line bars.
 */
export function InvoiceLoader({
  size = 52,
  primary = "#0A3D2E",
  accent = "#C8973A",
}: InvoiceLoaderProps) {
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);
  const barPhase = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    barPhase.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [spin, breathe, barPhase]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.96, 1.04]) }],
  }));

  const r = size / 2;
  const stroke = Math.max(2.5, size * 0.055);
  const radius = r - stroke * 1.2;
  const circumference = 2 * Math.PI * radius;

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(spin.value, [0, 1], [circumference * 0.72, circumference * 0.08]),
  }));

  const cornerSize = size * 0.14;
  const cornerInset = size * 0.22;
  const cornerStroke = Math.max(2, size * 0.04);

  const cornerTL = useAnimatedProps(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.45, 1]),
  }));
  const cornerBR = useAnimatedProps(() => ({
    opacity: interpolate(breathe.value, [0, 1], [1, 0.45]),
  }));

  const barY = r + size * 0.02;
  const barW = size * 0.34;
  const barH = Math.max(2, size * 0.035);
  const barGap = size * 0.09;

  const barLeft = r - barW / 2;

  const bar1Props = useAnimatedProps(() => ({
    opacity: interpolate(barPhase.value, [0, 0.33, 0.66, 1], [1, 0.35, 0.35, 1]),
    x2: barLeft + interpolate(barPhase.value, [0, 0.5, 1], [barW, barW * 0.55, barW]),
  }));
  const bar2Props = useAnimatedProps(() => ({
    opacity: interpolate(barPhase.value, [0, 0.33, 0.66, 1], [0.35, 1, 0.35, 0.35]),
    x2: barLeft + interpolate(barPhase.value, [0, 0.5, 1], [barW * 0.7, barW, barW * 0.7]),
  }));
  const bar3Props = useAnimatedProps(() => ({
    opacity: interpolate(barPhase.value, [0, 0.33, 0.66, 1], [0.35, 0.35, 1, 0.35]),
    x2: barLeft + interpolate(barPhase.value, [0, 0.5, 1], [barW * 0.45, barW * 0.8, barW * 0.45]),
  }));

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, wrapStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={r}
          cy={r}
          r={radius}
          stroke={`${primary}22`}
          strokeWidth={stroke}
          fill="none"
        />

        <AnimatedCircle
          cx={r}
          cy={r}
          r={radius}
          stroke={accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.28} ${circumference * 0.72}`}
          animatedProps={arcProps}
          transform={`rotate(-90 ${r} ${r})`}
        />

        <AnimatedRect
          x={cornerInset}
          y={cornerInset}
          width={cornerSize}
          height={cornerSize}
          rx={2}
          stroke={primary}
          strokeWidth={cornerStroke}
          fill="none"
          animatedProps={cornerTL}
        />
        <AnimatedRect
          x={size - cornerInset - cornerSize}
          y={size - cornerInset - cornerSize}
          width={cornerSize}
          height={cornerSize}
          rx={2}
          stroke={primary}
          strokeWidth={cornerStroke}
          fill="none"
          animatedProps={cornerBR}
        />

        <AnimatedLine
          x1={barLeft}
          y1={barY - barGap}
          x2={barLeft + barW}
          y2={barY - barGap}
          stroke={primary}
          strokeWidth={barH}
          strokeLinecap="round"
          animatedProps={bar1Props}
        />
        <AnimatedLine
          x1={barLeft}
          y1={barY}
          x2={barLeft + barW}
          y2={barY}
          stroke={primary}
          strokeWidth={barH}
          strokeLinecap="round"
          animatedProps={bar2Props}
        />
        <AnimatedLine
          x1={barLeft}
          y1={barY + barGap}
          x2={barLeft + barW}
          y2={barY + barGap}
          stroke={accent}
          strokeWidth={barH}
          strokeLinecap="round"
          animatedProps={bar3Props}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
