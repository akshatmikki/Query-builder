import { useWindowDimensions } from "react-native";
import { BREAKPOINT_MEDIUM, BREAKPOINT_WIDE } from "./theme";

export type LayoutMode = "wide" | "medium" | "narrow";

// wide: left + middle + right all docked
// medium: left docked, right becomes a drawer
// narrow: middle only, left + right both become drawers
export function useLayoutMode(): LayoutMode {
  const { width } = useWindowDimensions();
  if (width >= BREAKPOINT_WIDE) return "wide";
  if (width >= BREAKPOINT_MEDIUM) return "medium";
  return "narrow";
}
