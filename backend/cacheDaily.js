const mysql = require('mysql2/promise');
require('dotenv').config();

// URLs de origen - ajustar si cambian en el sitio oficial
const ET_URL = 'https://agrometeorologia.cl/evapotranspiracion/items-ET.json';
const RESUMEN_URL = 'https://agrometeorologia.cl/items-resumen.json';

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

async function actualizarCache() {
  const conn = await mysql.createConnection(dbConfig);
  const hoy = new Date().toISOString().slice(0, 10);

  const archivos = [
    { tipo: 'items-ET', url: ET_URL },
    { tipo: 'items-resumen', url: RESUMEN_URL },
  ];

  for (const a of archivos) {
    try {
      const res = await fetch(a.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.text();
      await conn.execute(
        'REPLACE INTO crawler_cache(fecha,tipo,json_data) VALUES (?,?,?)',
        [hoy, a.tipo, data]
      );
      console.log(`✅ Cache actualizado ${a.tipo}`);
    } catch (err) {
      console.error(`Error al descargar ${a.tipo}:`, err.message);
    }
  }
  await conn.end();
}

actualizarCache().catch((e) => {
  console.error('Fallo general:', e);
  process.exit(1);
});
