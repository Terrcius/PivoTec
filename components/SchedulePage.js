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
import { t } from "../i18n";

const BLANK = {
  label: "",
  startHour: "06",
  startMinute: "00",
  duration: "30",
  days: [1, 2, 3, 4, 5],
  sectors: { sector_1: true, sector_2: true },
  isActive: true,
};

const SchedulePage = ({ theme, lang }) => {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  const DAYS = t(lang, "days");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchedules(await dynamoDBService.getSchedules("pivot_001"));
    } catch {
      Alert.alert(t(lang, "error_title"), t(lang, "error_load"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

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
      Alert.alert(t(lang, "error_title"), t(lang, "error_fields"));
      return;
    }
    if (h < 0 || h > 23) {
      Alert.alert(t(lang, "error_title"), t(lang, "error_hour"));
      return;
    }
    if (m < 0 || m > 59) {
      Alert.alert(t(lang, "error_title"), t(lang, "error_minute"));
      return;
    }
    if (d < 1 || d > 480) {
      Alert.alert(t(lang, "error_title"), t(lang, "error_duration"));
      return;
    }
    if (form.days.length === 0) {
      Alert.alert(t(lang, "error_title"), t(lang, "error_days"));
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
      Alert.alert(t(lang, "error_title"), t(lang, "error_save"));
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
    Alert.alert(
      t(lang, "delete_confirm_title"),
      t(lang, "delete_confirm_msg"),
      [
        { text: t(lang, "delete_confirm_cancel"), style: "cancel" },
        {
          text: t(lang, "delete_confirm_ok"),
          style: "destructive",
          onPress: async () => {
            await dynamoDBService.deleteSchedule("pivot_001", scheduleId);
            await load();
          },
        },
      ],
    );
  };

  const toggleDay = (i) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(i)
        ? f.days.filter((d) => d !== i)
        : [...f.days, i],
    }));

  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const patchHour = (v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean === "") { patch("startHour", ""); return; }
    const n = parseInt(clean);
    patch("startHour", n > 23 ? "23" : clean);
  };

  const patchMinute = (v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean === "") { patch("startMinute", ""); return; }
    const n = parseInt(clean);
    patch("startMinute", n > 59 ? "59" : clean);
  };

  const patchDuration = (v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean === "") { patch("duration", ""); return; }
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

  const s = styles(theme);
  const count = schedules.length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{t(lang, "schedule")}</Text>
          <Text style={s.headerSub}>
            {count}{" "}
            {count === 1
              ? t(lang, "schedules_count_one")
              : t(lang, "schedules_count_other")}
          </Text>
        </View>
        <TouchableOpacity onPress={load} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity style={s.addBtn} onPress={openModal}>
          <Ionicons name="add-circle-outline" size={20} color={theme.bg} />
          <Text style={s.addBtnText}>{t(lang, "new_schedule")}</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 50 }}
          />
        ) : schedules.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={64}
              color={theme.textFaint}
            />
            <Text style={s.emptyTitle}>{t(lang, "no_schedule")}</Text>
            <Text style={s.emptySub}>{t(lang, "no_schedule_sub")}</Text>
          </View>
        ) : (
          schedules.map((sc) => (
            <View
              key={sc.scheduleId}
              style={[s.card, !sc.isActive && s.cardOff]}
            >
              <View style={s.cardTop}>
                <View style={s.timeWrap}>
                  <View style={s.clockIcon}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View>
                    <Text style={s.timeText}>
                      {sc.startHour}:{sc.startMinute}
                    </Text>
                    <Text style={s.durationText}>
                      {t(lang, "duration_min")}{sc.duration}{t(lang, "duration_suffix")}
                    </Text>
                  </View>
                </View>
                <View style={s.cardActions}>
                  <Switch
                    value={!!sc.isActive}
                    onValueChange={() => handleToggleActive(sc)}
                    trackColor={{ false: theme.track, true: theme.primaryDark }}
                    thumbColor={sc.isActive ? theme.primary : theme.textMuted}
                  />
                </View>
              </View>

              {sc.label ? (
                <Text style={s.cardLabel}>{sc.label}</Text>
              ) : null}

              <View style={s.daysRow}>
                {DAYS.map((d, i) => (
                  <View
                    key={i}
                    style={[s.dayBadge, sc.days?.includes(i) && s.dayBadgeOn]}
                  >
                    <Text
                      style={[
                        s.dayTxt,
                        sc.days?.includes(i) && s.dayTxtOn,
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={s.cardFooter}>
                <View style={s.sectorsRow}>
                  {Object.entries(sc.sectors || {})
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <Text key={k} style={s.sectorTagTxt}>
                        • {k.replace("sector_", `${t(lang, "sectors")} `)}
                      </Text>
                    ))}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(sc.scheduleId)}
                  style={s.delBtn}
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
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>{t(lang, "new_schedule")}</Text>

              <Text style={s.formLabel}>{t(lang, "schedule_name_label")}</Text>
              <TextInput
                style={s.input}
                placeholder={t(lang, "schedule_name_placeholder")}
                placeholderTextColor={theme.textFaint}
                value={form.label}
                onChangeText={(v) => patch("label", v)}
              />

              <Text style={s.formLabel}>{t(lang, "start_time")}</Text>
              <View style={s.timeRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[s.input, s.timeInput]}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor={theme.textFaint}
                    value={form.startHour}
                    onChangeText={patchHour}
                    onBlur={blurHour}
                  />
                  <Text style={s.timeHint}>00 – 23</Text>
                </View>
                <Text style={s.colon}>:</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[s.input, s.timeInput]}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor={theme.textFaint}
                    value={form.startMinute}
                    onChangeText={patchMinute}
                    onBlur={blurMinute}
                  />
                  <Text style={s.timeHint}>00 – 59</Text>
                </View>
              </View>

              <Text style={s.formLabel}>{t(lang, "duration_label")}</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                maxLength={3}
                placeholder="30"
                placeholderTextColor={theme.textFaint}
                value={form.duration}
                onChangeText={patchDuration}
              />
              <Text style={s.timeHint}>{t(lang, "duration_hint")}</Text>

              <Text style={s.formLabel}>{t(lang, "weekdays")}</Text>
              <View style={s.daysSelector}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.daySel,
                      form.days.includes(i) && s.daySelOn,
                    ]}
                    onPress={() => toggleDay(i)}
                  >
                    <Text
                      style={[
                        s.daySelTxt,
                        form.days.includes(i) && s.daySelTxtOn,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.formLabel}>{t(lang, "sectors")}</Text>
              {["sector_1", "sector_2"].map((k) => (
                <View key={k} style={s.sectorRow}>
                  <Text style={s.sectorLabel}>
                    {k.replace("sector_", `${t(lang, "sectors")} `)}
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

              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => setModal(false)}
                >
                  <Text style={s.cancelBtnTxt}>{t(lang, "cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={theme.bg} size="small" />
                  ) : (
                    <Text style={s.saveBtnTxt}>{t(lang, "save")}</Text>
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

const styles = (theme) =>
  StyleSheet.create({
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
    addBtnText: { color: theme.bg, fontWeight: "bold", fontSize: 15 },

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

    daysRow: {
      flexDirection: "row",
      gap: 5,
      marginBottom: 12,
      flexWrap: "wrap",
    },
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
    daySelTxtOn: { color: theme.bg },

    sectorRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sectorLabel: { fontSize: 14, color: theme.text },

    modalBtns: {
      flexDirection: "row",
      gap: 10,
      marginTop: 20,
      marginBottom: 8,
    },
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
    saveBtnTxt: { color: theme.bg, fontWeight: "bold", fontSize: 15 },
  });

export default SchedulePage;