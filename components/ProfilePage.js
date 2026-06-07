import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../i18n";

const MOCK_USER = {
  name: "João Tércio",
  email: "joao.tercio@pivotec.com.br",
  role: "Produtor · Administrador",
  farm: "Fazenda Santa Helena",
  location: "Rio Verde, GO",
  plan: "PivôTec Pro",
  pivots: 3,
  memberSince: "Março de 2024",
};

const InfoRow = ({ icon, label, value, theme }) => (
  <View style={styles(theme).infoRow}>
    <View style={styles(theme).infoIcon}>
      <Ionicons name={icon} size={18} color={theme.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles(theme).infoLabel}>{label}</Text>
      <Text style={styles(theme).infoValue}>{value}</Text>
    </View>
  </View>
);

const ProfilePage = ({
  pivotId,
  deviceInfo = { ip: null, ver: null },
  isConnected = false,
  theme,
  isDark,
  onToggleTheme,
  lang,
  onToggleLang,
}) => {
  const insets = useSafeAreaInsets();
  const u = MOCK_USER;
  const s = styles(theme);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{t(lang, "profile")}</Text>
        <Text style={s.headerSub}>{t(lang, "account_data")}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Cartão do usuário */}
        <View style={s.userCard}>
          <View style={s.avatar}>
            <Ionicons name="person" size={40} color={theme.primary} />
          </View>
          <Text style={s.userName}>{u.name}</Text>
          <Text style={s.userEmail}>{u.email}</Text>
          <View style={s.roleBadge}>
            <Ionicons name="shield-checkmark" size={13} color={theme.primary} />
            <Text style={s.roleText}>{u.role}</Text>
          </View>
        </View>

        {/* Informações */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, "information")}</Text>
          <InfoRow theme={theme} icon="leaf-outline" label={t(lang, "property")} value={u.farm} />
          <InfoRow theme={theme} icon="location-outline" label={t(lang, "location")} value={u.location} />
          <InfoRow
            theme={theme}
            icon="hardware-chip-outline"
            label={t(lang, "registered_pivots")}
            value={`${u.pivots}${t(lang, "pivot_suffix")}`}
          />
          <InfoRow theme={theme} icon="calendar-outline" label={t(lang, "member_since")} value={u.memberSince} />
        </View>

        {/* Dispositivo */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, "device")}</Text>
          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <Ionicons name="hardware-chip-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>{t(lang, "pivot_label")}</Text>
              <Text style={s.infoValue}>{pivotId || "—"}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <Ionicons name="pulse-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>{t(lang, "status")}</Text>
              <View style={s.statusLine}>
                <View
                  style={[
                    s.statusDot,
                    { backgroundColor: isConnected ? theme.primary : theme.danger },
                  ]}
                />
                <Text
                  style={[
                    s.infoValue,
                    { color: isConnected ? theme.primary : theme.danger },
                  ]}
                >
                  {isConnected ? t(lang, "online") : t(lang, "offline")}
                </Text>
              </View>
            </View>
          </View>
          <InfoRow theme={theme} icon="wifi-outline" label={t(lang, "local_ip")} value={deviceInfo.ip || "—"} />
          <InfoRow
            theme={theme}
            icon="git-branch-outline"
            label={t(lang, "firmware_label")}
            value={deviceInfo.ver ? `v${deviceInfo.ver}` : "—"}
          />
        </View>

        {/* Plano */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, "plan")}</Text>
          <View style={s.planRow}>
            <View style={s.planIcon}>
              <Ionicons name="star" size={20} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.planName}>{u.plan}</Text>
              <Text style={s.planSub}>{t(lang, "plan_desc")}</Text>
            </View>
          </View>
        </View>

        {/* ── Aparência & Idioma ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, "appearance")}</Text>

          {/* Tema */}
          <View style={s.preferenceRow}>
            <View style={s.prefLeft}>
              <View style={s.prefIcon}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={18}
                  color={theme.primary}
                />
              </View>
              <Text style={s.prefLabel}>{t(lang, "dark_theme")}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={onToggleTheme}
              trackColor={{ false: theme.track, true: theme.primaryDark }}
              thumbColor={isDark ? theme.primary : theme.textMuted}
            />
          </View>

          <View style={s.prefDivider} />

          {/* Idioma */}
          <View style={s.preferenceRow}>
            <View style={s.prefLeft}>
              <View style={s.prefIcon}>
                <Ionicons name="language-outline" size={18} color={theme.primary} />
              </View>
              <Text style={s.prefLabel}>{t(lang, "language")}</Text>
            </View>
            <View style={s.langToggle}>
              <TouchableOpacity
                onPress={() => lang !== "pt" && onToggleLang("pt")}
                style={[
                  s.langBtn,
                  lang === "pt" && { backgroundColor: theme.primary },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.langBtnTxt,
                    lang === "pt" && { color: theme.bg, fontWeight: "bold" },
                  ]}
                >
                  PT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => lang !== "en" && onToggleLang("en")}
                style={[
                  s.langBtn,
                  lang === "en" && { backgroundColor: theme.primary },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.langBtnTxt,
                    lang === "en" && { color: theme.bg, fontWeight: "bold" },
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Aviso */}
        <View style={s.notice}>
          <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
          <Text style={s.noticeText}>{t(lang, "demo_notice")}</Text>
        </View>

        {/* Botão sair */}
        <TouchableOpacity style={s.logoutBtn} disabled activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={theme.textFaint} />
          <Text style={s.logoutText}>{t(lang, "logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = (theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { fontSize: 26, fontWeight: "bold", color: theme.text },
    headerSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
    content: { padding: 16, paddingTop: 4, paddingBottom: 24 },

    userCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: theme.bgCardAlt,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.primary,
      marginBottom: 12,
    },
    userName: { fontSize: 20, fontWeight: "bold", color: theme.text },
    userEmail: { fontSize: 13, color: theme.textMuted, marginTop: 3 },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: theme.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 12,
    },
    roleText: { fontSize: 12, fontWeight: "600", color: theme.primary },

    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.bgCardAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    infoLabel: { fontSize: 12, color: theme.textMuted },
    infoValue: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      marginTop: 1,
    },
    statusLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },

    planRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
    },
    planIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.warningSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    planName: { fontSize: 15, fontWeight: "bold", color: theme.text },
    planSub: { fontSize: 12, color: theme.textMuted, marginTop: 1 },

    // ── Preferências ──
    preferenceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    prefLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    prefIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.bgCardAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    prefLabel: { fontSize: 14, fontWeight: "600", color: theme.text },
    prefDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 2,
    },
    langToggle: {
      flexDirection: "row",
      backgroundColor: theme.bgCardAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    langBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 9,
    },
    langBtnTxt: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textMuted,
    },

    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.bgCardAlt,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      color: theme.textMuted,
      lineHeight: 17,
    },

    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.border,
      opacity: 0.6,
    },
    logoutText: { fontSize: 15, fontWeight: "600", color: theme.textFaint },
  });

export default ProfilePage;