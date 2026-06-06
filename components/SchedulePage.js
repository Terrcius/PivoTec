import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { dynamoDBService } from "../services/dynamoDBService";
import { theme } from "../theme";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const BLANK = {
  label: "",
  startHour: "06",
  startMinute: "00",
  duration: "30",
  days: [1, 2, 3, 4, 5],
  sectors: { sector_1: true, sector_2: true },
  isActive: true,
};

const SchedulePage = () => {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchedules(await dynamoDBService.getSchedules("pivot_001"));
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openModal = () => {
    setForm({ ...BLANK });
    setModal(true);
  };

  const handleSave = async () => {
    const h = parseInt(form.startHour);
    const m = parseInt(form.startMinute);
    const d = parseInt(form.duration);

    if (isNaN(h) || isNaN(m) || isNaN(d)) {
      Alert.alert("Atenção", "Preencha todos os campos de horário e duração.");
      return;
    }
    if (h < 0 || h > 23) {
      Alert.alert("Atenção", "Hora deve ser entre 00 e 23.");
      return;
    }
    if (m < 0 || m > 59) {
      Alert.alert("Atenção", "Minuto deve ser entre 00 e 59.");
      return;
    }
    if (d < 1 || d > 480) {
      Alert.alert("Atenção", "Duração deve ser entre 1 e 480 minutos (8h).");
      return;
    }
    if (form.days.length === 0) {
      Alert.alert("Atenção", "Selecione ao menos um dia da semana.");
      return;
    }

    setSaving(true);
    try {
      await dynamoDBService.saveSchedule("pivot_001", {
        ...form,
        startHour: String(h).padStart(2, "0"),
        startMinute: String(m).padStart(2, "0"),
        duration: String(d),
        scheduleId: `sched_${Date.now()}`,
      });
      setModal(false);
      await load();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o agendamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (schedule) => {
    await dynamoDBService.saveSchedule("pivot_001", {
      ...schedule,
      isActive: !schedule.isActive,
    });
    await load();
  };

  const handleDelete = (scheduleId) => {
    Alert.alert("Confirmar exclusão", "Deseja remover este agendamento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          await dynamoDBService.deleteSchedule("pivot_001", scheduleId);
          await load();
        },
      },
    ]);
  };

  const toggleDay = (i) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(i) ? f.days.filter((d) => d !== i) : [...f.days, i],
    }));

  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const patchHour = (v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean === "") {
      patch("startHour", "");
      return;
    }
    const n = parseInt(clean);
    patch("startHour", n > 23 ? "23" : clean);
  };

  const patchMinute = (v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean === "") {
      patch("startMinute", "");
      return;
    }
    const n = parseInt(clean);
    patch("startMinute", n > 59 ? "59" : clean);
  };

  const patchDuration = (v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean === "") {
      patch("duration", "");
      return;
    }
    const n = parseInt(clean);
    patch("duration", n > 480 ? "480" : clean);
  };

  const blurHour = () => {
    if (form.startHour.length === 1)
      patch("startHour", form.startHour.padStart(2, "0"));
  };
  const blurMinute = () => {
    if (form.startMinute.length === 1)
      patch("startMinute", form.startMinute.padStart(2, "0"));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerSub}>
            {schedules.length} agendamento{schedules.length === 1 ? "" : "s"}
          </Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Ionicons name="add-circle-outline" size={20} color="#06281A" />
          <Text style={styles.addBtnText}>Novo Agendamento</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 50 }}
          />
        ) : schedules.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={64}
              color={theme.textFaint}
            />
            <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
            <Text style={styles.emptySub}>
              Crie agendamentos para irrigar automaticamente sem precisar abrir
              o app.
            </Text>
          </View>
        ) : (
          schedules.map((s) => (
            <View
              key={s.scheduleId}
              style={[styles.card, !s.isActive && styles.cardOff]}
            >
              <View style={styles.cardTop}>
                <View style={styles.timeWrap}>
                  <View style={styles.clockIcon}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.timeText}>
                      {s.startHour}:{s.startMinute}
                    </Text>
                    <Text style={styles.durationText}>
                      Duração · {s.duration} min
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Switch
                    value={!!s.isActive}
                    onValueChange={() => handleToggleActive(s)}
                    trackColor={{ false: theme.track, true: theme.primaryDark }}
                    thumbColor={s.isActive ? theme.primary : theme.textMuted}
                  />
                </View>
              </View>

              {s.label ? <Text style={styles.cardLabel}>{s.label}</Text> : null}

              <View style={styles.daysRow}>
                {DAYS.map((d, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dayBadge,
                      s.days?.includes(i) && styles.dayBadgeOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayTxt,
                        s.days?.includes(i) && styles.dayTxtOn,
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.sectorsRow}>
                  {Object.entries(s.sectors || {})
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <Text key={k} style={styles.sectorTagTxt}>
                        • {k.replace("sector_", "Setor ")}
                      </Text>
                    ))}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(s.scheduleId)}
                  style={styles.delBtn}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.danger}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Novo Agendamento</Text>

              <Text style={styles.formLabel}>Nome (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Irrigação matinal"
                placeholderTextColor={theme.textFaint}
                value={form.label}
                onChangeText={(v) => patch("label", v)}
              />

              <Text style={styles.formLabel}>Horário de início</Text>
              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor={theme.textFaint}
                    value={form.startHour}
                    onChangeText={patchHour}
                    onBlur={blurHour}
                  />
                  <Text style={styles.timeHint}>00 – 23</Text>
                </View>
                <Text style={styles.colon}>:</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor={theme.textFaint}
                    value={form.startMinute}
                    onChangeText={patchMinute}
                    onBlur={blurMinute}
                  />
                  <Text style={styles.timeHint}>00 – 59</Text>
                </View>
              </View>

              <Text style={styles.formLabel}>Duração (minutos)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={3}
                placeholder="30"
                placeholderTextColor={theme.textFaint}
                value={form.duration}
                onChangeText={patchDuration}
              />
              <Text style={styles.timeHint}>1 – 480 min (máx. 8 horas)</Text>

              <Text style={styles.formLabel}>Dias da semana</Text>
              <View style={styles.daysSelector}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.daySel,
                      form.days.includes(i) && styles.daySelOn,
                    ]}
                    onPress={() => toggleDay(i)}
                  >
                    <Text
                      style={[
                        styles.daySelTxt,
                        form.days.includes(i) && styles.daySelTxtOn,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Setores</Text>
              {["sector_1", "sector_2"].map((k) => (
                <View key={k} style={styles.sectorRow}>
                  <Text style={styles.sectorLabel}>
                    {k.replace("sector_", "Setor ")}
                  </Text>
                  <Switch
                    value={!!form.sectors[k]}
                    onValueChange={(v) =>
                      patch("sectors", { ...form.sectors, [k]: v })
                    }
                    trackColor={{ false: theme.track, true: theme.primaryDark }}
                    thumbColor={
                      form.sectors[k] ? theme.primary : theme.textMuted
                    }
                  />
                </View>
              ))}

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModal(false)}
                >
                  <Text style={styles.cancelBtnTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#06281A" size="small" />
                  ) : (
                    <Text style={styles.saveBtnTxt}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  refreshBtn: { padding: 6 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: theme.text },
  headerSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 24 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
    gap: 8,
  },
  addBtnText: { color: "#06281A", fontWeight: "bold", fontSize: 15 },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: theme.textMuted,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: theme.textFaint,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  card: {
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardOff: { opacity: 0.5 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  clockIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.bgCardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: { fontSize: 24, fontWeight: "bold", color: theme.text },
  durationText: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: { fontSize: 13, color: theme.textMuted, marginBottom: 10 },

  daysRow: { flexDirection: "row", gap: 5, marginBottom: 12, flexWrap: "wrap" },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: theme.bgCardAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dayBadgeOn: {
    backgroundColor: theme.primarySoft,
    borderColor: theme.primary,
  },
  dayTxt: { fontSize: 11, color: theme.textFaint, fontWeight: "600" },
  dayTxtOn: { color: theme.primary },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 10,
  },
  sectorsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap", flex: 1 },
  sectorTagTxt: { fontSize: 12, color: theme.textMuted, fontWeight: "600" },
  delBtn: { padding: 6 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.bgCardAlt,
  },
  timeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  timeInput: { textAlign: "center" },
  timeHint: {
    fontSize: 11,
    color: theme.textFaint,
    textAlign: "center",
    marginTop: 4,
  },
  colon: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.textMuted,
    marginTop: 10,
  },

  daysSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  daySel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.bgCardAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  daySelOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  daySelTxt: { fontSize: 12, fontWeight: "600", color: theme.textMuted },
  daySelTxtOn: { color: "#06281A" },

  sectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectorLabel: { fontSize: 14, color: theme.text },

  modalBtns: { flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnTxt: { color: theme.text, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveBtnTxt: { color: "#06281A", fontWeight: "bold", fontSize: 15 },
});

export default SchedulePage;
