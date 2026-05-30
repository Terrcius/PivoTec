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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { dynamoDBService } from "../services/dynamoDBService";

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

const SchedulePage = ({ onGoBack }) => {
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendamentos</Text>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Novo Agendamento</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3B82F6"
            style={{ marginTop: 50 }}
          />
        ) : schedules.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={64}
              color="#D1D5DB"
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
                <View>
                  <Text style={styles.timeText}>
                    {s.startHour}:{s.startMinute}
                  </Text>
                  <Text style={styles.durationText}>{s.duration} min</Text>
                </View>
                <View style={styles.cardActions}>
                  <Switch
                    value={!!s.isActive}
                    onValueChange={() => handleToggleActive(s)}
                    trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                    thumbColor={s.isActive ? "#10B981" : "#9CA3AF"}
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(s.scheduleId)}
                    style={styles.delBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
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

              <View style={styles.sectorsRow}>
                {Object.entries(s.sectors || {})
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <View key={k} style={styles.sectorTag}>
                      <Text style={styles.sectorTagTxt}>
                        {k.replace("sector_", "Setor ")}
                      </Text>
                    </View>
                  ))}
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
                    trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                    thumbColor={form.sectors[k] ? "#10B981" : "#9CA3AF"}
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
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnTxt}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F2F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6 },
  refreshBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  content: { padding: 16 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  addBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#9CA3AF",
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: "#D1D5DB",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  cardOff: { opacity: 0.55 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timeText: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  durationText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  delBtn: { padding: 6 },
  cardLabel: { fontSize: 13, color: "#6B7280", marginBottom: 8 },

  daysRow: { flexDirection: "row", gap: 4, marginBottom: 8, flexWrap: "wrap" },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  dayBadgeOn: { backgroundColor: "#DBEAFE" },
  dayTxt: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  dayTxtOn: { color: "#2563EB" },

  sectorsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  sectorTag: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectorTagTxt: { fontSize: 11, color: "#065F46", fontWeight: "600" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  timeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  timeInput: { textAlign: "center" },
  timeHint: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  colon: { fontSize: 24, fontWeight: "bold", color: "#374151", marginTop: 10 },

  daysSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  daySel: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  daySelOn: { backgroundColor: "#2563EB" },
  daySelTxt: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  daySelTxtOn: { color: "#FFF" },

  sectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectorLabel: { fontSize: 14, color: "#374151" },

  modalBtns: { flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnTxt: { color: "#374151", fontWeight: "600" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveBtnTxt: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});

export default SchedulePage;
