import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider"; // Assumindo este Slider

const MainControls = ({
  status,
  direction,
  power,
  uvLightStatus,
  waterFlow,
  uvIntensity,
  onToggleRotation,
  onToggleDirection,
  onChangePower,
  onToggleUVLight,
  onChangeFlow,
  onChangeUVIntensity,
  isConnected,
  onZeroPosition,
}) => {
  const isRotating = status === "Rodando";
  const isAntiClockwise = direction === "Anti-horário";
  const isUVLightOn = uvLightStatus === "Ligada";

  // Estado local para evitar que o slider "salte" durante o arrasto
  const [localPower, setLocalPower] = useState(power);
  const [localFlow, setLocalFlow] = useState(waterFlow);
  const [localUVIntensity, setLocalUVIntensity] = useState(uvIntensity);

  // Atualiza estados locais quando as props mudam de fora (Firebase)
  React.useEffect(() => {
    setLocalPower(power);
  }, [power]);

  React.useEffect(() => {
    setLocalFlow(waterFlow);
  }, [waterFlow]);

  React.useEffect(() => {
    setLocalUVIntensity(uvIntensity);
  }, [uvIntensity]);

  const getRotationButtonStyles = () => {
    if (!isConnected) {
      return styles.disabledButton;
    }
    return isRotating ? styles.stopButton : styles.startButton;
  };

  const getRotationButtonTextStyles = () => {
    return isRotating ? styles.stopButtonText : styles.startButtonText;
  };

  const getFlowSliderStyles = () => {
    return isConnected ? styles.slider : styles.sliderDisabled;
  };

  // O slider de intensidade UV agora só verifica a conexão, não o status da luz UV
  const getUVIntensitySliderStyles = () => {
    return isConnected ? styles.slider : styles.sliderDisabled;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Controle Principal</Text>

      {/* LINHA 1: Rotação e Direção */}
      <View style={styles.row}>
        {/* Botão de Ligar/Desligar Rotação */}
        <TouchableOpacity
          style={[styles.controlButton, getRotationButtonStyles()]}
          onPress={onToggleRotation}
          disabled={!isConnected}
        >
          <Ionicons
            name={isRotating ? "pause" : "play"}
            size={24}
            color={isRotating ? "#FFFFFF" : isConnected ? "#10B981" : "#A1A1AA"}
          />
          <Text style={getRotationButtonTextStyles()}>
            {isRotating ? "Parar Rotação" : "Iniciar Rotação"}
          </Text>
        </TouchableOpacity>

        {/* Botão de Direção */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            !isConnected && styles.disabledButton,
          ]}
          onPress={onToggleDirection}
          disabled={!isConnected}
        >
          <Feather
            name="refresh-cw"
            size={24}
            color={
              isAntiClockwise && isConnected
                ? "#3B82F6"
                : isConnected
                  ? "#374151"
                  : "#A1A1AA"
            }
          />
          <Text
            style={[
              styles.secondaryButtonText,
              isAntiClockwise && isConnected ? styles.activeText : null,
            ]}
          >
            {isAntiClockwise ? "Anti-horário" : "Horário"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LINHA 2: Luz UV e Posição Inicial */}
      <View style={styles.row}>
        {/* Botão de Luz UV */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            !isConnected && styles.disabledButton,
          ]}
          onPress={onToggleUVLight}
          disabled={!isConnected}
        >
          <MaterialCommunityIcons
            name={isUVLightOn ? "sun-wireless" : "weather-sunny-off"}
            size={24}
            color={
              isUVLightOn && isConnected
                ? "#F59E0B"
                : isConnected
                  ? "#374151"
                  : "#A1A1AA"
            }
          />
          <Text
            style={[
              styles.secondaryButtonText,
              isUVLightOn && isConnected ? styles.activeText : null,
            ]}
          >
            Luz UV {isUVLightOn ? "LIGADA" : "DESLIGADA"}
          </Text>
        </TouchableOpacity>

        {/* Botão de Definir Posição Inicial (Zerar) */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            (!isConnected || isRotating) && styles.disabledButton,
          ]}
          onPress={onZeroPosition}
          disabled={!isConnected || isRotating}
        >
          <MaterialCommunityIcons
            name="target"
            size={24}
            color={!isConnected || isRotating ? "#A1A1AA" : "#374151"}
          />
          <Text style={styles.secondaryButtonText}>
            Definir Posição Inicial
          </Text>
        </TouchableOpacity>
      </View>

      {/* ----------------------------------------------------- */}
      {/* CONTROLE: VAZÃO DA ÁGUA */}
      {/* ----------------------------------------------------- */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Vazão da Água: ({Math.round(localFlow)}%)
        </Text>
        <Slider
          style={getFlowSliderStyles()}
          minimumValue={0}
          maximumValue={100}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#A1A1AA"
          thumbTintColor="#3B82F6"
          value={localFlow}
          onValueChange={setLocalFlow} // Atualiza o estado local enquanto arrasta
          onSlidingComplete={onChangeFlow} // Envia o comando ao Firebase/WS no final do arrasto
          disabled={!isConnected}
        />
      </View>

      {/* ----------------------------------------------------- */}
      {/* CONTROLE: INTENSIDADE UV (AGORA SEM CONDIÇÃO DE LUZ LIGADA) */}
      {/* ----------------------------------------------------- */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Intensidade UV: ({Math.round(localUVIntensity)}%)
        </Text>
        <Slider
          style={getUVIntensitySliderStyles()}
          minimumValue={0}
          maximumValue={100}
          // Cor amarela consistente, só desabilita se estiver desconectado
          minimumTrackTintColor="#F59E0B"
          maximumTrackTintColor="#A1A1AA"
          thumbTintColor="#F59E0B"
          value={localUVIntensity}
          onValueChange={setLocalUVIntensity} // Atualiza o estado local enquanto arrasta
          onSlidingComplete={onChangeUVIntensity} // Envia o comando ao Firebase/WS no final do arrasto
          disabled={!isConnected} // Desabilita APENAS se desconectado
        />
      </View>

      {/* CONTROLE EXISTENTE: POTÊNCIA DA ROTAÇÃO */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Potência da Rotação: ({Math.round(localPower)}%)
        </Text>
        <Slider
          style={isConnected ? styles.slider : styles.sliderDisabled}
          minimumValue={0}
          maximumValue={100}
          minimumTrackTintColor="#EF4444"
          maximumTrackTintColor="#A1A1AA"
          thumbTintColor="#EF4444"
          value={localPower}
          onValueChange={setLocalPower}
          onSlidingComplete={onChangePower}
          disabled={!isConnected}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  controlButton: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  // Estilos do Botão de Iniciar Rotação
  startButton: {
    backgroundColor: "#D1FAE5", // Verde claro
    borderWidth: 1,
    borderColor: "#10B981",
  },
  startButtonText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  // Estilos do Botão de Parar Rotação
  stopButton: {
    backgroundColor: "#EF4444", // Vermelho
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  // Estilos dos Botões Secundários
  secondaryButton: {
    backgroundColor: "#E5E7EB", // Cinza claro
    borderWidth: 0,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  activeText: {
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#F3F4F6", // Cinza mais claro para desabilitado
    opacity: 0.6,
  },
  // Estilos do Slider
  sliderContainer: {
    marginTop: 15,
    paddingHorizontal: 5,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#4B5563",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderDisabled: {
    width: "100%",
    height: 40,
    opacity: 0.4,
  },
  disabledOverlayText: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    marginTop: -5,
  },
});

export default MainControls;
