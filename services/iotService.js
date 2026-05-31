import { PubSub } from "@aws-amplify/pubsub";
import { AWS_REGION, IOT_ENDPOINT } from "./awsConfig";

const pubsub = new PubSub({
  region: AWS_REGION,
  endpoint: `wss://${IOT_ENDPOINT}/mqtt`,
});

export const getTopics = (pivotId) => ({
  TELEMETRY: `pivot/${pivotId}/telemetry`,
  STATUS: `pivot/${pivotId}/status`,
  CONTROL: `pivot/${pivotId}/command`,
});

// Extrai o pivotId do tópico MQTT
// Ex: "pivot/pivot_0A46634C/telemetry" → "pivot_0A46634C"
const extractPivotIdFromTopic = (msg) => {
  try {
    const symbols = Object.getOwnPropertySymbols(msg);
    const topicSymbol = symbols.find((s) => s.toString() === "Symbol(topic)");
    if (!topicSymbol) return null;
    const topic = msg[topicSymbol];
    const parts = topic.split("/");
    return parts[1] || null; // "pivot_0A46634C"
  } catch {
    return null;
  }
};

export const iotService = {
  discover: (onDiscover, onError) => {
    console.log("[IoT] 🔍 Procurando pivôs em pivot/#...");
    try {
      const sub = pubsub.subscribe({ topics: ["pivot/#"] }).subscribe({
        next: (eventData) => {
          const msg = eventData.value ?? eventData;

          // Tenta pegar o ID do campo id (se existir)
          let pivotId = msg.id || null;

          // Se não tiver, extrai do tópico MQTT
          if (!pivotId) {
            pivotId = extractPivotIdFromTopic(msg);
          }

          if (pivotId) {
            console.log("[IoT] 🎯 Pivô encontrado:", pivotId);
            onDiscover({ ...msg, id: pivotId });
          }
        },
        error: (err) => {
          console.warn("[IoT] ⚠️ Discovery encerrado:", err?.message || err);
          onError?.(err);
        },
      });
      return sub;
    } catch (err) {
      console.error("[IoT] ❌ Falha crítica na descoberta:", err);
      onError?.(err);
    }
  },

  subscribe: (pivotId, onMessage, onError) => {
    const topics = getTopics(pivotId);
    console.log(`[IoT] 🔄 Inscrevendo nos tópicos de ${pivotId}...`);
    try {
      const sub = pubsub
        .subscribe({ topics: [topics.TELEMETRY, topics.STATUS] })
        .subscribe({
          next: (eventData) => {
            const msg = eventData.value ?? eventData;
            console.log("[IoT] 📨 Mensagem recebida:", msg);
            onMessage(msg);
          },
          error: (err) => {
            console.error("[IoT] ❌ Erro na escuta MQTT:", err);
            onError?.(err);
          },
          complete: () => console.log("[IoT] Conexão encerrada."),
        });
      return sub;
    } catch (err) {
      console.error("[IoT] ❌ Falha crítica:", err);
      onError?.(err);
    }
  },

  sendCommand: async (pivotId, message) => {
    const topics = getTopics(pivotId);
    try {
      await pubsub.publish({
        topics: [topics.CONTROL],
        message: message,
      });
      console.log(`[IoT] ✅ Comando enviado para ${pivotId}:`, message);
    } catch (err) {
      console.error("[IoT] ❌ Erro ao enviar comando:", err);
    }
  },
};
