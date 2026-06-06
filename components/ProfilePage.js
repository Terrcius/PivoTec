import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

// ─── Dados fictícios (placeholder até implementarmos o login) ────────────────
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

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={18} color={theme.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ProfilePage = ({
  pivotId,
  deviceInfo = { ip: null, ver: null },
  isConnected = false,
}) => {
  const insets = useSafeAreaInsets();
  const u = MOCK_USER;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <Text style={styles.headerSub}>Dados da conta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cartão do usuário */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={theme.primary} />
          </View>
          <Text style={styles.userName}>{u.name}</Text>
          <Text style={styles.userEmail}>{u.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={13} color={theme.primary} />
            <Text style={styles.roleText}>{u.role}</Text>
          </View>
        </View>

        {/* Informações */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações</Text>
          <InfoRow icon="leaf-outline" label="Propriedade" value={u.farm} />
          <InfoRow
            icon="location-outline"
            label="Localização"
            value={u.location}
          />
          <InfoRow
            icon="hardware-chip-outline"
            label="Pivôs cadastrados"
            value={`${u.pivots} pivôs`}
          />
          <InfoRow
            icon="calendar-outline"
            label="Membro desde"
            value={u.memberSince}
          />
        </View>

        {/* Dispositivo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dispositivo</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="hardware-chip-outline"
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Pivô</Text>
              <Text style={styles.infoValue}>{pivotId || "—"}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="pulse-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusLine}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isConnected
                        ? theme.primary
                        : theme.danger,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.infoValue,
                    { color: isConnected ? theme.primary : theme.danger },
                  ]}
                >
                  {isConnected ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
          <InfoRow
            icon="wifi-outline"
            label="IP local"
            value={deviceInfo.ip || "—"}
          />
          <InfoRow
            icon="git-branch-outline"
            label="Firmware"
            value={deviceInfo.ver ? `v${deviceInfo.ver}` : "—"}
          />
        </View>

        {/* Plano */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plano</Text>
          <View style={styles.planRow}>
            <View style={styles.planIcon}>
              <Ionicons name="star" size={20} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>{u.plan}</Text>
              <Text style={styles.planSub}>Monitoramento em tempo real</Text>
            </View>
          </View>
        </View>

        {/* Aviso de login futuro */}
        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={theme.textMuted}
          />
          <Text style={styles.noticeText}>
            Dados de demonstração. O login da conta será implementado em breve.
          </Text>
        </View>

        {/* Botão sair (desabilitado por enquanto) */}
        <TouchableOpacity style={styles.logoutBtn} disabled activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={theme.textFaint} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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

  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.bgCardAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  noticeText: { flex: 1, fontSize: 12, color: theme.textMuted, lineHeight: 17 },

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
