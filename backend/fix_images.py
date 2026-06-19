"""
Conserta imagens problematicas do dataset de classificacao:
- as que o OpenCV nao consegue decodificar (causavam o crash do treino);
- as gigantes (DecompressionBomb), redimensionando para no maximo 1280px.

Reescreve no lugar como JPEG valido. Roda no dataset_cls (junction -> HD).

  cd backend
  python fix_images.py
"""

import os

import cv2
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # nao estourar em imagens grandes durante a leitura

RAIZ = "dataset_cls"
MAX_LADO = 1280
MAX_PIXELS = 25_000_000  # ~25 MP: acima disso, redimensiona

ilegiveis = []
grandes = []
ok = 0

for sub in ("train", "val"):
    base = os.path.join(RAIZ, sub)
    if not os.path.isdir(base):
        continue
    for classe in os.listdir(base):
        pasta = os.path.join(base, classe)
        if not os.path.isdir(pasta):
            continue
        for nome in os.listdir(pasta):
            if not nome.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            caminho = os.path.join(pasta, nome)
            im = cv2.imread(caminho)
            precisa_reescrever = False
            motivo = None

            if im is None:
                # cv2 nao leu: tenta via PIL e reescreve
                try:
                    pil = Image.open(caminho).convert("RGB")
                    precisa_reescrever = True
                    motivo = "ilegivel-cv2"
                    ilegiveis.append(caminho)
                except Exception as e:
                    print(f"[X] nao consegui abrir nem com PIL: {caminho} ({e})")
                    continue
            else:
                h, w = im.shape[:2]
                if h * w > MAX_PIXELS:
                    pil = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
                    precisa_reescrever = True
                    motivo = f"grande({w}x{h})"
                    grandes.append(caminho)

            if precisa_reescrever:
                w0, h0 = pil.size
                if max(w0, h0) > MAX_LADO:
                    if w0 >= h0:
                        novo = (MAX_LADO, int(h0 * MAX_LADO / w0))
                    else:
                        novo = (int(w0 * MAX_LADO / h0), MAX_LADO)
                    pil = pil.resize(novo, Image.LANCZOS)
                # salva sempre como .jpg valido (remove o original se extensao diferente)
                destino = os.path.splitext(caminho)[0] + ".jpg"
                pil.save(destino, "JPEG", quality=90)
                if destino != caminho and os.path.exists(caminho):
                    os.remove(caminho)
                print(f"[fix] {motivo}: {os.path.basename(caminho)}")
            else:
                ok += 1

print("\n=== resumo ===")
print(f"ok (intactas):       {ok}")
print(f"ilegiveis p/ cv2:    {len(ilegiveis)} (reescritas via PIL)")
print(f"grandes redimens.:   {len(grandes)}")
