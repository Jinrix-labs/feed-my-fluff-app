import { useColorScheme } from "react-native";

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Background colors
    background: isDark ? "#121212" : "#FFFFFF",
    backgroundSecondary: isDark ? "#1E1E1E" : "#F5F5F5",
    backgroundTertiary: isDark ? "#262626" : "#FAFAFA",

    // Surface colors
    surface: isDark ? "#1E1E1E" : "#FFFFFF",
    surfaceElevated: isDark ? "#262626" : "#FFFFFF",

    // Text colors
    text: isDark ? "rgba(255, 255, 255, 0.87)" : "#1A1A1A",
    textSecondary: isDark ? "rgba(255, 255, 255, 0.6)" : "#B4B4B4",
    textMuted: isDark ? "rgba(255, 255, 255, 0.4)" : "#9C9C9C",
    textDisabled: isDark ? "rgba(255, 255, 255, 0.38)" : "#CCCCCC",

    // Brand colors (adjusted for dark mode)
    primary: isDark ? "#8A63FF" : "#744BFF",
    primaryBackground: isDark ? "rgba(138, 99, 255, 0.1)" : "#F5F1FF",

    // Semantic colors
    success: isDark ? "#4CAF50" : "#4CAF50",
    warning: isDark ? "#FF9800" : "#FF9800",
    error: isDark ? "#F44336" : "#FF3B0A",

    // Border colors
    border: isDark ? "#2A2A2A" : "#EDEDED",
    borderLight: isDark ? "#1A1A1A" : "#F0F0F0",

    // Card backgrounds with slight elevation
    cardBackground: isDark ? "#1E1E1E" : "#FFFFFF",
    cardElevated: isDark ? "#2A2A2A" : "#FFFFFF",

    // Feed card specific colors (cute pet theme)
    feedCardYellow: isDark ? "#2A2416" : "#FFF7E5",
    feedCardPink: isDark ? "#2A1A24" : "#FFEFF8",
    feedCardPurple: isDark ? "#221E2A" : "#F4EEFF",
    feedCardGreen: isDark ? "#1E2A20" : "#F0FFF4",
    feedCardBlue: isDark ? "#1A1E2A" : "#F0F8FF",

    // Icon colors
    icon: isDark ? "rgba(255, 255, 255, 0.7)" : "#1A1A1A",
    iconSecondary: isDark ? "rgba(255, 255, 255, 0.5)" : "#6B6B6B",
  };

  return {
    colors,
    isDark,
    colorScheme,
  };
};

export const getThemedColor = (lightColor, darkColor, isDark) => {
  return isDark ? darkColor : lightColor;
};
