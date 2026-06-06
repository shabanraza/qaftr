import type { ColorScheme } from "./tokens";

export type InvoiceStatusKey = "draft" | "unpaid" | "paid" | "overdue";

const LIGHT: Record<InvoiceStatusKey, { color: string; bg: string }> = {
  draft: { color: "#5C7268", bg: "#E8EDEB" },
  unpaid: { color: "#8A5A10", bg: "#FFF3DC" },
  paid: { color: "#1A6B3A", bg: "#D4EDE5" },
  overdue: { color: "#9B2828", bg: "#FDEAEA" },
};

const DARK: Record<InvoiceStatusKey, { color: string; bg: string }> = {
  draft: { color: "#9CA3AF", bg: "#2D2D2D" },
  unpaid: { color: "#D4A84B", bg: "#3D3420" },
  paid: { color: "#5EC9A0", bg: "#1A2E26" },
  overdue: { color: "#F87171", bg: "#3D2222" },
};

export function getStatusStyle(status: string, scheme: ColorScheme) {
  const key = (status in LIGHT ? status : "draft") as InvoiceStatusKey;
  return scheme === "dark" ? DARK[key] : LIGHT[key];
}
