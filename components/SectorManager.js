import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { t } from "../i18n";
import { CROPS, cropName, MIN_SECTORS, MAX_SECTORS } from "../crops";

// ─── Slider de setor com label animado ───────────────────────────────────────
const SectorSlider = ({ label, icon, value, tintColor, onChange, onComplete, theme }) => {
  const [local, setLocal] = useState(value);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const flash = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const s = sliderStyles(theme);
  return (
    <View style={s.wrap}>
      <View style={s.labelRow}>
        <Text style={s.icon}>{icon}</Text>
        <Text style={s.label}>{label}</Text>
        <Animated.Text style={[s.value, { color: tintColor, opacity: fadeAnim }]}>
          {Math.round(local)}%
        </Animated.Text>
      </View>
      <Slider
        style={s.slider}
        minimumValue={0}
        maximumValue={100}
        minimumTrackTintColor={tintColor}
        maximumTrackTintColor={theme.track}
        thumbTintColor={tintColor}
        value={local}
        onValueChange={(v) => { setLocal(v); flash(); onChange?.(v); }}
        onSlidingComplete={(v) => { onComplete?.(Math.round(v)); }}
      />
    </View>
  );
};

const sliderStyles = (theme) =>
  StyleSheet.create({
    wrap: { marginTop: 10 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
    icon: { fontSize: 14 },
    label: { flex: 1, fontSize: 13, fontWeight: "600", color: theme.text },
    value: { fontSize: 13, fontWeight: "bold", minWidth: 36, textAlign: "right" },
    slider: { width: "100%", height: 36 },
  });

// ─── Componente principal ─────────────────────────────────────────────────────
const SectorManager = ({
  visible,
  onClose,
  sectors = {},
  onAddSector,
  onChangeCrop,
  onDeleteSector,
  // Novos props de setorização
  setorizacaoAtiva,
  onToggleSetorizacao,
  onConfigSetor,
  transitSpeed,
  onChangeTransitSpeed,
  theme,
  lang,
}) => {
  const s = styles(theme);
  const keys = Object.keys(sectors).sort();
  const count = keys.length;

  // Estado local dos configs de cada setor para os sliders
  // Estrutura: { sector_1: { vel: 70, luz: 100, vazao: 60 }, ... }
  const [sectorCfg, setSectorCfg] = useState(() => {
    const init = {};
    keys.forEach((k) => {
      init[k] = {
        vel:   sectors[k].cfg_vel   ?? 70,
        luz:   sectors[k].cfg_luz   ?? 100,
        vazao: sectors[k].cfg_vazao ?? 60,
      };
    });
    return init;
  });

  const [localTransit, setLocalTransit] = useState(transitSpeed ?? 80);

  const getCfg = (key) => sectorCfg[key] ?? { vel: 70, luz: 100, vazao: 60 };

  const updateCfg = (key, field, value) => {
    setSectorCfg((prev) => ({
      ...prev,
      [key]: { ...getCfg(key), [field]: value },
    }));
  };

  // Número do setor (1-4) a partir da chave "sector_N"
  const sectorNum = (key) => parseInt(key.replace("sector_", ""), 10) || 1;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.card}>

          {/* ── Cabeçalho ── */}
          <View style={s.headerRow}>
            <Text style={s.title}>{t(lang, "manage_sectors")}</Text>
            <Text style={s.count}>
              {count}/{MAX_SECTORS} {t(lang, "sectors_count")}
            </Text>
          </View>

          {/* ── Toggle de Setorização ── */}
          <View style={[
            s.setorizacaoCard,
            setorizacaoAtiva && { borderColor: theme.primary, backgroundColor: theme.primarySoft },
          ]}>
            <View style={s.setorizacaoTop}>
              <View style={s.setorizacaoLeft}>
                <View style={[
                  s.setorizacaoIconWrap,
                  { backgroundColor: setorizacaoAtiva ? theme.primary : theme.bgCardAlt },
                ]}>
                  <Ionicons
                    name="git-branch-outline"
                    size={20}
                    color={setorizacaoAtiva ? theme.bg : theme.textMuted}
                  />
                </View>
                <View>
                  <Text style={[
                    s.setorizacaoTitle,
                    setorizacaoAtiva && { color: theme.primary },
                  ]}>
                    {setorizacaoAtiva
                      ? t(lang, "sectorization_on")
                      : t(lang, "sectorization_off")}
                  </Text>
                </View>
              </View>
              <Switch
                value={!!setorizacaoAtiva}
                onValueChange={onToggleSetorizacao}
                trackColor={{ false: theme.track, true: theme.primaryDark }}
                thumbColor={setorizacaoAtiva ? theme.primary : theme.textMuted}
              />
            </View>
            <Text style={s.setorizacaoDesc}>
              {setorizacaoAtiva
                ? t(lang, "sectorization_desc_on")
                : t(lang, "sectorization_desc_off")}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── Setores ── */}
            {keys.map((key, idx) => {
              const sector = sectors[key];
              const currentId = sector.cropId;
              const cfg = getCfg(key);
              const n = sectorNum(key);

              return (
                <View key={key} style={s.sectorBlock}>
                  {/* Cabeçalho do setor */}
                  <View style={s.sectorHeader}>
                    <View style={s.sectorLabelWrap}>
                      <View style={[s.dot, { backgroundColor: sector.color }]} />
                      <Text style={s.sectorLabel}>
                        {idx + 1}.{" "}
                        {currentId ? cropName(lang, currentId) : sector.crop || key}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onDeleteSector(key)}
                      disabled={count <= MIN_SECTORS}
                      style={[s.delBtn, count <= MIN_SECTORS && s.delBtnDisabled]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={count <= MIN_SECTORS ? theme.textFaint : theme.danger}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Seleção de cultura */}
                  <View style={s.cropRow}>
                    {CROPS.map((crop) => {
                      const on = crop.id === currentId;
                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            s.cropChip,
                            on && { borderColor: crop.color, backgroundColor: theme.bgCardAlt },
                          ]}
                          onPress={() => onChangeCrop(key, crop.id)}
                          activeOpacity={0.8}
                        >
                          <View style={[s.cropChipDot, { backgroundColor: crop.color }]} />
                          <Text
                            style={[s.cropChipTxt, on && { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {cropName(lang, crop.id)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* ── Configurações de setorização (só visível quando ativa) ── */}
                  {setorizacaoAtiva && (
                    <View style={s.sectorCfgWrap}>
                      <View style={s.sectorCfgDivider} />

                      {/* Toggle ativo/inativo do setor */}
                      <View style={s.sectorActiveRow}>
                        <View style={s.sectorActiveLeft}>
                          <View style={[
                            s.sectorActiveDot,
                            { backgroundColor: sector.is_active ? theme.primary : theme.textFaint },
                          ]} />
                          <Text style={s.sectorActiveLabel}>
                            {sector.is_active
                              ? t(lang, "sector_active")
                              : t(lang, "sector_inactive")}
                          </Text>
                        </View>
                        <Switch
                          value={!!sector.is_active}
                          onValueChange={(val) => {
                            onConfigSetor(n, key, {
                              ...cfg,
                              on: val,
                            });
                          }}
                          trackColor={{ false: theme.track, true: theme.primaryDark }}
                          thumbColor={sector.is_active ? theme.primary : theme.textMuted}
                        />
                      </View>

                      {/* Sliders — vel, luz, vazao */}
                      <SectorSlider
                        label={t(lang, "sector_vel")}
                        icon="⚡"
                        value={cfg.vel}
                        tintColor={theme.primary}
                        theme={theme}
                        onChange={(v) => updateCfg(key, "vel", Math.round(v))}
                        onComplete={(v) => {
                          const updated = { ...cfg, vel: v };
                          updateCfg(key, "vel", v);
                          onConfigSetor(n, key, { ...updated, on: !!sector.is_active });
                        }}
                      />
                      <SectorSlider
                        label={t(lang, "sector_luz")}
                        icon="☀️"
                        value={cfg.luz}
                        tintColor={theme.accentAmber}
                        theme={theme}
                        onChange={(v) => updateCfg(key, "luz", Math.round(v))}
                        onComplete={(v) => {
                          const updated = { ...cfg, luz: v };
                          updateCfg(key, "luz", v);
                          onConfigSetor(n, key, { ...updated, on: !!sector.is_active });
                        }}
                      />
                      <SectorSlider
                        label={t(lang, "sector_vazao")}
                        icon="💧"
                        value={cfg.vazao}
                        tintColor={theme.accentBlue}
                        theme={theme}
                        onChange={(v) => updateCfg(key, "vazao", Math.round(v))}
                        onComplete={(v) => {
                          const updated = { ...cfg, vazao: v };
                          updateCfg(key, "vazao", v);
                          onConfigSetor(n, key, { ...updated, on: !!sector.is_active });
                        }}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {/* ── Velocidade de trânsito (só quando setorização ativa) ── */}
            {setorizacaoAtiva && (
              <View style={s.transitCard}>
                <View style={s.transitHeader}>
                  <Ionicons name="speedometer-outline" size={18} color={theme.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.transitTitle}>{t(lang, "transit_speed")}</Text>
                    <Text style={s.transitDesc}>{t(lang, "transit_desc")}</Text>
                  </View>
                  <Text style={[s.transitValue, { color: theme.primary }]}>
                    {Math.round(localTransit)}%
                  </Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 36 }}
                  minimumValue={1}
                  maximumValue={100}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.track}
                  thumbTintColor={theme.primary}
                  value={localTransit}
                  onValueChange={setLocalTransit}
                  onSlidingComplete={(v) => onChangeTransitSpeed?.(Math.round(v))}
                />
              </View>
            )}

            {/* ── Adicionar setor ── */}
            <TouchableOpacity
              style={[s.addBtn, count >= MAX_SECTORS && s.addBtnDisabled]}
              onPress={onAddSector}
              disabled={count >= MAX_SECTORS}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={count >= MAX_SECTORS ? theme.textFaint : theme.primary}
              />
              <Text style={[s.addBtnTxt, count >= MAX_SECTORS && { color: theme.textFaint }]}>
                {t(lang, "add_sector")}
              </Text>
            </TouchableOpacity>

          </ScrollView>

          {/* ── Botão Concluir ── */}
          <TouchableOpacity style={s.doneBtn} onPress={onClose}>
            <Text style={s.doneBtnTxt}>{t(lang, "done")}</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    card: {
      backgroundColor: theme.bgCard,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      maxHeight: "92%",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    title: { fontSize: 20, fontWeight: "bold", color: theme.text },
    count: { fontSize: 13, color: theme.textMuted, fontWeight: "600" },

    // ── Setorização ──
    setorizacaoCard: {
      backgroundColor: theme.bgCardAlt,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    setorizacaoTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    setorizacaoLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    setorizacaoIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    setorizacaoTitle: { fontSize: 15, fontWeight: "bold", color: theme.text },
    setorizacaoDesc: { fontSize: 12, color: theme.textMuted, lineHeight: 17 },

    // ── Bloco de setor ──
    sectorBlock: {
      backgroundColor: theme.bgCardAlt,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectorLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    sectorLabel: { fontSize: 15, fontWeight: "bold", color: theme.text },
    delBtn: { padding: 6 },
    delBtnDisabled: { opacity: 0.4 },

    cropRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    cropChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.bgCard,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    cropChipDot: { width: 10, height: 10, borderRadius: 5 },
    cropChipTxt: { fontSize: 13, fontWeight: "600", color: theme.textMuted },

    // ── Configurações do setor (quando setorização ativa) ──
    sectorCfgWrap: { marginTop: 4 },
    sectorCfgDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    sectorActiveRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    sectorActiveLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectorActiveDot: { width: 10, height: 10, borderRadius: 5 },
    sectorActiveLabel: { fontSize: 14, fontWeight: "600", color: theme.text },

    // ── Velocidade de trânsito ──
    transitCard: {
      backgroundColor: theme.bgCardAlt,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    transitHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    transitTitle: { fontSize: 14, fontWeight: "bold", color: theme.text },
    transitDesc: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
    transitValue: { fontSize: 16, fontWeight: "bold", minWidth: 40, textAlign: "right" },

    // ── Adicionar setor ──
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderStyle: "dashed",
      marginBottom: 8,
      marginTop: 4,
    },
    addBtnDisabled: { borderColor: theme.border },
    addBtnTxt: { fontSize: 15, fontWeight: "600", color: theme.primary },

    // ── Concluir ──
    doneBtn: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 12,
    },
    doneBtnTxt: { fontSize: 15, fontWeight: "bold", color: "#06281A" },
  });

export default SectorManager;