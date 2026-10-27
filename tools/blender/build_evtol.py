"""Construye el eVTOL genérico en Blender (sin interfaz) y lo exporta a GLB.

Uso:  python tools/blender/build_evtol.py -- <carpeta_salida> [--preview]
      (con el módulo oficial de Blender, bpy; ver docs/modelo-3d.md)

Es un arquetipo genérico e ilustrativo: no reproduce ningún modelo comercial
ni ningún diseño de terceros. Las tres configuraciones salen de los mismos
parámetros. Ejes de Blender: +X adelante, +Z arriba, Y envergadura (al
exportar a glTF, Z pasa a ser +Y).

Nodos que usa la web (no renombrar sin actualizar src/three/hangar):
  g_fuselaje, g_ala, g_cola, g_rotores, g_energia, g_tren  -> grupos del despiece
  rotor_<n>  (pivote del rotor)   spin_<n>  (gira)   tilt_<n> (bascula)
  kind_lift / kind_tilt / kind_pusher  (propiedad "kind" en rotor_<n>)
  hs_<nombre>  -> puntos de las explicaciones
  material "energia" -> la web le aplica el color del portador
"""
import math
import sys

import bpy  # noqa: I001 (bpy primero: habilita bmesh y mathutils)
import bmesh
from mathutils import Matrix, Vector

ARGV = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = ARGV[0] if ARGV else "."
PREVIEW = "--preview" in ARGV
# --cabina: además, un render de control con el casco oculto para ver el interior, y uno de costado.
CABINA = "--cabina" in ARGV

# ---------------------------------------------------------------- materiales


