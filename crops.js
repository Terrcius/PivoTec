import { t } from "./i18n";

// Catálogo de culturas disponíveis para os setores do pivô.
// Cada cultura tem um id estável (usado no armazenamento) e uma cor.
// O nome exibido é resolvido por idioma via i18n (chave "crop_<id>").
export const CROPS = [
  { id: "cafe", color: "#B45309", icon: "cafe" },
  { id: "soja", color: "#34D399", icon: "leaf" },
  { id: "milho", color: "#FBBF24", icon: "nutrition" },
  { id: "morango", color: "#FB7185", icon: "rose" },
];

export const MIN_SECTORS = 1;
export const MAX_SECTORS = 4;

export const cropById = (id) => CROPS.find((c) => c.id === id) || CROPS[0];

export const cropName = (lang, id) => t(lang, `crop_${id}`);
