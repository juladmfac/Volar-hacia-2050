# Pendientes de verificar

Lo que figura acá no se resuelve de memoria: se resuelve con una fuente y se pasa a `data/`.

## Fuentes a releer (verificadas vía buscador)
El 24/10/2026 la red del entorno no permitía abrir los sitios de las fuentes, así que se confirmaron con el resumen de un buscador y quedaron marcadas `verificacion: "buscador"` (en la UI: "a releer"). Hay que abrir cada una, confirmar el dato y pasarla a `"lectura"`. Para eso hay que permitir esos dominios en la configuración de red del entorno o releerlas a mano. El panel `?revision=1` las lista todas.

Dominios: iata.org, eur-lex.europa.eu, consilium.europa.eu, transport.ec.europa.eu, easa.europa.eu, icao.int, atag.org, afdc.energy.gov, ehang.com, ir.ehang.com, jobyaviation.com, backend.ainonline.com, investors.archer.com, wam.ae, airdatanews.com, marketscreener.com, energy.gov, businesswire.com, ainonline.com, urbanairmobilitynews.com.

## Datos de la app
- `data/cities.json`, São Paulo: el rol y el estado no tienen fuente; los vertipuertos anunciados solo tienen fuentes secundarias (falta el comunicado de UrbanV) y un conflicto de cantidad (5 vertipuertos o hasta 7 FBO).
- Guangzhou/Shenzhen y Dubái/Abu Dabi: todos los puntos de `pendientes` en `data/cities.json`.
- `data/vehicles.json`: los `pendientes` de cada vehículo (hoja técnica de EHang, alcance de Joby, clasificación del Archer Midnight "12 tilt 6", fuente primaria de Eve).
- `data/tecnologias.json` (26/10/2026): generado desde la Clasificación v01 con `tools/informes/clasificacion_a_json.py`. Los hitos llevan las fuentes del informe sin releer (`verificacion: "informe"`); 15 hitos no tienen URL pública en ningún informe y quedan sin verificar (ver `pendientes` en el archivo).
- `data/saf.json`: ReFuelEU quedó leído el 27/10/2026 en la página de la Comisión y en el Informe Técnico Anual 2026 de EASA (2 %, 6 %, 70 %, 35 % de sintéticos en 2050, 0,7 % anual y 1,2 % promedio 2030–2031 de sintéticos, 2,79 % entregado en 2025). El resto de sus fuentes sigue confirmado solo vía buscador; además, el reparto de ATAG (38 a 58 %, Informe v04 §3.4), las 11 rutas ASTM y los 0,6 Mt de e-SAF exigidos para 2030. Ver `pendientes` en el archivo.
- `data/energy_carriers.json`: SAF e híbrido sin valores; batería solo a nivel de celda (falta un valor de paquete con fuente); el hidrógeno es la sustancia sin tanque.
- `docs/formulas.md`: referencias bibliográficas de Breguet y del hover.
- `data/aerodromo.json` (26/10/2026, escena 6): ver `pendientes` en el archivo. EASA PTS-VPT-DSN y el EB 105A ya se leyeron (27/10/2026). Falta la tabla de claves del Anexo 14 (hoy solo SKYbrary; icao.int bloquea el acceso automático) y la Resolución ANAC 550/2025 (si aprueba una segunda edición de la Parte 100).
- ReFuelEU: faltan las partes mínimas de 2035, 2040 y 2045. Están en el Anexo I del Reglamento (UE) 2023/2405, pero eur-lex y la página del Consejo piden una verificación de navegador y no se pueden leer desde el entorno: hay que copiarlas a mano del reglamento. Hasta cargarlas, el selector de año de la escena 6 las muestra sin verificar.
- Coordenadas de São Paulo (`data/cities.json`): SDWT y São Paulo Expo solo tienen agregadores; Santos Convention Center no tiene coordenadas publicadas y no aparece en el mapa.

## De los informes Aviacion2050 (Clasificación Tecnológica v01, 18/10/2026)
- Si la OACI integrará los vertipuertos en el Volumen II del Anexo 14 (no se leyó la fuente primaria).
- Flujo laminar híbrido (HLFC), vuelo en formación, abastecimiento de hidrógeno en aeropuertos y redes de carga para aviones eléctricos: sin hitos verificados.
- Nombre de la única planta de e-SAF en operación y estado de la especificación ASTM para SAF sin mezcla.
- La cifra de más de 20 % del rotor abierto (solo fuente secundaria) y el estado del X-66A en 2026.

## De la revisión técnica de herramientas (24/10/2026)
- Versiones actuales de Turf.js, D3, gltf-transform, Draco y KTX-Software.
- Soporte de CSS scroll-driven animations en Firefox estable (fuentes contradictorias).
- Condiciones vigentes de Kenney, Poly Haven, ambientCG y Google Fonts (OFL).

## Pedidos del usuario para más adelante
- 26/10/2026 — Hecho en el modelo de Blender: cabina con puesto de piloto, panel, cuatro asientos, puertas y ventanillas. La escena 5 la muestra en corte. Pedido original: el eVTOL tiene que tener cabina. Hoy los dos modelos (el de Blender en `tools/blender/build_evtol.py` y el paramétrico de la escena 3) tienen solo una burbuja de vidrio con asientos esquemáticos. Mejora propuesta: cabina completa en el modelo de Blender (puesto de piloto con panel de instrumentos, asientos de pasajeros, puertas y ventanillas), visible en corte en el hangar y en la escena 5. Sigue siendo un arquetipo genérico (regla 7 de `CLAUDE.md`).
