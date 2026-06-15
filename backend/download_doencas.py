"""
Baixa imagens de DOENCAS/FUNGOS da soja + folha saudavel, do iNaturalist,
direto na estrutura de CLASSIFICACAO (uma pasta por classe).

Saida: dataset_cls/train/<classe>/<classe>_NNNN.jpg

Como rodar:
  cd backend
  python download_doencas.py

Obs.: doencas fungicas tem MENOS observacoes que insetos no iNaturalist,
entao algumas classes podem vir com poucas imagens (o script avisa quantas
conseguiu). Por isso aqui NAO exigimos 'research grade' (mais permissivo
para juntar mais fotos).
"""

import os
import time

import requests

# Classe (pasta) -> termo de busca (nome cientifico do patogeno/planta)
CLASSES = {
    "ferrugem_asiatica": "Phakopsora pachyrhizi",   # ferrugem asiatica
    "mancha_alvo": "Corynespora cassiicola",        # mancha-alvo
    "olho_de_ra": "Cercospora sojina",              # mancha olho-de-ra
    "oidio": "Erysiphe diffusa",                     # oidio (powdery mildew)
    "folha_saudavel": "Glycine max",                # soja sadia (baseline)
}

IMAGENS_POR_CLASSE = 80
BASE = os.path.join("dataset_cls", "train")
LICENCAS_OK = {"cc0", "cc-by", "cc-by-nc", "cc-by-sa", "cc-by-nc-sa"}


def baixar(classe, termo):
    destino = os.path.join(BASE, classe)
    os.makedirs(destino, exist_ok=True)

    r = requests.get(
        "https://api.inaturalist.org/v1/taxa",
        params={"q": termo},
        timeout=15,
    )
    results = r.json().get("results", [])
    if not results:
        print(f"[X] Nao encontrei taxon: {termo} ({classe})")
        return
    taxon_id = results[0]["id"]
    print(f"[busca] {termo} ({classe}) -> taxon {taxon_id}")

    baixadas = 0
    pagina = 1
    while baixadas < IMAGENS_POR_CLASSE:
        r = requests.get(
            "https://api.inaturalist.org/v1/observations",
            params={
                "taxon_id": taxon_id,
                "photos": "true",
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
                    caminho = os.path.join(
                        destino, f"{classe}_{baixadas:04d}.jpg"
                    )
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
    for classe, termo in CLASSES.items():
        baixar(classe, termo)
    print("[concluido] Doencas + folha saudavel baixadas em dataset_cls/train/")
