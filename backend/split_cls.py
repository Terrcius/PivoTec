"""
Separa o dataset de CLASSIFICACAO em treino/validacao.

Para cada pasta de classe em dataset_cls/train/<classe>/, move ~20% das
imagens para dataset_cls/val/<classe>/.

Rode DEPOIS de baixar/organizar as imagens e ANTES de python train.py:
  cd backend
  python split_cls.py

Pode rodar de novo sem problema: ele so move o que ainda esta em train.
"""

import os
import random
import shutil

VAL_FRACAO = 0.2
SEED = 42

TRAIN = os.path.join("dataset_cls", "train")
VAL = os.path.join("dataset_cls", "val")


def main():
    if not os.path.isdir(TRAIN):
        print(f"[X] Nao encontrei {TRAIN}. Baixe as imagens primeiro.")
        return

    random.seed(SEED)
    total_train = total_val = 0

    for classe in sorted(os.listdir(TRAIN)):
        pasta_train = os.path.join(TRAIN, classe)
        if not os.path.isdir(pasta_train):
            continue
        pasta_val = os.path.join(VAL, classe)

        # Se a classe ja tem validacao, nao mexe (seguro para rodar de novo
        # depois de adicionar so classes novas).
        if os.path.isdir(pasta_val) and any(
            f.lower().endswith((".jpg", ".jpeg", ".png"))
            for f in os.listdir(pasta_val)
        ):
            n = len(os.listdir(pasta_val))
            print(f"{classe}: ja dividida (val={n}), pulando")
            continue

        os.makedirs(pasta_val, exist_ok=True)

        imgs = [
            f
            for f in os.listdir(pasta_train)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
        random.shuffle(imgs)
        n_val = max(1, round(len(imgs) * VAL_FRACAO)) if imgs else 0

        for f in imgs[:n_val]:
            shutil.move(
                os.path.join(pasta_train, f), os.path.join(pasta_val, f)
            )

        restante = len(imgs) - n_val
        total_train += restante
        total_val += n_val
        print(f"{classe}: treino {restante} | val {n_val}")

    print(f"\n[ok] Total -> treino {total_train} | val {total_val}")
    print("     Pronto para: python train.py")


if __name__ == "__main__":
    main()
