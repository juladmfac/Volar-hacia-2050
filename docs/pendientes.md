# Pendientes de verificar

Lo que figura acá no se resuelve de memoria: se resuelve con una fuente y se pasa a `data/`.

## Fuentes a releer
El 27/10/2026, con la red abierta, se releyeron las 100 fuentes que estaban confirmadas solo vía buscador o citadas por los informes (185 usos en `data/`). 128 usos quedaron como `verificacion: "lectura"`. Se registró un conflicto (sobrecosto del SAF de 2025: 2.900 o 3.600 millones de USD según el documento de IATA). Lo que sigue sin confirmar, y por qué:

- icao.int pide verificación de navegador. (aerodromo.json: ala_plegable/envergadura_plegada_m; aerodromo.json: ala_plegable/envergadura_vuelo_m; saf.json: metas/0/combustibles_pct)
- FlightGlobal: muro de pago; solo se ve el titular (777-9 habilitado para la siguiente fase de certificación, 7/6/2026). (aerodromo.json: ala_plegable/estado)
- www2023.icao.int no responde. (aerodromo.json: ala_plegable/norma)
- gov.br devuelve una página sin las coordenadas; el PDF no bajó. (cities.json: ciudades/0/sitios_coordenadas/0/coordenadas)
- helis.com pide verificación de navegador. (cities.json: ciudades/0/sitios_coordenadas/2/coordenadas)
- businesswire no responde. (energy_carriers.json: portadores/0/energia_especifica)
- ir.ehang.com pide verificación de navegador. (energy_carriers.json: portadores/0/estado_uso_evtol; vehicles.json: vehiculos/0/certificacion; vehicles.json: vehiculos/0/estado; vehicles.json: vehiculos/0/hitos/2)
- La página del DOE no muestra 120 MJ/kg: solo dice que el hidrógeno tiene la mayor energía por masa. (energy_carriers.json: portadores/1/energia_especifica)
- La página del DOE no muestra la cifra de energía por volumen. (energy_carriers.json: portadores/1/densidad_energetica_volumetrica)
- FlightGlobal: muro de pago. (propulsion.json: programas/8/hito; propulsion.json: programas/8/proximo; tecnologias.json: tecnologias/17/hito)
- Aviation Week (18/07/2026) confirma el módulo frontal a escala real, pero no menciona el vuelo con Airbus en 2029: habla de ensayos en tierra y en vuelo «para 2030». (propulsion.json: programas/8/proximo)
- La página de Airbus de 2025 no carga su contenido en el texto descargado. (propulsion.json: programas/10/hito; propulsion.json: programas/10/proximo)
- nasdaq.com no responde. (propulsion.json: programas/12/hito; propulsion.json: programas/12/proximo; tecnologias.json: tecnologias/45/hito)
- El comunicado de IATA no menciona el 6 % de ReFuelEU para 2030 (el dato está confirmado en el Anexo I del reglamento). (propulsion.json: programas/13/proximo)
- Boom dice «2026 sprint core engine test», sin precisar «comienzos de 2026». (propulsion.json: programas/14/proximo)
- El comunicado de IATA dice «hasta cinco veces» el precio del combustible fósil; el rango «2 a 5 veces» figura en el informe completo según la prensa. (saf.json: precio_relativo)
- consilium.europa.eu pide verificación de navegador. (saf.json: mandatos/0/saf_pct/0; saf.json: mandatos/0/saf_pct/1; saf.json: mandatos/0/saf_pct/5; saf.json: mandatos/0/sintetico_pct/4)
- austrianairlines.ag pide verificación de navegador. (tecnologias.json: tecnologias/10/hito)
- La página de la NASA no muestra en el texto descargado el modelo de 40 pulgadas, la fecha ni los 15 vuelos. (tecnologias.json: tecnologias/13/hito)
- airbus.com bloqueó la descarga (Incapsula). (tecnologias.json: tecnologias/18/hito; tecnologias.json: tecnologias/36/hito)
- La nota de WFAE trata el préstamo para el Z4; no confirma el primer vuelo del Jet1 en 2027. (tecnologias.json: tecnologias/20/hito)
- safran-group.com pide verificación de navegador. (tecnologias.json: tecnologias/21/hito; tecnologias.json: tecnologias/31/hito)
- axios.com pide verificación de navegador. (tecnologias.json: tecnologias/22/hito)
- La presentación de la NASA confirma 5–10 % de menor consumo; no se encontró el núcleo en banco a fines de 2028. (tecnologias.json: tecnologias/27/hito)
- La página del HyTEC no muestra en el texto descargado que el proyecto haya concluido. (tecnologias.json: tecnologias/27/hito)
- La página de CFM no tiene el texto en la descarga. (tecnologias.json: tecnologias/28/hito)
- El PDF de Pipistrel no tiene texto extraíble. (tecnologias.json: tecnologias/32/hito)
- Aerospace America: no aparece en el texto descargado la meta de la Parte 23 a fines de 2026. (tecnologias.json: tecnologias/33/hito)
- satnews redirige y no entrega el texto. (tecnologias.json: tecnologias/40/hito)
- aeromorning.com pide verificación de navegador. (tecnologias.json: tecnologias/47/hito)
- La página del EH216-S no dice «multicóptero» en el texto; la configuración se ve en las imágenes. (vehicles.json: vehiculos/0/configuracion)
- investors.archer.com pide verificación de navegador. (vehicles.json: vehiculos/2/asientos; vehicles.json: vehiculos/2/certificacion; vehicles.json: vehiculos/2/estado; vehicles.json: vehiculos/2/hitos/0)
- La página de WAM no trae el texto del artículo en la descarga. (vehicles.json: vehiculos/2/certificacion; vehicles.json: vehiculos/2/estado; vehicles.json: vehiculos/2/hitos/0)

