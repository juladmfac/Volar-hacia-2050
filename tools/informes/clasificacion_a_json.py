"""Convierte las tablas de Aviacion2050_ClasificacionTecnologica (DOCX) a data/tecnologias.json.

Uso:  python3 tools/informes/clasificacion_a_json.py <Clasificacion.docx> data/tecnologias.json [otros informes .docx…]

- El hito de cada tecnología es dato verificado en el informe: se carga con las fuentes de su
  lista de referencias (verificacion "informe": citada en los informes, sin releer). Si la cita no
  tiene URL pública (por ejemplo, la conferencia de 2021), se busca la misma referencia (autor, año y
  título) en la bibliografía de los otros informes; si tampoco está, el hito queda en null con una nota.
- El TRL de hoy, "mueve" y "penaliza" son estimación propia del autor; la proyección a 2030–2050
  y la ventana de TRL 9, especulación prospectiva. Todos citan el informe.
"""
import json
import re
import sys
import unicodedata

import docx
from docx.oxml.ns import qn

SRC, OUT, EXTRA = sys.argv[1], sys.argv[2], sys.argv[3:]
CONSULTADO = "2026-10-26"
TEMAS = {2: "peso", 3: "resistencia", 4: "sustentacion", 5: "empuje", 6: "energia", 7: "operaciones", 8: "aerodromo"}
SECCION = {
    "peso": "1. Peso — materiales, estructuras y sistemas",
    "resistencia": "2. Resistencia — aerodinámica y control de flujo",
    "sustentacion": "3. Sustentación — alas, configuraciones y sustentación vertical",
    "empuje": "4. Empuje — motores y propulsión",
    "energia": "5. Energía — combustibles y almacenamiento",
    "operaciones": "6. Operaciones — trayectorias y espacio aéreo",
    "aerodromo": "7. Aeródromo — operación en tierra e infraestructura",
}
AUTOR = "Julian Ruarte"

doc = docx.Document(SRC)


def informe(tema):
    return {"titulo": "Aviacion2050_ClasificacionTecnologica", "version": "v01", "fecha": "2026-10-18", "autor": AUTOR, "seccion": SECCION[tema]}


def clean(s):
    return re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()


# ---- Referencias: "[P] Autor (2025b). Título… [host ↗](url)"
def read_refs(d):
    out = []
    for p in d.paragraphs:
        m = re.search(r"\[(P|S)\] (.+?) \((\d{4}[a-z]?|s\. f\.)\)\. (.+)", clean(p.text))
        if not m:
            continue
        links = [d.part.rels[h.get(qn("r:id"))].target_ref for h in p._p.iter(qn("w:hyperlink")) if h.get(qn("r:id"))]
        links += re.findall(r"https://\S+", m.group(4))
        titulo = re.sub(r"\s*(\S+ ↗|https://\S+)\s*$", "", m.group(4)).strip().rstrip(".")
        url = next((l.rstrip(".") for l in links if l.startswith("https://")), None)
        out.append({"tipo": "primaria" if m.group(1) == "P" else "secundaria", "autor": m.group(2), "anio": m.group(3), "titulo": titulo, "url": url})
    return out


refs = read_refs(doc)
otros = [r for f in EXTRA for r in read_refs(docx.Document(f)) if r["url"]]
norm = lambda t: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower())[:24]
for r in refs:
    if r["url"] is None:
        twin = next((o for o in otros if o["autor"].split(",")[0] == r["autor"].split(",")[0] and o["anio"][:4] == r["anio"][:4] and norm(o["titulo"]) == norm(r["titulo"])), None)
        if twin:
            r["url"] = twin["url"]


# La app no nombra a los autores de las conferencias (decisión del 26/10/2026). Una cita a una
# lámina ("Autor, 2021, A p52" o "X, en Autor, 2021, A p52") pasa a "conferencia de 2021".
def anonimizar(t):
    t = re.sub(r"\ben [^,():;]+, (\d{4}), ([AB] p)", r"en la conferencia de \1, \2", t)
    return re.sub(r"(?:(?<=\()|(?<=: )|(?<=; ))[^,():;]+, (\d{4}), ([AB] p)", r"conferencia de \1, \2", t)


