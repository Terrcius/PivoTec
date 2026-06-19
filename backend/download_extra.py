"""
Baixa MAIS imagens de doencas da soja do iNaturalist, em modo
"research grade" (observacoes confirmadas pela comunidade), que traz
FOTOS DE CAMPO da doenca na folha -- e nao espicimes de herbario/
microscopia como o GBIF acabou trazendo.

Baixa para uma pasta de STAGING (nao mexe no treino), para conferir
antes de aproveitar:
  dataset_cls/_staging/<classe>/<classe>_inat_NNNN.jpg

Como rodar:
  cd backend
  python download_extra.py
"""

import os
import time

import requests

# Classe -> nome cientifico do patogeno (olho_de_ra fica de fora: curada)
CLASSES = {
    "ferrugem_asiatica": "Phakopsora pachyrhizi",
    "mancha_alvo": "Corynespora cassiicola",
    "oidio": "Erysiphe diffusa",
}

ALVO_POR_CLASSE = 60
BASE = os.path.join("dataset_cls", "_staging")
LICENCAS_OK = {"cc0", "cc-by", "cc-by-nc", "cc-by-sa", "cc-by-nc-sa"}


def baixar(classe, termo):
    destino = os.path.join(BASE, classe)
    os.makedirs(destino, exist_ok=True)

    r = requests.get(
        "https://api.inaturalist.org/v1/taxa", params={"q": termo}, timeout=15
    )
    results = r.json().get("results", [])
    if not results:
        print(f"[X] taxon nao encontrado: {termo} ({classe})")
        return 0
    taxon_id = results[0]["id"]
    print(f"[busca] {termo} ({classe}) -> taxon {taxon_id} (research grade)")

    baixadas = 0
    pagina = 1
    while baixadas < ALVO_POR_CLASSE:
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
                if baixadas >= ALVO_POR_CLASSE:
                    break
                if foto.get("license_code") not in LICENCAS_OK:
                    continue
                # 'large' tem mais detalhe da lesao que 'medium'
                url = foto["url"].replace("square", "large")
                try:
                    img = requests.get(url, timeout=15)
                    if "image" not in img.headers.get("Content-Type", ""):
                        continue
                    caminho = os.path.join(
                        destino, f"{classe}_inat_{baixadas:04d}.jpg"
                    )
                    with open(caminho, "wb") as f:
                        f.write(img.content)
                    baixadas += 1
                except Exception as e:
                    print(f"   erro: {e}")
                time.sleep(0.2)
        pagina += 1
        print(f"   {classe}: {baixadas}/{ALVO_POR_CLASSE}")

    print(f"[ok] {classe}: {baixadas} imagens em staging\n")
    return baixadas


if __name__ == "__main__":
    for classe, termo in CLASSES.items():
        baixar(classe, termo)
    print("[concluido] Staging em dataset_cls/_staging/ -> conferir antes de usar")
