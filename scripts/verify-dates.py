import json
from datetime import datetime

with open("public/data/mobiles.json", encoding="utf-8") as f:
    data = json.load(f)

print("Updated:", data["updatedAt"])
for m in sorted(data["mobiles"], key=lambda x: x["numero"]):
    ms = m["ultimaNovedad"]["timestampMs"]
    dt = datetime.fromtimestamp(ms / 1000) if ms else None
    print(f"  {m['numero']:>4} {m['patente']:8} {m['ultimaActualizacion'][:30]:30} -> {dt}")

m48 = next(m for m in data["mobiles"] if m["numero"] == "48")
print("\n--- Móvil 48 top 3 ---")
for h in m48["historial"][:3]:
    print(h["timestamp"], datetime.fromtimestamp(h["timestampMs"] / 1000))
