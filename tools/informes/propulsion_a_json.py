"""Convierte la Tabla «Estado por tecnología» de Aviacion2050_NovedadesPropulsion (DOCX) a data/propulsion.json.

Uso:  python3 tools/informes/propulsion_a_json.py <NovedadesPropulsion.docx> data/propulsion.json

- El último hito es dato verificado del informe, con las fuentes de su lista (verificacion
  "informe": citada en los informes, sin releer). El próximo hito es lo que declara el
  desarrollador, con las mismas fuentes; "No declarado" o "No verificado" quedan en null.
- TRL y penalización dominante son estimación propia del autor.
"""
import json
import re
import sys
import unicodedata

import docx
from docx.oxml.ns import qn

SRC, OUT = sys.argv[1], sys.argv[2]
CONSULTADO = "2026-10-26"
INFORME = {
    "titulo": "Aviacion2050_NovedadesPropulsion",
    "version": "v01",
    "fecha": "2026-10-18",
    "autor": "Julian Ruarte",
    "seccion": "3. Estado por tecnología",
}
# Familia por palabras del nombre del programa.
FAMILIAS = [
    ("hibrido", ["EPFD", "Dash 8", "ES-36", "ELEVATED", "Electra"]),
    ("turbofan", ["UltraFan", "GTF", "HyTEC"]),
    ("rotor_abierto", ["RISE"]),
    ("hidrogeno", ["pila de combustible", "ZeroAvia"]),
    ("bateria", ["Amprius"]),
    ("saf", ["SAF"]),
    ("frontera", ["Boom"]),
]

doc = docx.Document(SRC)
clean = lambda s: re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()

refs = []
for p in doc.paragraphs:
    m = re.search(r"\[(P|S)\] (.+?) \((\d{4}[a-z]?|s\. f\.)\)\. (.+)", clean(p.text))
    if not m:
        continue
    links = [doc.part.rels[h.get(qn("r:id"))].target_ref for h in p._p.iter(qn("w:hyperlink")) if h.get(qn("r:id"))]
    links += re.findall(r"https://\S+", m.group(4))
    url = next((l.rstrip(".") for l in links if l.startswith("https://") and "drive.google.com" not in l), None)
    titulo = re.sub(r"\s*https://\S+\s*$", "", m.group(4)).strip().rstrip(".")
    refs.append({"tipo": "primaria" if m.group(1) == "P" else "secundaria", "autor": m.group(2), "anio": m.group(3), "titulo": titulo, "url": url})


def fuentes(cita):
    out = []
    for parte in cita.split(";"):
        m = re.match(r"\s*(.+?) \(([^)]+)\)", parte)
        if not m:
            continue
        autor, anios = m.group(1).strip(), [a.strip() for a in m.group(2).split(",")]
        for a in anios:
            r = next((r for r in refs if r["autor"].startswith(autor) and r["anio"] == a), None)
            if r and r["url"]:
                y = re.match(r"\d{4}", r["anio"])
                out.append({
                    "titulo": f"{r['autor']} ({r['anio']}). {r['titulo']}",
                    "url": r["url"],
                    "anio": int(y.group(0)) if y else None,
                    "consultado": CONSULTADO,
                    "tipo": r["tipo"],
                    "verificacion": "informe",
                })
    return out


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:48].strip("-")


def est(valor, **extra):
    return {"valor": valor, "tipo": "estimacion", "informe": INFORME, **extra} if valor else {"valor": None}


programas = []
for row in doc.tables[0].rows[1:]:
    nombre, hito, proximo, trl, penaliza, cita = [clean(c.text) for c in row.cells]
    fs = fuentes(cita)
    familia = next((f for f, keys in FAMILIAS if any(k in nombre for k in keys)), "otro")
    m = re.match(r"([1-9](?:–[1-9])?)\s*(?:\((.+)\))?", trl)
    trl_dato = est(m.group(1), **({"contexto": m.group(2)} if m and m.group(2) else {})) if m else {"valor": None}
    declarado = not re.match(r"No (declarado|verificado)", proximo)
    programas.append({
        "id": slug(nombre),
        "nombre": nombre,
        "familia": familia,
        "hito": {"valor": hito, "tipo": "verificado", "fuentes": fs} if fs else {"valor": None, "nota": f"Hito: {hito} · fuente sin URL: {cita}"},
        "proximo": ({"valor": proximo, "tipo": "verificado", "fuentes": fs, "contexto": "Lo que declara el desarrollador."} if declarado and fs else {"valor": None}),
        "trl": trl_dato,
        "penaliza": est(penaliza),
    })

data = {
    "_nota": "Generado con tools/informes/propulsion_a_json.py desde Aviacion2050_NovedadesPropulsion_v01_20261018 (corte 18/10/2026), tabla «Estado por tecnología». Hitos y próximos hitos: datos verificados del informe, con sus fuentes sin releer (verificacion 'informe'); el próximo hito es lo que declara el desarrollador. TRL y penalización: estimación del autor.",
    "programas": programas,
}
with open(OUT, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"{len(programas)} programas; sin fuente: {[p['nombre'] for p in programas if p['hito']['valor'] is None]}")
