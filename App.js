import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import StatusCard from "./components/StatusCard";
import MetricCard from "./components/MetricCard";

const firebaseConfig = {
  apiKey: "AIzaSyBNSYLDTpeuJ8YyT9RQoHlwzhHRUI-0GtU",
  authDomain: "pivo-esp32.firebaseapp.com",
  databaseURL: "https://pivo-esp32-default-rtdb.firebaseio.com",
  projectId: "pivo-esp32",
  storageBucket: "pivo-esp32.firebasestorage.app",
  messagingSenderId: "813559485244",
  appId: "1:813559485244:web:0dd9d3bd6dfd85bcb30439",
  measurementId: "G-ZQLYFJW87D",
};

// Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// Conecta ao serviço de Realtime Database do app inicializado
const database = getDatabase(app);

// Cria a referência para o nó do seu pivô
const pivotRef = ref(database, "pivots/pivot_001");

// --- FIM DO TRECHO CORRIGIDO ---

const App = () => {
  const [pivotData, setPivotData] = useState(null);

  useEffect(() => {
    // Agora, 'onValue' vai funcionar corretamente com a 'pivotRef'
    const onDataChange = onValue(pivotRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Dados recebidos do Firebase:", data);
        setPivotData(data);
      } else {
        console.log("Nenhum dado encontrado no caminho especificado.");
        setPivotData(null);
      }
    });

    return () => onValue(pivotRef, onDataChange);
  }, []);

  if (!pivotData) {
    return (
      <View style={styles.container}>
        <Text>Carregando dados do pivô...</Text>
      </View>
    );
  }

  return (
    // <View> principal que envolve todos os outros componentes
    <View style={styles.container}>
      {/* Bloco de Informações Gerais */}
      <View style={styles.card}>
        <Text style={styles.title}>Monitoramento do Pivô</Text>
        <Text>Status: {pivotData.status.rotation_status}</Text>
        <Text>Direção: {pivotData.status.direction}</Text>
        <Text>Temperatura: {pivotData.sensors.temperature}°C</Text>
        <Text>Umidade do Solo: {pivotData.sensors.soil_humidity}%</Text>
        <Text>Umidade do Ar: {pivotData.sensors.air_humidity}%</Text>
      </View>

      {/* Bloco de Status dos Setores */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status dos Setores</Text>
        {/* Itera sobre os setores para criar um StatusCard para cada um */}
        {Object.keys(pivotData.sectors).map((key) => {
          const sector = pivotData.sectors[key];
          return (
            <StatusCard
              key={key}
              label={`${sector.crop}`}
              value={`${sector.moisture}%`}
              status={sector.is_active}
              color={sector.color}
              // A função de toggle, que você irá implementar no próximo passo
              onToggle={() => console.log("Toggle do setor " + key)}
            />
          );
        })}
      </View>

      {/* Bloco de Métricas (adicione aqui o código do MetricCard) */}
      <View style={styles.metricsContainer}>
        <MetricCard
          value={`${pivotData.sensors.temperature}°C`}
          label="Temperatura"
          onClick={() => console.log("Navegar para detalhes de Temperatura")}
        />
        <MetricCard
          value={`${pivotData.sensors.soil_humidity}%`}
          label="Umidade do Solo"
          onClick={() =>
            console.log("Navegar para detalhes de Umidade do Solo")
          }
        />
        <MetricCard
          value={`${pivotData.sensors.air_humidity}%`}
          label="Umidade do Ar"
          onClick={() => console.log("Navegar para detalhes de Umidade do Ar")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
});

export default App;