def find_ref(cita):
    cita = cita.strip()
    m = re.search(r"(\d{4}[a-z]?|s\. f\.)", cita)
    if not m:
        return None
    year = m.group(1)
    autor = cita[: m.start()].strip(" ,")
    if " en " in autor:  # "Airbus, en <autor>": se cita la conferencia
        autor = autor.split(" en ", 1)[1]
    autor = autor.replace(" et al.", "").strip(" ,")
    for r in refs:
        if r["anio"] == year and (r["autor"].startswith(autor) or autor.startswith(r["autor"].split(",")[0])):
            return r
    return None


def fuente(r):
    year = re.match(r"\d{4}", r["anio"])
    return {
        "titulo": f"{r['autor']} ({r['anio']}). {r['titulo']}",
        "url": r["url"],
        "anio": int(year.group(0)) if year else None,
        "consultado": CONSULTADO,
        "tipo": r["tipo"],
        "verificacion": "informe",
    }


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:56].strip("-")


def trl(s):
    s = clean(s).replace("-", "–")
    return s if re.fullmatch(r"[1-9](–[1-9])?", s) else None


def est(valor, tema, tipo="estimacion", **extra):
    if valor in (None, ""):
        return {"valor": None, **extra}
    return {"valor": valor, "tipo": tipo, "informe": informe(tema), **extra}


out, sin_fuente, ids = [], [], set()
for ti, tema in TEMAS.items():
    for row in doc.tables[ti].rows[2:]:
        cells = row.cells
        paras = [clean(p.text) for p in cells[0].paragraphs if clean(p.text)]
        nombre, hito = paras[0], " ".join(paras[1:])
        # Citas: el último paréntesis con año al final del hito.
        m = re.search(r"\(([^()]*\d{4}[^()]*)\)\.?\s*$", hito)
        citas = [c for c in (m.group(1).split(";") if m else [])]
        rs = [find_ref(c) for c in citas]
        fuentes = [fuente(r) for r in rs if r and r["url"]]
        faltan = [c.strip() for c, r in zip(citas, rs) if not (r and r["url"])]
        hito_dato = {"valor": hito, "tipo": "verificado", "fuentes": fuentes} if fuentes else {"valor": None}
        if faltan:
            hito_dato["nota"] = anonimizar(("Hito: " + hito + " · " if not fuentes else "") + "Citas sin URL pública en el informe: " + "; ".join(faltan))
            sin_fuente.append(nombre)
        vent = [clean(p.text) for p in cells[7].paragraphs if clean(p.text)]
        ventana = est(vent[0], tema, "especulacion")
        for v in vent[1:]:
            if v.startswith("incertidumbre"):
                ventana["incertidumbre"] = v.replace("incertidumbre ", "")
            elif v.startswith("declarada"):
                ventana["declarada"] = v.replace("declarada: ", "")
        tid = slug(nombre)
        while tid in ids:
            tid += "-b"
        ids.add(tid)
        out.append(
            {
                "id": tid,
                "nombre": nombre,
                "tema": tema,
                "hito": hito_dato,
                "mueve": est(clean(cells[1].text), tema),
                "penaliza": est(clean(cells[8].text), tema),
                "trl_hoy": est(trl(cells[2].text), tema),
                "proyeccion": [est(trl(cells[3 + i].text), tema, "especulacion", anio=a) for i, a in enumerate([2030, 2035, 2040, 2050])],
                "ventana": ventana,
            }
        )

data = {
    "_nota": "Generado con tools/informes/clasificacion_a_json.py desde Aviacion2050_ClasificacionTecnologica_v01_20261018 (corte 18/10/2026). Hitos: dato verificado del informe, con sus fuentes sin releer (verificacion 'informe'). TRL de hoy, mueve y penaliza: estimación del autor. Proyección y ventana de TRL 9: especulación prospectiva del autor.",
    "tecnologias": out,
    "pendientes": [f"Hito sin URL pública en el informe: {n}" for n in sin_fuente],
}
with open(OUT, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"{len(out)} tecnologías; {len(sin_fuente)} con citas sin URL; {len(refs)} referencias")
