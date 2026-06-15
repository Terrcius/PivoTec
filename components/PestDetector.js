import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { t } from "../i18n";

// ── IP do PC que roda o servidor (backend/main.py) ──────────────
// Troque pelo Endereço IPv4 do seu PC (veja com "ipconfig").
// PC e celular precisam estar no MESMO Wi-Fi.
// localhost NÃO funciona aqui: o celular não enxerga o localhost do PC.
const API_URL = "http://192.168.0.9:8000/detectar";

const PestDetector = ({ theme, lang }) => {
  const s = styles(theme);
  const [foto, setFoto] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Deixa o nome da classe mais legível: "ferrugem_asiatica" -> "Ferrugem Asiatica"
  const formatar = (nome) =>
    nome.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Tira foto com a câmera (ou troque por launchImageLibraryAsync p/ galeria)
  const tirarFoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t(lang, "pest_no_camera"));
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!r.canceled) {
      setFoto(r.assets[0].uri);
      setResultado(null);
    }
  };

  // Escolhe uma imagem já existente na galeria do celular
  const escolherDaGaleria = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t(lang, "pest_no_gallery"));
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled) {
      setFoto(r.assets[0].uri);
      setResultado(null);
    }
  };

  // Envia a foto pro servidor e recebe as pragas detectadas
  const detectar = async () => {
    if (!foto) return;
    setCarregando(true);
    setResultado(null);
    try {
      const form = new FormData();
      form.append("foto", {
        uri: foto,
        name: "praga.jpg",
        type: "image/jpeg",
      });

      const resp = await fetch(API_URL, { method: "POST", body: form });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      setResultado(data);
    } catch (e) {
      Alert.alert(t(lang, "pest_error"), String(e.message));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>{t(lang, "pest_title")}</Text>

      {/* Pré-visualização da foto */}
      <View style={s.preview}>
        {foto ? (
          <Image source={{ uri: foto }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.placeholder}>
            <Ionicons name="bug-outline" size={48} color={theme.textFaint} />
            <Text style={s.placeholderTxt}>{t(lang, "pest_hint")}</Text>
          </View>
        )}
      </View>

      {/* Ações */}
      <View style={s.pickRow}>
        <TouchableOpacity
          style={[s.btnOutline, s.pickBtn]}
          onPress={tirarFoto}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={20} color={theme.primary} />
          <Text style={s.btnOutlineTxt}>{t(lang, "pest_take_photo")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnOutline, s.pickBtn]}
          onPress={escolherDaGaleria}
          activeOpacity={0.8}
        >
          <Ionicons name="images-outline" size={20} color={theme.primary} />
          <Text style={s.btnOutlineTxt}>{t(lang, "pest_pick_gallery")}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[s.btnPrimary, (!foto || carregando) && s.btnDisabled]}
        onPress={detectar}
        disabled={!foto || carregando}
        activeOpacity={0.8}
      >
        {carregando ? (
          <ActivityIndicator color="#06281A" />
        ) : (
          <>
            <Ionicons name="search" size={20} color="#06281A" />
            <Text style={s.btnPrimaryTxt}>{t(lang, "pest_detect")}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Resultado */}
      {resultado && (
        <View style={s.results}>
          {/* Classe principal em destaque */}
          <View style={s.mainResult}>
            <Text style={s.mainLabel}>{t(lang, "pest_result")}</Text>
            <Text style={s.mainName}>{formatar(resultado.classe)}</Text>
            <Text style={s.mainConf}>
              {Math.round(resultado.confianca * 100)}%
            </Text>
          </View>

          {/* Top 3 alternativas com barra de confiança */}
          {resultado.top?.map((d, i) => (
            <View key={i} style={s.resultRow}>
              <Text style={s.resultName}>{formatar(d.classe)}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${d.confianca * 100}%` }]} />
              </View>
              <Text style={s.resultConf}>{Math.round(d.confianca * 100)}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = (theme) =>
  StyleSheet.create({
    container: { padding: 20, gap: 14 },
    title: { fontSize: 20, fontWeight: "bold", color: theme.text },
    preview: {
      height: 240,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    image: { width: "100%", height: "100%" },
    placeholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    placeholderTxt: { color: theme.textFaint, fontSize: 13 },
    pickRow: { flexDirection: "row", gap: 10 },
    pickBtn: { flex: 1 },
    btnOutline: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderStyle: "dashed",
    },
    btnOutlineTxt: { color: theme.primary, fontSize: 15, fontWeight: "600" },
    btnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.primary,
    },
    btnPrimaryTxt: { color: "#06281A", fontSize: 15, fontWeight: "bold" },
    btnDisabled: { opacity: 0.5 },
    results: {
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    mainResult: {
      alignItems: "center",
      paddingBottom: 12,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    mainLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    mainName: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 4,
    },
    mainConf: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primary,
      marginTop: 2,
    },
    resultRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    resultName: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
      width: 120,
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.track,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    resultConf: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textMuted,
      width: 42,
      textAlign: "right",
    },
  });

export default PestDetector;
