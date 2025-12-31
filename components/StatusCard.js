// components/StatusCard.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

const StatusCard = ({
  color,
  label,
  value,
  status,
  onToggle,
  isAdjustable,
  sectorKey,
  crop,
  useMainControls,
  customFlow,
  customUVIntensity,
  customSpeed, // NOVA PROP: velocidade personalizada
  onUpdateSector,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCrop, setLocalCrop] = useState(crop);
  const [localUseMainControls, setLocalUseMainControls] =
    useState(useMainControls);
  const [localCustomFlow, setLocalCustomFlow] = useState(customFlow);
  const [localCustomUVIntensity, setLocalCustomUVIntensity] =
    useState(customUVIntensity);
  const [localCustomSpeed, setLocalCustomSpeed] = useState(customSpeed || 50); // NOVO: estado para velocidade

  const handleSave = () => {
    onUpdateSector({
      crop: localCrop,
      use_main_controls: localUseMainControls,
      custom_flow: localCustomFlow,
      custom_uv_intensity: localCustomUVIntensity,
      custom_speed: localCustomSpeed, // NOVO: salvar velocidade
    });
    setIsExpanded(false);
  };

  const isToggleAdjustable = isAdjustable && !isExpanded;

  return (
    <View style={[styles.mainWrapper, !isAdjustable && styles.disabledCard]}>
      <TouchableOpacity
        onPress={() => isAdjustable && setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            borderBottomLeftRadius: isExpanded ? 0 : 12,
            borderBottomRightRadius: isExpanded ? 0 : 12,
          },
        ]}
        disabled={!isAdjustable}
      >
        <View style={styles.labelContainer}>
          <View
            style={[styles.statusCircle, { backgroundColor: color }]}
          ></View>
          <Text style={styles.labelText}>{label}</Text>
        </View>

        <View style={styles.controlContainer}>
          <Text style={styles.valueText}>{value}</Text>

          <TouchableOpacity
            onPress={onToggle}
            style={[
              styles.toggleButton,
              { backgroundColor: status ? "#22C55E" : "#9CA3AF" },
            ]}
            activeOpacity={0.7}
            disabled={!isToggleAdjustable}
          >
            <View
              style={[
                styles.toggleBall,
                status ? styles.toggleOn : styles.toggleOff,
              ]}
            ></View>
          </TouchableOpacity>

          {isAdjustable && (
            <Feather
              name={isExpanded ? "chevron-up" : "settings"}
              size={20}
              color="#6B7280"
            />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.sectionTitle}>Configuração de Setor</Text>

          {/* Input: Tipo de Cultura */}
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Cultura:</Text>
            <TextInput
              style={styles.input}
              value={localCrop}
              onChangeText={setLocalCrop}
              placeholder="Ex: Milho, Soja, Pastagem"
            />
          </View>

          {/* Switch: Usar Controles Principais */}
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Usar Controles Principais:</Text>
            <Switch
              value={localUseMainControls}
              onValueChange={setLocalUseMainControls}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={localUseMainControls ? "#3B82F6" : "#f4f3f4"}
            />
          </View>

          {/* Controles Customizados (Aparecem se não usar o principal) */}
          {!localUseMainControls && (
            <View style={styles.customControls}>
              <Text style={styles.customControlTitle}>
                Valores Customizados:
              </Text>

              {/* NOVO: Slider: Velocidade Customizada */}
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>
                  ⚡ Velocidade ({localCustomSpeed}%):
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={localCustomSpeed}
                  onValueChange={setLocalCustomSpeed}
                  minimumTrackTintColor="#10B981" // Verde para velocidade
                  maximumTrackTintColor="#D1D5DB"
                />
              </View>

              {/* Slider: Fluxo Customizado */}
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>
                  💧 Vazão ({localCustomFlow}%):
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={localCustomFlow}
                  onValueChange={setLocalCustomFlow}
                  minimumTrackTintColor="#3B82F6" // Azul para água
                  maximumTrackTintColor="#D1D5DB"
                />
              </View>

              {/* Slider: Intensidade UV Customizada */}
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>
                  🔦 UV ({localCustomUVIntensity}%):
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={localCustomUVIntensity}
                  onValueChange={setLocalCustomUVIntensity}
                  minimumTrackTintColor="#8B5CF6" // Roxo para UV
                  maximumTrackTintColor="#D1D5DB"
                />
              </View>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => onRemove(sectorKey)}
              style={styles.removeButton}
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
              <Text style={styles.removeButtonText}>Remover Setor</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Salvar Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.5,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  labelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  controlContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleBall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  toggleOn: {
    alignSelf: "flex-end",
  },
  toggleOff: {
    alignSelf: "flex-start",
  },
  expandedContent: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 10,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginLeft: 10,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  customControls: {
    marginTop: 5,
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  customControlTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 8,
  },
  sliderRow: {
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 5,
  },
  slider: {
    height: 40,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  removeButtonText: {
    color: "#EF4444",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default StatusCard;
