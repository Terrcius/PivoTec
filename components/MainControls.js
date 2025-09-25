// components/MainControls.js

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
}) => {
  const isControllable = status === "Parado";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controle Principal</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onToggleRotation}
          style={[
            styles.controlButton,
            status === "Rodando" ? styles.stopButton : styles.startButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {status === "Rodando" ? "Parar Rotação" : "Iniciar Rotação"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleDirection}
          style={[
            styles.controlButton,
            styles.directionButton,
            !isControllable && styles.disabledButton,
          ]}
          disabled={!isControllable}
        >
          <Text
            style={[styles.buttonText, !isControllable && styles.disabledText]}
          >
            {direction}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sliderContainer}>
        <Text
          style={[styles.sliderLabel, !isControllable && styles.disabledText]}
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
          minimumTrackTintColor="#22C55E"
          maximumTrackTintColor="#D1D5DB"
          disabled={!isControllable}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text
          style={[styles.sliderLabel, !isControllable && styles.disabledText]}
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
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#D1D5DB"
          disabled={!isControllable}
        />
      </View>
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
    backgroundColor: "#E5E7EB",
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
    opacity: 0.5,
  },
  disabledText: {
    color: "#9CA3AF",
  },
});

export default MainControls;
