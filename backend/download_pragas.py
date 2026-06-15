"""
Baixa imagens dos INSETOS-praga da soja do iNaturalist (sem chave/conta)
para a estrutura de CLASSIFICACAO: dataset_cls/train/<classe>/

As imagens nao precisam de anotacao: a classe e o nome da pasta.

Como rodar:
  cd backend
  python download_pragas.py
"""

import os
import time

import requests

# Especie (nome cientifico) -> classe (pasta)
ESPECIES = {
    "Anticarsia gemmatalis": "lagarta_soja",
    "Chrysodeixis includens": "falsa_medideira",  # ex-Pseudoplusia includens
    "Nezara viridula": "percevejo_verde",
    "Piezodorus guildinii": "percevejo_pequeno",
    "Euschistus heros": "percevejo_marrom",
    "Diabrotica speciosa": "diabrotica",
    "Sternechus subsignatus": "sternechus",
}

IMAGENS_POR_CLASSE = 80
BASE = os.path.join("dataset_cls", "train")
LICENCAS_OK = {"cc0", "cc-by", "cc-by-nc", "cc-by-sa", "cc-by-nc-sa"}


def baixar(nome_cientifico, classe):
    destino = os.path.join(BASE, classe)
    os.makedirs(destino, exist_ok=True)

    r = requests.get(
        "https://api.inaturalist.org/v1/taxa",
        params={"q": nome_cientifico, "rank": "species"},
        timeout=15,
    )
    results = r.json().get("results", [])
    if not results:
        print(f"[X] Nao encontrei: {nome_cientifico}")
        return
    taxon_id = results[0]["id"]
    print(f"[busca] {nome_cientifico} ({classe}) -> taxon {taxon_id}")

    baixadas = 0
    pagina = 1
    while baixadas < IMAGENS_POR_CLASSE:
        r = requests.get(
            "https://api.inaturalist.org/v1/observations",
            params={
                "taxon_id": taxon_id,
                "photos": "true",
                "quality_grade": "research",
                "per_page": 50,
                "page": pagina,
            },
            timeout=20,
        )
        obs = r.json().get("results", [])
        if not obs:
            break

        for o in obs:
            for foto in o.get("photos", []):
                if baixadas >= IMAGENS_POR_CLASSE:
                    break
                if foto.get("license_code") not in LICENCAS_OK:
                    continue
                url = foto["url"].replace("square", "medium")
                try:
                    img = requests.get(url, timeout=15)
                    caminho = os.path.join(destino, f"{classe}_{baixadas:04d}.jpg")
                    with open(caminho, "wb") as f:
                        f.write(img.content)
                    baixadas += 1
                except Exception as e:
                    print(f"   erro: {e}")
                time.sleep(0.2)

        pagina += 1
        print(f"   {classe}: {baixadas}/{IMAGENS_POR_CLASSE}")

    print(f"[ok] {classe}: {baixadas} imagens\n")


if __name__ == "__main__":
    for nome, classe in ESPECIES.items():
        baixar(nome, classe)
    print("[concluido] Insetos baixados em dataset_cls/train/")
