const puppeteer = require("puppeteer");

async function obtenerDatosETo(estacion_id, estacion_api) {
  console.log(
    "➡️ Ejecutando Crawler con ID:",
    estacion_id,
    "API:",
    estacion_api
  );

  const browser = await puppeteer.launch({ headless: "new" });

  let jsonEto = null;
  let jsonResumen = null;

  try {
    // 🟡 1. Página para ETo
    const pageEto = await browser.newPage();
    await pageEto.setRequestInterception(true);

    pageEto.on("request", (request) => request.continue());

    pageEto.on("response", async (response) => {
      const url = response.url();
      if (url.includes("items-ET.json")) {
        try {
          const json = await response.json();
          console.log("✅ Interceptado ETo:", url);
          jsonEto = json.find(
            (est) =>
              est.id === String(estacion_id) && est.api === String(estacion_api)
          );
        } catch (err) {
          console.error("❌ Error al parsear JSON ETo:", err);
        }
      }
    });

    await pageEto.goto("https://agrometeorologia.cl/evapotranspiracion/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await new Promise((resolve) => setTimeout(resolve, 6000));
    await pageEto.close();

    // 🟢 2. Página para resumen (precipitación)
    const pageResumen = await browser.newPage();
    await pageResumen.setRequestInterception(true);

    pageResumen.on("request", (request) => request.continue());

    pageResumen.on("response", async (response) => {
      const url = response.url();
      if (url.includes("items-resumen.json")) {
        try {
          const json = await response.json();
          console.log("✅ Interceptado Precipitación:", url);
          jsonResumen = json.find(
            (est) =>
              est.id === String(estacion_id) && est.api === String(estacion_api)
          );
        } catch (err) {
          console.error("❌ Error al parsear JSON Resumen:", err);
        }
      }
    });

    await pageResumen.goto("https://agrometeorologia.cl/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await new Promise((resolve) => setTimeout(resolve, 6000));
    await pageResumen.close();
  } catch (error) {
    console.error("❌ Error en Puppeteer:", error);
  } finally {
    await browser.close();
  }

  // 🔍 Validaciones
  if (!jsonEto || !jsonEto["STACK-DAY"]) {
    console.warn("⚠️ No se encontró información de ETo");
    return null;
  }

  const datosSemana = {};
  let totalETo = 0;

  for (const [fecha, valores] of Object.entries(jsonEto["STACK-DAY"])) {
    if (valores["ET-SUM"]) {
      const et = parseFloat(valores["ET-SUM"]);
      datosSemana[fecha] = et;
      totalETo += et;
    }
  }

  const fechas = Object.keys(datosSemana).sort();
  const semana_inicio = fechas[0];
  const semana_fin = fechas[fechas.length - 1];

  // Calcular precipitación desde jsonResumen (solo fechas válidas)
  let totalPrecipitacion = 0;

  if (jsonResumen && jsonResumen["STACK-DAY"]) {
    for (const [fecha, valores] of Object.entries(jsonResumen["STACK-DAY"])) {
      if (["ayer", "hoy", "manana", "pasado"].includes(fecha)) continue;

      if (valores["PP-SUM"]) {
        const pp = parseFloat(valores["PP-SUM"]);
        if (!isNaN(pp)) totalPrecipitacion += pp;
      }
    }
  }

  // ✅ Resultado combinado
  return {
    estacion: jsonEto.nombre,
    semana_inicio,
    semana_fin,
    fechas: datosSemana,
    totalETo: totalETo.toFixed(2),
    totalPrecipitacion: totalPrecipitacion.toFixed(2),
  };
}

async function obtenerClimaSemanal(estacion_id, estacion_api) {
  console.log(
    "📡 Obteniendo clima semanal para estación:",
    estacion_id,
    "-",
    estacion_api
  );

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  let resumenData = null;

  try {
    await page.setRequestInterception(true);

    page.on("request", (req) => req.continue());

    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("items-resumen.json") && !resumenData) {
        try {
          const json = await res.json();
          resumenData = json.find(
            (est) =>
              est.id === String(estacion_id) && est.api === String(estacion_api)
          );
          console.log("✅ JSON resumen interceptado");
        } catch (e) {
          console.error("❌ Error al leer JSON resumen:", e);
        }
      }
    });

    await page.goto("https://agrometeorologia.cl/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await new Promise((resolve) => setTimeout(resolve, 6000));
    await page.close();
    await browser.close();
  } catch (error) {
    console.error("❌ Error en Puppeteer:", error);
    await browser.close();
    return null;
  }

  if (!resumenData || !resumenData["STACK-DAY"]) {
    console.warn("⚠️ No se encontró información climática para la estación");
    return null;
  }

  const datos = [];

  for (const [fecha, valores] of Object.entries(resumenData["STACK-DAY"])) {
    if (["ayer", "hoy", "manana", "pasado"].includes(fecha)) continue;

    const tempMin = parseFloat(valores["TA-MIN"]);
    const tempMax = parseFloat(valores["TA-MAX"]);
    const precipitacion = parseFloat(valores["PP-SUM"]);

    if (!isNaN(tempMin) && !isNaN(tempMax)) {
      datos.push({
        fecha,
        temp_min: tempMin,
        temp_max: tempMax,
        temp_promedio: ((tempMin + tempMax) / 2).toFixed(2),
        precipitacion: !isNaN(precipitacion)
          ? parseFloat(precipitacion.toFixed(2))
          : 0,
      });
    }
  }

  return datos;
}

module.exports = {
  obtenerDatosETo,
  obtenerClimaSemanal,
};
