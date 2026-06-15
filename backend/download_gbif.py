"""
Baixa imagens de doencas da soja do GBIF (gbif.org), que agrega varias
bases de ocorrencias e costuma ter MAIS fotos de patogenos de lavoura
que o iNaturalist.

Usado para as doencas que vieram fracas do iNaturalist (ferrugem, olho-de-ra).
Salva na mesma estrutura de classificacao: dataset_cls/train/<classe>/

Como rodar:
  cd backend
  python download_gbif.py
"""

import os
import time

import requests

# Classe (pasta) -> nome cientifico do patogeno
# Obs.: olho_de_ra fica de fora porque foi curado manualmente (nao
# reabastecer automatico para nao re-poluir). Reative se precisar.
CLASSES = {
    "ferrugem_asiatica": "Phakopsora pachyrhizi",
    # "olho_de_ra": "Cercospora sojina",
}

IMAGENS_POR_CLASSE = 120
BASE = os.path.join("dataset_cls", "train")


def baixar(classe, nome_cientifico):
    destino = os.path.join(BASE, classe)
    os.makedirs(destino, exist_ok=True)

    # ja existentes (do iNaturalist) para nao sobrescrever e continuar a contagem
    existentes = len(
        [f for f in os.listdir(destino) if f.lower().endswith(".jpg")]
    )

    m = requests.get(
        "https://api.gbif.org/v1/species/match",
        params={"name": nome_cientifico},
        timeout=20,
    ).json()
    key = m.get("usageKey")
    if not key:
        print(f"[X] GBIF nao encontrou: {nome_cientifico}")
        return
    print(f"[busca] {nome_cientifico} ({classe}) -> usageKey {key}")

    baixadas = 0
    offset = 0
    while baixadas < IMAGENS_POR_CLASSE:
        results = requests.get(
            "https://api.gbif.org/v1/occurrence/search",
            params={
                "taxonKey": key,
                "mediaType": "StillImage",
                "limit": 100,
                "offset": offset,
            },
            timeout=30,
        ).json()
        ocorrencias = results.get("results", [])
        if not ocorrencias:
            break

        for o in ocorrencias:
            for media in o.get("media", []):
                if baixadas >= IMAGENS_POR_CLASSE:
                    break
                url = media.get("identifier")
                if not url:
                    continue
                try:
                    img = requests.get(url, timeout=20)
                    if "image" not in img.headers.get("Content-Type", ""):
                        continue
                    idx = existentes + baixadas
                    caminho = os.path.join(
                        destino, f"{classe}_gbif_{idx:04d}.jpg"
                    )
                    with open(caminho, "wb") as f:
                        f.write(img.content)
                    baixadas += 1
                except Exception as e:
                    print(f"   erro: {e}")
                time.sleep(0.15)

        if results.get("endOfRecords"):
            break
        offset += 100
        print(f"   {classe}: +{baixadas} novas (GBIF)")

    total = len(
        [f for f in os.listdir(destino) if f.lower().endswith(".jpg")]
    )
    print(f"[ok] {classe}: +{baixadas} do GBIF | total agora {total}\n")


if __name__ == "__main__":
    for classe, nome in CLASSES.items():
        baixar(classe, nome)
    print("[concluido] Imagens GBIF baixadas em dataset_cls/train/")
