import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

// Abas da barra inferior. A 5ª ("Perfil") guarda os dados do usuário.
const TABS = [
  { key: "home", label: "Início", icon: "home" },
  { key: "config", label: "Configurar", icon: "settings" },
  { key: "schedule", label: "Agendar", icon: "calendar" },
  { key: "dados", label: "Dados", icon: "stats-chart" },
  { key: "perfil", label: "Perfil", icon: "person" },
];

const BottomNav = ({ active, onChange }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={isActive ? theme.primary : theme.textMuted}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