Los sitios que piden verificación de navegador (icao.int, consilium.europa.eu, eur-lex, ir.ehang.com, investors.archer.com, safran-group.com y otros) no se abren desde el entorno: hay que guardar la página a mano, como se hizo con el Reglamento ReFuelEU y la Resolución ANAC 550/2025.

## Datos de la app
- `data/cities.json`, São Paulo: el rol y el estado no tienen fuente; los vertipuertos anunciados solo tienen fuentes secundarias (falta el comunicado de UrbanV) y un conflicto de cantidad (5 vertipuertos o hasta 7 FBO).
- Guangzhou/Shenzhen y Dubái/Abu Dabi: todos los puntos de `pendientes` en `data/cities.json`.
- `data/vehicles.json`: los `pendientes` de cada vehículo (hoja técnica de EHang, alcance de Joby, clasificación del Archer Midnight "12 tilt 6", fuente primaria de Eve).
- `data/tecnologias.json` (26/10/2026): generado desde la Clasificación v01 con `tools/informes/clasificacion_a_json.py`. Los hitos llevan las fuentes del informe sin releer (`verificacion: "informe"`); 15 hitos no tienen URL pública en ningún informe y quedan sin verificar (ver `pendientes` en el archivo).
- `data/saf.json`: ReFuelEU quedó leído el 27/10/2026 en el Anexo I del Reglamento (UE) 2023/2405 (copia guardada por el autor, porque eur-lex pide verificación de navegador), la página de la Comisión y el Informe Técnico Anual 2026 de EASA (2 %, 6 %, 70 %, 35 % de sintéticos en 2050, 0,7 % anual y 1,2 % promedio 2030–2031 de sintéticos, 2,79 % entregado en 2025). El resto de sus fuentes sigue confirmado solo vía buscador; además, el reparto de ATAG (38 a 58 %, Informe v04 §3.4), las 11 rutas ASTM y los 0,6 Mt de e-SAF exigidos para 2030. Ver `pendientes` en el archivo.
- `data/energy_carriers.json`: SAF e híbrido sin valores; batería solo a nivel de celda (falta un valor de paquete con fuente); el hidrógeno es la sustancia sin tanque.
- `docs/formulas.md`: referencias bibliográficas de Breguet y del hover.
- `data/aerodromo.json` (26/10/2026, escena 6): ver `pendientes` en el archivo. EASA PTS-VPT-DSN y el EB 105A ya se leyeron (27/10/2026). Falta la tabla de claves del Anexo 14 (hoy solo SKYbrary; icao.int bloquea el acceso automático). La Resolución ANAC 550/2025 ya se leyó: deroga la 319/2025 y aprueba la segunda edición de la Parte 100 y las Partes 101 y 102; faltan sus anexos.
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
