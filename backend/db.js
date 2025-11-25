const mysql = require('mysql2/promise');

// Configuración del pool usando variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false, // para probar rápido; más seguro es usar el CA de Cloud SQL
  },
});

// Salida temprana para verificar conectividad al iniciar el contenedor
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Pool MySQL inicializado correctamente');
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error.message);
  }
})();

// Helper para usar callbacks existentes o Promesas con async/await
function query(sql, params = [], callback) {
  const hasCallback = typeof callback === 'function' || typeof params === 'function';
  const finalCallback = typeof params === 'function' ? params : callback;
  const finalParams = typeof params === 'function' ? [] : params;

  const promise = pool.query(sql, finalParams);

  if (hasCallback) {
    promise
      .then(([rows, fields]) => finalCallback(null, rows, fields))
      .catch((err) => finalCallback(err));
    return undefined;
  }

  return promise.then(([rows]) => rows);
}

module.exports = {
  pool,
  query,
};
