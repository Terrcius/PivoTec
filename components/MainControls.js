import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";

const MainControls = ({
  status,
  direction,
  power,
  waterFlow,
  onToggleRotation,
  onToggleDirection,
  onChangePower,
  onChangeWaterFlow,
  isConnected,
  onZeroPosition,
}) => {
  const isAdjustable = status === "Parado" && isConnected;
  const isRotationButtonEnabled = isConnected;

  const getRotationButtonStyle = () => {
    if (!isRotationButtonEnabled) {
      return styles.disabledButton;
    }
    return status === "Rodando" ? styles.stopButton : styles.startButton;
  };

  const getDirectionButtonStyle = () => {
    if (!isAdjustable) {
      return styles.disabledButton;
    }
    return styles.directionButton;
  };

  const getDirectionTextColor = () => {
    if (!isAdjustable) {
      return styles.disabledDirectionText;
    }
    return styles.directionText;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controle Principal</Text>

      <View style={styles.buttonRow}>
        {/* ... (Botões de Rotação e Direção continuam aqui) ... */}
        <TouchableOpacity
          onPress={onToggleRotation}
          style={[styles.controlButton, getRotationButtonStyle()]}
          disabled={!isRotationButtonEnabled}
        >
          <Text style={styles.buttonText}>
            {status === "Rodando" ? "Parar Rotação" : "Iniciar Rotação"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleDirection}
          style={[styles.controlButton, getDirectionButtonStyle()]}
          disabled={!isAdjustable}
        >
          <Text style={[styles.buttonText, getDirectionTextColor()]}>
            {direction}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ... (Sliders de Potência e Vazão continuam aqui) ... */}
      <View style={styles.sliderContainer}>
        <Text
          style={[styles.sliderLabel, !isAdjustable && styles.disabledText]}
        >
          Potência da Rotação: ({power}%)
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={power}
          onSlidingComplete={onChangePower}
          minimumTrackTintColor={isAdjustable ? "#22C55E" : "#D1D5DB"}
          maximumTrackTintColor="#D1D5DB"
          disabled={!isAdjustable}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text
          style={[styles.sliderLabel, !isAdjustable && styles.disabledText]}
        >
          Vazão da Água: ({waterFlow}%)
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={waterFlow}
          onSlidingComplete={onChangeWaterFlow}
          minimumTrackTintColor={isAdjustable ? "#3B82F6" : "#D1D5DB"}
          maximumTrackTintColor="#D1D5DB"
          disabled={!isAdjustable}
        />
      </View>

      {/* 2. NOVO BOTÃO PARA ZERAR A POSIÇÃO */}
      <TouchableOpacity
        onPress={onZeroPosition}
        style={[
          styles.zeroButton,
          !isRotationButtonEnabled && styles.disabledButton, // Reutiliza a lógica de desabilitar
        ]}
        disabled={!isRotationButtonEnabled}
      >
        <Text style={styles.buttonText}>Zerar Posição</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (todos os seus estilos anteriores)
  container: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  controlButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: "#22C55E",
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  directionButton: {
    backgroundColor: "#E0F2FE",
  },
  directionText: {
    color: "#374151",
  },
  disabledDirectionText: {
    color: "#9CA3AF",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  sliderContainer: {
    marginBottom: 15,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  disabledText: {
    color: "#9CA3AF",
  },

  // 3. ESTILO PARA O NOVO BOTÃO
  zeroButton: {
    backgroundColor: "#60A5FA", // Um tom de azul
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5, // Espaçamento para separar dos sliders
  },
});

export default MainControls;
