import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../i18n";
import { CROPS, cropName, MIN_SECTORS, MAX_SECTORS } from "../crops";

const SectorManager = ({
  visible,
  onClose,
  sectors = {},
  onAddSector,
  onChangeCrop,
  onDeleteSector,
  theme,
  lang,
}) => {
  const s = styles(theme);
  const keys = Object.keys(sectors).sort();
  const count = keys.length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.headerRow}>
            <Text style={s.title}>{t(lang, "manage_sectors")}</Text>
            <Text style={s.count}>
              {count}/{MAX_SECTORS} {t(lang, "sectors_count")}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {keys.map((key, idx) => {
              const sector = sectors[key];
              const currentId = sector.cropId;
              return (
                <View key={key} style={s.sectorBlock}>
                  <View style={s.sectorHeader}>
                    <View style={s.sectorLabelWrap}>
                      <View
                        style={[s.dot, { backgroundColor: sector.color }]}
                      />
                      <Text style={s.sectorLabel}>
                        {idx + 1}.{" "}
                        {currentId
                          ? cropName(lang, currentId)
                          : sector.crop || key}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onDeleteSector(key)}
                      disabled={count <= MIN_SECTORS}
                      style={[
                        s.delBtn,
                        count <= MIN_SECTORS && s.delBtnDisabled,
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={
                          count <= MIN_SECTORS ? theme.textFaint : theme.danger
                        }
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
                            on && {
                              borderColor: crop.color,
                              backgroundColor: theme.bgCardAlt,
                            },
                          ]}
                          onPress={() => onChangeCrop(key, crop.id)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              s.cropChipDot,
                              { backgroundColor: crop.color },
                            ]}
                          />
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
                </View>
              );
            })}

            {/* Adicionar setor */}
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
              <Text
                style={[
                  s.addBtnTxt,
                  count >= MAX_SECTORS && { color: theme.textFaint },
                ]}
              >
                {t(lang, "add_sector")}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={s.doneBtn} onPress={onClose}>
            <Text style={s.doneBtnTxt}>{t(lang, "done")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
      maxHeight: "85%",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    title: { fontSize: 20, fontWeight: "bold", color: theme.text },
    count: { fontSize: 13, color: theme.textMuted, fontWeight: "600" },

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
