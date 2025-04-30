# 🤖 Crawler INIA - Recolección de Datos Agroclimáticos

El archivo `crawlerINIA.js` es un módulo que se encarga de obtener **datos semanales de ETo y precipitación** desde el sitio web de [agrometeorologia.cl](https://agrometeorologia.cl). Esta información es esencial para generar **recomendaciones de riego** precisas.

---

## 🧩 Tecnologías Usadas

- `puppeteer`: automatiza la navegación en sitios web para simular un usuario real.
- `cheerio`: permite hacer scraping de forma similar a jQuery (si se necesitara).
- JSON remoto: se extraen datos desde el API pública de estaciones con estructura `STACK-DAY`.

---

## 🧠 Lógica General del Crawler

1. Se recibe el `estacion_id` y `estacion_api` como parámetros desde el frontend.
2. Se navega al sitio y se selecciona la estación meteorológica correspondiente.
3. Se obtiene el JSON con los valores diarios de ETo y Precipitación. 
4. Se extraen:
   - Fechas
   - Suma total de ETo (`EToTotal`)
   - Total de precipitación
   - Semana de inicio y fin (`semana_inicio`, `semana_fin`)
5. Se devuelve un objeto JSON con los resultados listos para ser utilizados por el frontend.

---

## 📦 Archivo `crawlerINIA.js`

### Funciones exportadas

- `obtenerDatosETo(estacion_id, estacion_api)` → para `/api/eto`
- `obtenerClimaSemanal(estacion_id, estacion_api)` → para `/api/clima-semanal`

Ambas funciones son utilizadas desde `server.js` como middlewares de endpoints GET.

---

## 🔌 Ejemplo de Consumo

Desde Angular (servicio `CrawlerService`):

```ts
this.http.get(`/api/eto?estacion_id=1234&estacion_api=INIA`).subscribe(...)
```

Desde backend (en `server.js`):

```js
const { obtenerDatosETo } = require("./crawlerINIA");
app.get("/api/eto", async (req, res) => {
  const data = await obtenerDatosETo(estacion_id, api);
  res.json(data);
});
```

---

## 🚧 Consideraciones

- Algunas estaciones requieren esperar a que el formulario se procese. Se maneja con `waitForSelector()`.
- Si faltan muchos valores de ETo, el sistema los reemplaza por el promedio (máximo 2 datos faltantes).
- Si hay más de 2 valores faltantes, el sistema cancela la generación automática y sugiere ingresar manualmente.
- El JSON interceptado de INIA entrega valores de los últimos 7 días.

---

## 🧪 Próximas Mejoras

- Cache de resultados para evitar múltiples scrapes en un mismo día.
- Validaciones extras para estaciones nuevas.
- Registro de logs de uso del crawler.
- Usar una API proporcionada directamente por INIA