import csv
import re
from collections import defaultdict

def parse_mobile(raw):
    text = raw.strip()
    pat = ""
    m = re.search(r"DOMINIO\s*([A-Z0-9]{6,8})", text, re.I)
    if m:
        pat = m.group(1).upper()
    else:
        parts = [p.strip() for p in text.split("-")]
        if parts:
            cand = parts[-1].replace(" ", "").upper()
            if re.match(r"^[A-Z0-9]{6,8}$", cand):
                pat = cand
    num = ""
    m2 = re.search(r"\bINT\s*(\d{1,5})\b", text, re.I)
    if m2:
        num = m2.group(1)
    else:
        for p in text.split("-"):
            p = p.strip()
            if re.fullmatch(r"\d{2,5}", p):
                num = p
    nombre = re.sub(r"-?\s*DOMINIO\s*[A-Z0-9]+", "", text, flags=re.I).strip(" -")
    key = pat or num
    return {"numero": num or pat, "nombre": nombre, "patente": pat, "key": key}


def status(obs, hi, he):
    obs = (obs or "").lower()
    hi = (hi or "").upper().strip()
    he = (he or "").upper().strip()
    crit = re.search(
        r"inmoviliz|fuera de servicio|no oper|no circula|gravedad|frenos|motor|rotura|partido|roto|no arranca|taller|desinflado|falta comando|sin auxilio|no tiene auxilio|baja",
        obs,
    )
    if crit:
        return "outOfService"
    if hi == "MALO" or he == "MALO":
        return "outOfService"
    if hi == "REGULAR" or he == "REGULAR" or len(obs.strip()) > 20:
        return "attention"
    if obs.strip():
        return "attention"
    return "operational"


path = __import__("os").environ.get("SHEET_CSV", r"C:\Users\frobo\AppData\Local\Temp\sheet_full.csv")
with open(path, encoding="utf-8", errors="replace") as f:
    rows = list(csv.reader(f))

header_idx = next(i for i, r in enumerate(rows) if r and r[0] == "Marca temporal")
by = defaultdict(list)
for r in rows[header_idx + 1 :]:
    if not any(c.strip() for c in r) or len(r) <= 6 or not r[6].strip():
        continue
    p = parse_mobile(r[6])
    st = status(
        r[21] if len(r) > 21 else "",
        r[20] if len(r) > 20 else "",
        r[22] if len(r) > 22 else "",
    )
    by[p["key"]].append((r[0], st, p))

print("Moviles unicos:", len(by))
counts = defaultdict(int)
for key in sorted(by, key=lambda k: by[k][-1][2]["nombre"]):
    hist = sorted(by[key], key=lambda x: x[0], reverse=True)
    counts[hist[0][1]] += 1

print("Estados actuales:", dict(counts))
for key in sorted(by, key=lambda k: by[k][-1][2]["nombre"])[:6]:
    hist = sorted(by[key], key=lambda x: x[0], reverse=True)
    p = hist[0][2]
    print(
        f"  {p['patente']} | {p['nombre'][:40]} | {hist[0][1]} | {len(hist)} novedades"
    )
