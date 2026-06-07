import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../i18n";

const BottomNav = ({ active, onChange, theme, lang }) => {
  const insets = useSafeAreaInsets();

  const TABS = [
    { key: "home", labelKey: "nav_home", icon: "home" },
    { key: "config", labelKey: "nav_config", icon: "settings" },
    { key: "schedule", labelKey: "nav_schedule", icon: "calendar" },
    { key: "dados", labelKey: "nav_data", icon: "stats-chart" },
    { key: "perfil", labelKey: "nav_profile", icon: "person" },
  ];

  return (
    <View style={[styles(theme).bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles(theme).item}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles(theme).iconWrap, isActive && styles(theme).iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={isActive ? theme.primary : theme.textMuted}
              />
            </View>
            <Text style={[styles(theme).label, isActive && styles(theme).labelActive]}>
              {t(lang, tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = (theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: theme.bgCard,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 8,
      paddingHorizontal: 4,
    },
    item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
    iconWrap: {
      width: 46,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapActive: { backgroundColor: theme.primarySoft },
    label: { fontSize: 10, fontWeight: "600", color: theme.textMuted },
    labelActive: { color: theme.primary },
  });

export default BottomNav;