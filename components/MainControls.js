// components/MainControls.js

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";

const MainControls = ({
  status,
  direction,
  power,
  onToggleRotation,
  onToggleDirection,
  onChangePower,
  isConnected,
  onZeroPosition,
}) => {
  const [displayPower, setDisplayPower] = useState(power);

  useEffect(() => {
    setDisplayPower(power);
  }, [power]);

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

      {/* CÓDIGO DOS BOTÕES REINSERIDO AQUI */}
      <View style={styles.buttonRow}>
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

      <View style={styles.sliderContainer}>
        <Text
          style={[styles.sliderLabel, !isAdjustable && styles.disabledText]}
        >
          Potência da Rotação: ({Math.round(displayPower)}%)
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={displayPower}
          onValueChange={(value) => setDisplayPower(value)}
          onSlidingComplete={() => onChangePower(displayPower)}
          minimumTrackTintColor={isAdjustable ? "#22C55E" : "#D1D5DB"}
          maximumTrackTintColor="#D1D5DB"
          disabled={!isAdjustable}
        />
      </View>

      <TouchableOpacity
        onPress={onZeroPosition}
        style={[
          styles.zeroButton,
          !isAdjustable && styles.disabledButton, // Mude de !isRotationButtonEnabled para !isAdjustable
        ]}
        disabled={!isAdjustable} // Mude de !isRotationButtonEnabled para !isAdjustable
      >
        <Text style={styles.buttonText}>Zerar Posição</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  slider: {
    width: "100%",
    height: 60,
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  zeroButton: {
    backgroundColor: "#60A5FA",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
});

export default MainControls;
