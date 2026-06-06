import { ScrollView, StyleSheet, Pressable, View as RNView } from "react-native";
import { Text } from "@/tw";
import { spacing } from "@/lib/spacing";
import {
  formatMoney,
  useAppTheme,
  useLayout,
  usePreferences,
  useTranslation,
} from "@/lib/preferences";
import { typeStyle } from "@/theme/typography";

export type StatusFilter = "all" | "unpaid" | "paid" | "draft";

/** Proportion bar — three colored segments summing to 100% width */
function ProportionBar({
  stats,
}: {
  stats: { total: number; unpaid: number; paid: number; draft: number };
}) {
  const total = Math.max(stats.total, 1);
  const paidPct = (stats.paid / total) * 100;
  const unpaidPct = (stats.unpaid / total) * 100;
  const draftPct = (stats.draft / total) * 100;

  return (
    <RNView style={barStyles.track}>
      <RNView style={[barStyles.seg, { width: `${paidPct}%`, backgroundColor: "#34D399" }]} />
      <RNView style={[barStyles.seg, { width: `${unpaidPct}%`, backgroundColor: "#FBBF24" }]} />
      <RNView style={[barStyles.seg, { width: `${draftPct}%`, backgroundColor: "#818CF8" }]} />
    </RNView>
  );
}

const barStyles = StyleSheet.create({
  track: {
    flexDirection: "row",
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    marginTop: 14,
  },
  seg: { height: 5 },
});

interface HeroDashboardProps {
  unpaidTotal: number;
  stats: { total: number; unpaid: number; paid: number; draft: number };
  activeFilter: StatusFilter;
  onFilter: (filter: StatusFilter) => void;
}

export function HeroDashboard({
  unpaidTotal,
  stats,
  activeFilter,
  onFilter,
}: HeroDashboardProps) {
  const theme = useAppTheme();
  const { locale } = usePreferences();
  const { t } = useTranslation();
  const { row, alignEnd, textAlign } = useLayout();

  type ChipDef = {
    key: StatusFilter;
    label: string;
    value: number;
    dot: string;
    activeBg: string;
    activeText: string;
    inactiveBg: string;
    inactiveText: string;
  };

  const chips: ChipDef[] = [
    {
      key: "all",
      label: t.invoices.statAll,
      value: stats.total,
      dot: "#34D399",
      activeBg: "#0A3D2E",
      activeText: "#FFFFFF",
      inactiveBg: theme.colors.filterAll.bg,
      inactiveText: theme.colors.filterAll.text,
    },
    {
      key: "unpaid",
      label: t.invoices.statUnpaid,
      value: stats.unpaid,
      dot: "#FBBF24",
      activeBg: "#D97706",
      activeText: "#FFFFFF",
      inactiveBg: theme.colors.filterUnpaid.bg,
      inactiveText: theme.colors.filterUnpaid.text,
    },
    {
      key: "paid",
      label: t.invoices.statPaid,
      value: stats.paid,
      dot: "#34D399",
      activeBg: "#059669",
      activeText: "#FFFFFF",
      inactiveBg: theme.colors.filterPaid.bg,
      inactiveText: theme.colors.filterPaid.text,
    },
    {
      key: "draft",
      label: t.invoices.statDraft,
      value: stats.draft,
      dot: "#818CF8",
      activeBg: "#4F46E5",
      activeText: "#FFFFFF",
      inactiveBg: theme.colors.filterDraft.bg,
      inactiveText: theme.colors.filterDraft.text,
    },
  ];

  return (
    <RNView style={styles.wrap}>
      {/* ── Full-edge hero card — breaks out of screen padding ── */}
      <RNView style={[styles.hero, { backgroundColor: theme.colors.heroBg }]}>
        <RNView style={[styles.heroContent, { alignItems: alignEnd }]}>
          <Text style={[typeStyle("label"), { color: "rgba(255,255,255,0.6)", textAlign }]}>
            {t.invoices.unpaidTotal}
          </Text>
          <Text
            style={[typeStyle("moneyLg"), { color: "#FFFFFF", textAlign, marginTop: 2 }]}
            selectable
          >
            {formatMoney(unpaidTotal, locale)}{" "}
            <Text style={[typeStyle("title"), { color: "rgba(255,255,255,0.55)" }]}>
              {t.common.sar}
            </Text>
          </Text>
        </RNView>

        <ProportionBar stats={stats} />

        {/* Legend */}
        <RNView style={[styles.legend, { flexDirection: row }]}>
          {[
            { label: t.invoices.statPaid, dot: "#34D399" },
            { label: t.invoices.statUnpaid, dot: "#FBBF24" },
            { label: t.invoices.statDraft, dot: "#818CF8" },
          ].map((l) => (
            <RNView key={l.label} style={styles.legendItem}>
              <RNView style={[styles.legendDot, { backgroundColor: l.dot }]} />
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontFamily: typeStyle("caption").fontFamily }}>
                {l.label}
              </Text>
            </RNView>
          ))}
        </RNView>
      </RNView>

      {/* ── Small pill filter badges — horizontal scroll ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillsRow, { flexDirection: row }]}
      >
        {chips.map((chip) => {
          const active = activeFilter === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => onFilter(chip.key)}
              style={[
                styles.pill,
                { backgroundColor: active ? chip.activeBg : chip.inactiveBg },
              ]}
            >
              <RNView style={[styles.pillDot, { backgroundColor: active ? "rgba(255,255,255,0.8)" : chip.dot }]} />
              <Text
                style={[
                  typeStyle("label"),
                  {
                    color: active ? chip.activeText : chip.inactiveText,
                    fontSize: 11,
                  },
                ]}
              >
                {chip.value} {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </RNView>
  );
}

const SCREEN_X = spacing.screenX;

const styles = StyleSheet.create({
  wrap: {
    // Break out of FlatList's paddingHorizontal + add bottom gap
    marginHorizontal: -SCREEN_X,
    marginBottom: spacing.item + 4,
  },
  hero: {
    paddingHorizontal: SCREEN_X + 4,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroContent: {
    gap: 0,
  },
  legend: {
    marginTop: 10,
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillsRow: {
    paddingHorizontal: SCREEN_X,
    paddingTop: 10,
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