def material(name, color, metallic=0.0, rough=0.5, clearcoat=0.0, transmission=0.0, emission=None, strength=0.0, ior=1.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = clearcoat
    b.inputs["Coat Roughness"].default_value = 0.08
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["IOR"].default_value = ior
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


def materials():
    return {
        "pintura": material("pintura", (0.80, 0.82, 0.85), metallic=0.25, rough=0.24, clearcoat=1.0),
        "grafito": material("grafito", (0.035, 0.04, 0.05), metallic=0.55, rough=0.32, clearcoat=0.6),
        "carbono": material("carbono", (0.015, 0.016, 0.02), metallic=0.3, rough=0.38, clearcoat=0.5),
        "vidrio": material("vidrio", (0.02, 0.03, 0.045), metallic=0.0, rough=0.02, transmission=0.85, ior=1.5),
        "metal": material("metal", (0.62, 0.64, 0.68), metallic=1.0, rough=0.22),
        "goma": material("goma", (0.018, 0.018, 0.02), rough=0.85),
        "interior": material("interior", (0.06, 0.065, 0.07), rough=0.7),
        "tapizado": material("tapizado", (0.11, 0.12, 0.14), rough=0.8),
        "pantalla": material("pantalla", (0.02, 0.05, 0.08), emission=(0.25, 0.6, 0.95), strength=2.5),
        "ventanilla": material("ventanilla", (0.01, 0.015, 0.025), metallic=0.2, rough=0.05, clearcoat=1.0),
        "acento": material("acento", (0.3, 0.6, 0.9), emission=(0.36, 0.74, 1.0), strength=7.0),
        "nav_rojo": material("nav_rojo", (0.9, 0.1, 0.1), emission=(1.0, 0.12, 0.08), strength=9.0),
        "nav_verde": material("nav_verde", (0.1, 0.9, 0.3), emission=(0.1, 1.0, 0.35), strength=9.0),
        "energia": material("energia", (0.22, 0.74, 0.97), emission=(0.22, 0.74, 0.97), strength=3.0),
    }


# ---------------------------------------------------------------- utilidades


def new_object(name, mesh, parent=None, mat=None):
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    if parent:
        o.parent = parent
    if mat:
        o.data.materials.append(mat)
    return o


def empty(name, location=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.1
    bpy.context.collection.objects.link(e)
    e.location = location
    if parent:
        e.parent = parent
    return e


def smooth(o, subsurf=0, bevel=0.0, segments=2):
    for p in o.data.polygons:
        p.use_smooth = True
    if bevel > 0:
        b = o.modifiers.new("bisel", "BEVEL")
        b.width = bevel
        b.segments = segments
        b.limit_method = "ANGLE"
    if subsurf:
        s = o.modifiers.new("suave", "SUBSURF")
        s.levels = subsurf
        s.render_levels = subsurf
    return o


def loft(name, rings, closed_ends=True):
    """Superficie por secciones: rings = lista de listas de Vector (mismo largo)."""
    bm = bmesh.new()
    vs = [[bm.verts.new(p) for p in ring] for ring in rings]
    n = len(rings[0])
    for a, b in zip(vs[:-1], vs[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if closed_ends:
        for ring, flip in ((vs[0], True), (vs[-1], False)):
            c = bm.verts.new(sum((v.co for v in ring), Vector()) / n)
            for i in range(n):
                f = (ring[i], ring[(i + 1) % n], c) if not flip else (ring[(i + 1) % n], ring[i], c)
                bm.faces.new(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def naca(t, m=0.0, p=0.4, n=28):
    """Perfil NACA de 4 dígitos (fórmula pública), contorno cerrado en x de 0 a 1."""
    xs = [0.5 * (1 - math.cos(math.pi * i / n)) for i in range(n + 1)]
    up, lo = [], []
    for x in xs:
        yt = 5 * t * (0.2969 * math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x**3 - 0.1036 * x**4)
        yc = dyc = 0.0
        if m > 0:
            if x < p:
                yc, dyc = m / p**2 * (2 * p * x - x * x), 2 * m / p**2 * (p - x)
            else:
                yc, dyc = m / (1 - p) ** 2 * (1 - 2 * p + 2 * p * x - x * x), 2 * m / (1 - p) ** 2 * (p - x)
        th = math.atan(dyc)
        up.append((x - yt * math.sin(th), yc + yt * math.cos(th)))
        lo.append((x + yt * math.sin(th), yc - yt * math.cos(th)))
    return list(reversed(up)) + lo[1:-1]


def wing(name, span, root, tip, t=0.13, camber=0.02, sweep=0.05, dihedral=0.04, stations=14, vertical=False, mat=None, parent=None, location=(0, 0, 0), half=False):
    """Ala por secciones de perfil NACA, con estrechamiento, flecha y diedro.
    vertical=True la levanta en Z (deriva). half=True arma solo un lado (desde la raíz)."""
    prof = naca(t, camber)
    rings = []
    start = 0 if half else -stations
    for k in range(start, stations + 1):
        s = k / stations  # -1..1
        a = abs(s)
        chord = root + (tip - root) * a
        y = s * span / 2 if not half else s * span
        rings_pts = []
        for px, pz in prof:
            x = -(px - 0.25) * chord - sweep * (abs(y))
            z = pz * chord + dihedral * abs(y)
            rings_pts.append(Vector((x, 0, z)) if vertical else Vector((x, y, z)))
            if vertical:
                rings_pts[-1] = Vector((x - sweep * 0, pz * chord, y))  # perfil en XY, envergadura en Z
        rings.append(rings_pts)
    o = new_object(name, loft(name, rings), parent, mat)
    o.location = location
    return smooth(o)


def tube(name, a, b, r, mat=None, parent=None, sides=16):
    a, b = Vector(a), Vector(b)
    d = b - a
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=sides, radius1=r, radius2=r, depth=d.length)
    bm.to_mesh(me)
    bm.free()
    o = new_object(name, me, parent, mat)
    o.location = (a + b) / 2
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return smooth(o, bevel=r * 0.3)


def uv_blob(name, loc, scale, mat=None, parent=None, seg=32, rings=16, subsurf=1):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    bm.to_mesh(me)
    bm.free()
    o = new_object(name, me, parent, mat)
    o.location = loc
    o.scale = scale
    return smooth(o, subsurf=subsurf)


# ---------------------------------------------------------------- piezas

L, R = 3.9, 0.56  # largo y radio del fuselaje


def fuselage_section(s):
    """Radio lateral, alto superior, alto inferior y centro Z a lo largo del fuselaje (s: 0 nariz, 1 cola)."""
    nose, tail = 0.22, 0.4
    if s < nose:
        k = math.sqrt(max(0.0, 1 - ((nose - s) / nose) ** 2))
    elif s > 1 - tail:
        u = (s - (1 - tail)) / tail
        k = 1 - 0.84 * u**1.35
    else:
        k = 1.0
    lift = ((s - (1 - tail)) / tail) ** 2 * 0.75 * R if s > 1 - tail else 0.0
    return R * k, R * k * 0.95, R * k * 0.72, lift


def build_fuselage(M, parent):
    n_rings, n_pts, e = 34, 20, 2.6
    rings = []
    for i in range(n_rings + 1):
        s = 0.004 + 0.992 * i / n_rings
        ry, rzt, rzb, zc = fuselage_section(s)
        x = L * (0.5 - s)
        pts = []
        for j in range(n_pts):
            a = 2 * math.pi * j / n_pts
            c, sn = math.cos(a), math.sin(a)
            y = ry * math.copysign(abs(c) ** (2 / e), c)
            z = zc + (rzt if sn > 0 else rzb) * math.copysign(abs(sn) ** (2 / e), sn)
            pts.append(Vector((x, y, z)))
        rings.append(pts)
    me = loft("fuselaje", rings)
    o = new_object("fuselaje", me, parent)
    o.data.materials.append(M["pintura"])
    o.data.materials.append(M["grafito"])
    # Dos tonos: la panza en grafito.
    for p in o.data.polygons:
        cz = p.center.z
        _, _, rzb, zc = fuselage_section(min(1, max(0, 0.5 - p.center.x / L)))
        p.material_index = 1 if cz < zc - rzb * 0.35 else 0
    smooth(o, subsurf=2)

    # Cabina de vidrio con marco e interior.
    # Burbuja que sobresale del lomo y baja hacia la nariz.
    uv_blob("cabina", (L * 0.19, 0, R * 0.66), (1.2, R * 0.74, R * 0.52), M["vidrio"], parent, subsurf=2)
    uv_blob("marco_cabina", (L * 0.19, 0, R * 0.6), (1.24, R * 0.79, R * 0.07), M["grafito"], parent, subsurf=1)
    build_cabin(M, parent)
    # Líneas de acento a los costados y en la nariz.
    for side in (1, -1):
        rings = []
        for i in range(24):
            s = 0.12 + 0.5 * i / 23
            ry, _, _, zc = fuselage_section(s)
            x = L * (0.5 - s)
            rings.append([Vector((x, side * (ry * 1.005), zc + dz)) for dz in (-0.012, 0.012)])
        strip = bpy.data.meshes.new("acento")
        bm = bmesh.new()
        vs = [[bm.verts.new(p) for p in r] for r in rings]
        for a, b in zip(vs[:-1], vs[1:]):
            bm.faces.new((a[0], a[1], b[1], b[0]))
        bm.to_mesh(strip)
        bm.free()
        new_object("acento", strip, parent, M["acento"])
    uv_blob("luz_nariz", (L * 0.5 - 0.02, 0, -0.02), (0.035, 0.18, 0.02), M["acento"], parent, subsurf=0)
    return o


E_SECCION = 2.6  # exponente de la superelipse del fuselaje (ver build_fuselage)


def side_y(x, z):
    """Semiancho del fuselaje en (x, z): la superficie lateral, para apoyar puertas y ventanillas."""
    ry, rzt, rzb, zc = fuselage_section(min(1, max(0, 0.5 - x / L)))
    dz = z - zc
    rz = rzt if dz > 0 else rzb
    u = min(1.0, abs(dz) / rz)
    # La sección es |y/ry|^e + |z/rz|^e = 1 (los puntos se arman con exponente 2/e).
    return ry * max(0.0, 1 - u**E_SECCION) ** (1 / E_SECCION)


def box(name, loc, size, mat, parent, bevel=0.012, rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bm.to_mesh(me)
    bm.free()
    o = new_object(name, me, parent, mat)
    o.location, o.scale, o.rotation_euler = loc, size, rot
    return smooth(o, bevel=bevel / max(min(size), 1e-3), segments=2)


def seat(name, x, y, zf, M, parent):
    """Asiento genérico: almohadón, respaldo inclinado y apoyacabeza."""
    box(f"{name}_almohadon", (x, y, zf + 0.06), (0.34, 0.3, 0.07), M["tapizado"], parent)
    box(f"{name}_respaldo", (x - 0.18, y, zf + 0.3), (0.07, 0.3, 0.42), M["tapizado"], parent, rot=(0, math.radians(-12), 0))
    box(f"{name}_cabeza", (x - 0.23, y, zf + 0.56), (0.06, 0.2, 0.12), M["tapizado"], parent, rot=(0, math.radians(-12), 0))
    box(f"{name}_base", (x, y, zf + 0.015), (0.26, 0.22, 0.03), M["grafito"], parent)


def hull_strip(name, pts, mat, parent, side, half=0.006):
    """Franja fina sobre el costado del fuselaje que sigue la curva (marcos de puerta)."""
    bm = bmesh.new()
    vs = []
    for i, (x, z) in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        tx, tz = b[0] - a[0], b[1] - a[1]
        n = math.hypot(tx, tz) or 1
        nx, nz = -tz / n * half, tx / n * half
        y = side * (side_y(x, z) * 1.012 + 0.003)
        vs.append((bm.verts.new((x + nx, y, z + nz)), bm.verts.new((x - nx, y, z - nz))))
    for (a0, a1), (b0, b1) in zip(vs[:-1], vs[1:]):
        bm.faces.new((a0, a1, b1, b0))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return new_object(name, me, parent, mat)


def build_cabin(M, parent):
    """Cabina: piso, puesto de piloto con panel e instrumentos, cuatro asientos de pasajeros,
    una puerta por lado y ventanillas traseras. Arquetipo genérico."""
    zf = -0.27  # piso de la cabina
    box("piso_cabina", (0.42, 0, zf), (1.95, 0.86, 0.02), M["interior"], parent)
    # Puesto de piloto
    seat("asiento_piloto", 1.08, 0, zf, M, parent)
    box("panel", (1.56, 0, 0.02), (0.16, 0.66, 0.16), M["grafito"], parent, rot=(0, math.radians(-28), 0))
    for y in (0.15, -0.15):
        box("pantalla", (1.49, y, 0.06), (0.012, 0.24, 0.13), M["pantalla"], parent, bevel=0.002, rot=(0, math.radians(-28), 0))
    tube("palanca", (1.3, 0.2, zf + 0.08), (1.33, 0.2, zf + 0.3), 0.012, M["metal"], parent)
    # Pasajeros: dos filas de dos
    for i, x in enumerate((0.42, -0.3)):
        for j, y in enumerate((0.22, -0.22)):
            seat(f"asiento_pasajero_{2 * i + j}", x, y, zf, M, parent)
    # Puertas: marco que sigue el costado del fuselaje
    x0, x1, z0, z1, r = -0.62, 0.78, zf + 0.02, 0.2, 0.06
    edge = []
    edge += [(x0 + r + (x1 - x0 - 2 * r) * k / 16, z0) for k in range(17)]
    edge += [(x1, z0 + r + (z1 - z0 - 2 * r) * k / 8) for k in range(9)]
    edge += [(x1 - r - (x1 - x0 - 2 * r) * k / 16, z1) for k in range(17)]
    edge += [(x0, z1 - r - (z1 - z0 - 2 * r) * k / 8) for k in range(9)]
    edge.append(edge[0])
    for side in (1, -1):
        hull_strip("puerta", edge, M["grafito"], parent, side)
        hull_strip("manija", [(x1 - 0.16, z0 + 0.2), (x1 - 0.06, z0 + 0.2)], M["metal"], parent, side, half=0.012)
        # Ventanilla trasera, apoyada en el costado
        xw, zw = -0.95, 0.05
        uv_blob("ventanilla", (xw, side * side_y(xw, zw) * 0.985, zw), (0.16, 0.025, 0.1), M["ventanilla"], parent, subsurf=1)


def build_blade(name, radius, root_c, tip_c, twist0, twist1, M, parent, angle):
    prof = naca(0.11, 0.03, n=10)
    rings = []
    st = 10
    for k in range(st + 1):
        u = k / st
        r = 0.1 + u * (radius - 0.1)
        c = root_c + (tip_c - root_c) * u
        tw = math.radians(twist0 + (twist1 - twist0) * u)
        pts = []
        for px, pz in prof:
            x, z = (px - 0.35) * c, pz * c
            # torsión alrededor del eje de la pala
            xr, zr = x * math.cos(tw) - z * math.sin(tw), x * math.sin(tw) + z * math.cos(tw)
            pts.append(Vector((xr, r, zr)))
        rings.append(pts)
    o = new_object(name, loft(name, rings), parent, M["carbono"])
    o.rotation_euler = (0, 0, angle)
    return smooth(o)


def build_rotor(n, kind, loc, radius, blades, M, parent, nacelle=False):
    """Rotor con pivote propio. Eje de giro: +Z (lift y tilt) o +X (pusher)."""
    base = empty(f"rotor_{n}", loc, parent)
    base["kind"] = kind
    holder = base
    if kind == "tilt":
        holder = empty(f"tilt_{n}", (0, 0, 0), base)
    if kind == "pusher":
        holder = empty(f"eje_{n}", (0, 0, 0), base)
        holder.rotation_euler = (0, math.radians(-90), 0)  # eje +Z → -X (empuja hacia adelante)
    # En los basculantes el pivote está en el ala: la góndola sube desde ahí y el rotor queda arriba.
    lift_z = 0.42 if nacelle else 0.0
    if nacelle:
        uv_blob("gondola", (0, 0, 0.16), (0.12, 0.12, 0.34), M["pintura"], holder, subsurf=2)
    # motor con aletas de refrigeración
    tube("motor", (0, 0, lift_z - 0.16), (0, 0, lift_z + 0.02), 0.085, M["grafito"], holder)
    for k in range(5):
        tube("aleta", (0, 0, lift_z - 0.14 + k * 0.03), (0, 0, lift_z - 0.13 + k * 0.03), 0.1, M["metal"], holder, sides=20)
    spin = empty(f"spin_{n}", (0, 0, lift_z + 0.05), holder)
    uv_blob("cubo", (0, 0, 0.02), (0.07, 0.07, 0.09), M["metal"], spin, subsurf=1)
    for i in range(blades):
        build_blade("pala", radius, 0.16 * radius / 0.9, 0.07 * radius / 0.9, 18, 6, M, spin, 2 * math.pi * i / blades)
    return base


def wheel(loc, M, parent, r=0.13):
    g = empty("rueda", loc, parent)
    me = bpy.data.meshes.new("cubierta")
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, segments=1, radius=1)
    bm.free()
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=r * 0.42, major_segments=40, minor_segments=14)
    t = bpy.context.active_object
    t.name = "cubierta"
    t.parent = g
    t.rotation_euler = (math.radians(90), 0, 0)
    t.data.materials.append(M["goma"])
    smooth(t)
    tube("llanta", (0, -0.06, 0), (0, 0.06, 0), r * 0.62, M["metal"], g)
    return g


def gear(M, parent, skids=False):
    g = empty("g_tren", (0, 0, 0), parent)
    if skids:
        for y in (0.42, -0.42):
            tube("patin", (0.75, y, -0.86), (-0.75, y, -0.86), 0.035, M["grafito"], g)
            for x in (0.45, -0.45):
                tube("pata", (x, y * 0.8, -R * 0.5), (x, y, -0.86), 0.028, M["grafito"], g)
        return g
    for x, y in ((L * 0.3, 0.0), (-L * 0.08, 0.55), (-L * 0.08, -0.55)):
        tube("pata", (x, y * 0.7, -R * 0.45), (x, y, -0.72), 0.03, M["metal"], g)
        wheel((x, y, -0.78), M, g)
    return g


# ---------------------------------------------------------------- configuraciones


def build(config, M):
    root = empty("evtol")
    gf = empty("g_fuselaje", (0, 0, 0), root)
    build_fuselage(M, gf)
    ge = empty("g_energia", (0, 0, 0), root)
    bm_box = bpy.data.meshes.new("energia")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bm.to_mesh(bm_box)
    bm.free()
    pack = new_object("paquete_energia", bm_box, ge, M["energia"])
    pack.scale = (1.4, 0.46, 0.06)
    pack.location = (-0.1, 0, -R * 0.62)
    smooth(pack, bevel=0.02)

    gc = empty("g_cola", (0, 0, 0), root)
    for side in (1, -1):
        v = wing("cola_v", 0.85, 0.62, 0.3, t=0.1, camber=0, sweep=0.45, dihedral=0, stations=6, vertical=True, mat=M["pintura"], parent=gc, location=(-L * 0.44, 0, R * 0.55), half=True)
        v.rotation_euler = (side * math.radians(38), 0, 0)
        # luz en la punta de cada deriva, en coordenadas locales del panel
        luz = uv_blob("luz_cola", (-0.45 * 0.85 - 0.05, 0, 0.84), (0.05, 0.02, 0.02), M["acento"], v, subsurf=0)
        luz.parent = v

    gr = empty("g_rotores", (0, 0, 0), root)
    hs = {}
    if config == "multicoptero":
        gear(M, root, skids=True)
        k = 0
        for x in (1.45, -1.45):
            for y in (1.45, -1.45):
                tube("brazo", (x * 0.2, y * 0.2, R * 0.35), (x, y, 0.62), 0.05, M["carbono"], gr)
                build_rotor(k, "lift", (x, y, 0.66), 0.95, 3, M, gr)
                k += 1
        hs["hs_rotor"] = (1.45, 1.45, 0.75)
    else:
        ga = empty("g_ala", (0, 0, 0), root)
        wing("ala", 6.8, 1.05, 0.6, sweep=0.05, dihedral=0.035, mat=M["pintura"], parent=ga, location=(0.15, 0, R * 0.78))
        for side, mat in ((1, M["nav_verde"]), (-1, M["nav_rojo"])):
            uv_blob("luz_punta", (0.15 - 0.05 * 3.4 - 0.1, side * 3.42, R * 0.78 + 0.035 * 3.4), (0.06, 0.03, 0.03), mat, ga, subsurf=0)
        gear(M, root)
        hs["hs_ala"] = (0.0, 2.4, R * 0.95)
        if config == "sustentacion_crucero":
            k = 0
            for y in (1.65, -1.65):
                tube("boom", (2.15, y, R * 0.62), (-2.45, y, R * 0.62), 0.075, M["pintura"], gr)
                for x in (1.9, -2.15):
                    build_rotor(k, "lift", (x, y, R * 0.62 + 0.18), 0.72, 2, M, gr)
                    k += 1
            build_rotor(k, "pusher", (-L * 0.5 - 0.02, 0, R * 0.62), 0.62, 3, M, gr)
            hs["hs_rotor"] = (1.9, 1.65, 0.75)
        else:  # rotores_basculantes
            for k, y in enumerate((1.45, 2.9, -1.45, -2.9)):
                build_rotor(k, "tilt", (0.55, y, R * 0.78 + 0.02), 0.62, 3, M, gr, nacelle=True)
            hs["hs_rotor"] = (0.85, 2.9, 1.0)
    hs["hs_cabina"] = (L * 0.22, 0, R * 1.05)
    hs["hs_energia"] = (-0.1, 0, -R * 0.75)
    hs["hs_cola"] = (-L * 0.5, 0, R * 1.3)
    for name, loc in hs.items():
        empty(name, loc, root)
    return root


def preview(path, cam_loc=(6.5, -6.0, 2.6), target=(0, 0, -0.1), hide=(), lens=45):
    sc = bpy.context.scene
    for o in bpy.data.objects:
        o.hide_render = any(o.name.startswith(h) for h in hide)
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 48
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.005, 0.008, 1)
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -0.92))
    bpy.context.active_object.data.materials.append(material("piso", (0.02, 0.022, 0.026), rough=0.55))
    for loc, energy, size in (((3, -4, 5), 900, 4), ((-5, 3, 3), 400, 6), ((0, 0, 7), 500, 8)):
        bpy.ops.object.light_add(type="AREA", location=loc)
        lt = bpy.context.active_object
        lt.data.energy, lt.data.size = energy, size
        lt.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=cam_loc)
    cam = bpy.context.active_object
    cam.data.lens = lens
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    sc.view_settings.view_transform = "AgX"
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    only = ARGV[ARGV.index("--only") + 1] if "--only" in ARGV else None
    for config in ("multicoptero", "sustentacion_crucero", "rotores_basculantes"):
        if only and config != only:
            continue
        bpy.ops.wm.read_factory_settings(use_empty=True)
        M = materials()
        build(config, M)
        bpy.ops.export_scene.gltf(
            filepath=f"{OUT}/evtol-{config}.glb",
            export_format="GLB",
            export_apply=True,
            export_extras=True,
            export_yup=True,
        )
        if PREVIEW:
            preview(f"{OUT}/preview-{config}.png")
        if CABINA:
            preview(f"{OUT}/cabina-{config}.png", (2.6, -2.6, 2.4), (0.45, 0, -0.1), hide=("fuselaje", "cabina", "marco_cabina", "ala", "luz_"), lens=35)
            preview(f"{OUT}/costado-{config}.png", (0.3, -5.5, 0.3), (0.2, 0, 0), lens=40)
        print("listo", config)


main()
