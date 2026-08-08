export const colors = {
  bg: "#f0f2f5",
  panel: "#ffffff",
  panelAlt: "#f6f7f9",
  border: "#e5e7eb",
  text: "#14171c",
  subtext: "#767a82",
  accent: "#0071e3",
  accentDark: "#005bb8",
  accentSoft: "#eaf3ff",
  danger: "#ff3b30",
  success: "#34c759",
};

export const shadow = {
  card: {
    shadowColor: "#0b1220",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  panel: {
    shadowColor: "#0b1220",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 3,
  },
  header: {
    shadowColor: "#0b1220",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
} as const;

export const radius = { sm: 6, md: 10, lg: 14 };

// Web-only smoothing for hover/active state changes. Cast to `any` since
// these CSS properties aren't part of RN's ViewStyle typings — react-native-web
// passes unrecognized style keys straight through to the DOM.
export const webTransition = {
  transitionProperty: "box-shadow, border-color, background-color, transform, opacity",
  transitionDuration: "150ms",
  transitionTimingFunction: "ease",
} as any;

export const LEFT_WIDTH = 300;
export const RIGHT_WIDTH = 320;

// px window widths at which the layout collapses panels into drawers.
export const BREAKPOINT_WIDE = 1180; // all three panes visible
export const BREAKPOINT_MEDIUM = 820; // left pane visible, right pane drawer
