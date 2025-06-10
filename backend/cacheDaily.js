const mysql = require('mysql2/promise');
const puppeteer = require('puppeteer');
require('dotenv').config();

// Páginas de origen utilizadas para interceptar los JSON
const ET_URL =
  process.env.ET_URL ||
  'https://agrometeorologia.cl/evapotranspiracion/';
const RESUMEN_URL = process.env.RESUMEN_URL || 'https://agrometeorologia.cl/';

// Configuracion similar a server.js
const dbHost = process.env.DB_HOST || 'localhost';
const dbConfig = dbHost.startsWith('/cloudsql')
  ? {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      socketPath: dbHost,
    }
  : {
      host: dbHost,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

async function capturarJson(pageUrl, marker) {
  const browser = await puppeteer.launch({ headless: 'new' });
  let data = null;
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => req.continue());
    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes(marker)) {
        try {
          data = await res.json();
        } catch (err) {
          console.error(`Error al leer ${marker}:`, err.message);
        }
      }
    });
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await page.close();
  } finally {
    await browser.close();
  }
  if (!data) {
    throw new Error(`No se obtuvo ${marker}`);
  }
  return data;
}

async function actualizarCache() {
  const conn = await mysql.createConnection(dbConfig);
  const hoy = new Date().toISOString().slice(0, 10);

  const archivos = [
    { tipo: 'items-ET', page: ET_URL, marker: 'items-ET.json' },
    { tipo: 'items-resumen', page: RESUMEN_URL, marker: 'items-resumen.json' },
  ];

  const errores = [];
  for (const a of archivos) {
    try {
      const data = await capturarJson(a.page, a.marker);
      await conn.execute(
        'REPLACE INTO crawler_cache(fecha,tipo,json_data) VALUES (?,?,?)',
        [hoy, a.tipo, JSON.stringify(data)]
      );
      console.log(`✅ Cache actualizado ${a.tipo}`);
    } catch (err) {
      errores.push(`${a.tipo}: ${err.message}`);
      console.error(`Error al descargar ${a.tipo}:`, err.message);
    }
  }

  await conn.end();
  if (errores.length > 0) {
    throw new Error('Fallos al actualizar caché - ' + errores.join(' | '));
  }
}

module.exports = { actualizarCache };

if (require.main === module) {
  actualizarCache().catch((e) => {
    console.error('Fallo general:', e);
    process.exit(1);
  });
}
