require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const {
  obtenerDatosETo,
  obtenerClimaSemanal,
  procesarDatosETo,
  procesarClimaSemanal,
} = require("./crawlerINIA");
const { actualizarCache } = require("./cacheDaily");
const SALT_ROUNDS = 10;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authMiddleware = require("./authMiddleware");

const app = express();
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON
app.use(express.urlencoded({ extended: true }));

const net = require('net');
const socket = net.createConnection(3306, '10.38.208.2');
socket.on('connect', () => {
  console.log('✅ Conexión TCP exitosa a MySQL!');
  socket.end();
});
socket.on('error', err => {
  console.error('❌ Falló conexión TCP:', err);
});

// Configuración de la base de datos

// Si la variable DB_HOST no está definida, asumimos "localhost" para
// evitar fallos de conexión en desarrollo.
const dbHost = process.env.DB_HOST || "localhost";
const dbConfig = {
  host: dbHost,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

/*const dbConfig = dbHost.startsWith("/cloudsql")
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
*/
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("Error de conexión a la base de datos:", err.message);
    process.exit(1); // Sale explícitamente si no conecta
  } else {
    console.log("✅ Conectado a la base de datos MySQL");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  }
});

function leerCache(tipo) {
  return new Promise((resolve) => {
    const sql =
      "SELECT json_data FROM crawler_cache WHERE fecha = CURDATE() AND tipo = ?";
    db.query(sql, [tipo], (err, rows) => {
      if (err || rows.length === 0) return resolve(null);
      try {
        const data =
          typeof rows[0].json_data === "string"
            ? JSON.parse(rows[0].json_data)
            : rows[0].json_data;
        resolve(data);
      } catch {
        resolve(null);
      }
    });
  });
}

// Middleware para proteger rutas enteras
app.use("/usuarios", authMiddleware);

// Regiones

// Obtener todas las regiones activas
app.get("/regiones", (req, res) => {
  db.query('SELECT * FROM regiones WHERE estado = "activo"', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Obtener todas las regiones inactivas
app.get("/regiones/inactivas", (req, res) => {
  const sql =
    'SELECT id, nombre, estado FROM regiones WHERE estado = "inactivo"';

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener regiones inactivas:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener regiones inactivas" });
    }

    res.status(200).json(results);
  });
});

// Obtener una region por ID
app.get("/regiones/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM regiones WHERE id = ?", [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results[0]);
  });
});

// Crear una nueva region
app.post("/regiones", (req, res) => {
  const { nombre } = req.body;
  db.query(
    "INSERT INTO regiones (nombre) VALUES (?)",
    [nombre],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: result.insertId, nombre });
    }
  );
});

// Desactivar region por ID
app.put("/regiones/:id/desactivar", (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE regiones SET estado = "inactivo" WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Región desactivada correctamente" });
    }
  );
});

// Activar region por ID
app.put("/regiones/:id/activar", (req, res) => {
  const regionId = req.params.id;

  const sql = "UPDATE regiones SET estado = ? WHERE id = ?";

  db.query(sql, ["activo", regionId], (err, result) => {
    if (err) {
      console.error("Error al activar la región:", err);
      return res.status(500).json({ error: "Error al activar la región" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Región no encontrada" });
    }

    res.status(200).json({ message: "Región activada correctamente" });
  });
});

// Usuario

// Obtener usuarios activos
app.get("/usuarios", (req, res) => {
  db.query('SELECT * FROM usuarios WHERE estado = "activo"', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Obtener usuarios inactivos
app.get("/usuarios/inactivos", (req, res) => {
  db.query(
    'SELECT * FROM usuarios WHERE estado = "inactivo"',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Obener usuarios por rut
app.get("/usuarios/:rut", (req, res) => {
  const { rut } = req.params;
  db.query("SELECT * FROM usuarios WHERE rut = ?", [rut], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(results[0]);
  });
});

// Crear usuario
app.post("/usuarios", async (req, res) => {
  const { rut, nombre, telefono, correo, tipo, estado, contrasenia } = req.body;

  if (!rut || !nombre || !contrasenia) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(contrasenia, SALT_ROUNDS);
    const sql = `
      INSERT INTO usuarios (rut, nombre, telefono, correo, tipo, estado, contrasenia)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [rut, nombre, telefono, correo, tipo, estado, hash];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error al crear usuario:", err);
        if (err.code === "ER_DUP_ENTRY") {
          const campo = err.sqlMessage.includes("correo")
            ? "correo electrónico"
            : "RUT";
          return res
            .status(409)
            .json({ error: `${campo} ya se encuentra registrado` });
        }
        return res.status(500).json({ error: "Error al crear usuario" });
      }

      res.status(201).json({ message: "Usuario creado correctamente" });
    });
  } catch (error) {
    console.error("Error al hashear contraseña:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar usuario por rut
app.put("/usuarios/:rut", async (req, res) => {
  const { rut } = req.params;
  const { nombre, telefono, correo, tipo, estado, contrasenia } = req.body;

  try {
    const hash = await bcrypt.hash(contrasenia, SALT_ROUNDS);

    const sql = `
      UPDATE usuarios SET nombre = ?, telefono = ?, correo = ?, tipo = ?, estado = ?, contrasenia = ?
      WHERE rut = ?
    `;
    const values = [nombre, telefono, correo, tipo, estado, hash, rut];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error al editar usuario:", err);
        if (err.code === "ER_DUP_ENTRY") {
          const campo = err.sqlMessage.includes("correo")
            ? "correo electrónico"
            : "RUT";
          return res
            .status(409)
            .json({ error: `${campo} ya se encuentra registrado` });
        }
        return res
          .status(500)
          .json({ error: "Error al actualizar el usuario" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json({ message: "Usuario actualizado correctamente" });
    });
  } catch (error) {
    console.error("Error al hashear contraseña:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Desactivar usuario
app.put("/usuarios/:rut/desactivar", (req, res) => {
  const { rut } = req.params;
  const sql = 'UPDATE usuarios SET estado = "inactivo" WHERE rut = ?';
  db.query(sql, [rut], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Usuario desactivado correctamente" });
  });
});

// Activar usuario por ID
app.put("/usuarios/:rut/activar", (req, res) => {
  const usuarioRut = req.params.rut;

  const sql = "UPDATE usuarios SET estado = ? WHERE rut = ?";

  db.query(sql, ["activo", usuarioRut], (err, result) => {
    if (err) {
      console.error("Error al activar al usuario:", err);
      return res.status(500).json({ error: "Error al activar usuario" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrada" });
    }

    res.status(200).json({ message: "Usuario activado correctamente" });
  });
});

// Login
app.post("/login", (req, res) => {
  const { correo, contrasenia } = req.body;

  db.query(
    'SELECT * FROM usuarios WHERE correo = ? AND estado = "activo"',
    [correo],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (results.length === 0)
        return res
          .status(401)
          .json({ message: "Usuario no encontrado o inactivo" });

      const usuario = results[0];

      bcrypt.compare(contrasenia, usuario.contrasenia, (err, match) => {
        if (!match)
          return res.status(401).json({ message: "Contraseña incorrecta" });

        const token = jwt.sign(
          { rut: usuario.rut, tipo: usuario.tipo },
          process.env.JWT_SECRET,
          { expiresIn: "8h" }
        );

        res.json({ token, usuario });
      });
    }
  );
});

// Zonas

// Obtener todas las zonas
app.get("/zonas", (req, res) => {
  db.query("SELECT * FROM zonas", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Obtener zonas inactivas por región
app.get("/zonas/inactivas/:region_id", authMiddleware, (req, res) => {
  const { region_id } = req.params;
  const sql = 'SELECT * FROM zonas WHERE estado = "inactivo" AND region_id = ?';

  db.query(sql, [region_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Obtener zonas por región
app.get("/zonas/region/:region_id", (req, res) => {
  const { region_id } = req.params;
  const sql = 'SELECT * FROM zonas WHERE region_id = ? AND estado = "activo"';
  db.query(sql, [region_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Obener zonas por id
app.get("/zonas/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM zonas WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ error: "Zona no encontrada" });
    res.json(results[0]);
  });
});

// Crear nueva zona
app.post("/zonas", authMiddleware, (req, res) => {
  const {
    nombre,
    region_id,
    estacion,
    coordenadas,
    estacion_id,
    estacion_api,
  } = req.body;

  if (!nombre || !region_id || !estacion || !coordenadas) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const sql =
    "INSERT INTO zonas (nombre, region_id, estacion, coordenadas, estacion_id, estacion_api) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [nombre, region_id, estacion, coordenadas, estacion_id, estacion_api],
    (err, result) => {
      if (err) {
        console.error("Error al crear zona:", err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: result.insertId,
        nombre,
        region_id,
        estacion,
        coordenadas,
        estacion_id,
        estacion_api,
      });
    }
  );
});

// Desactivar zona por ID
app.put("/zonas/:id/desactivar", authMiddleware, (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE zonas SET estado = "inactivo" WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al desactivar la zona:", err);
      return res.status(500).json({ error: "Error al desactivar la zona" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Zona no encontrada" });
    }

    res.status(200).json({ message: "Zona desactivada correctamente" });
  });
});

// Reactivar zona por ID
app.put("/zonas/:id/activar", authMiddleware, (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE zonas SET estado = "activo" WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Zona no encontrada" });
      res.json({ message: "Zona activada correctamente" });
    }
  );
});

// Editar zona por ID
app.put("/zonas/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    estado,
    region_id,
    estacion,
    coordenadas,
    estacion_id,
    estacion_api,
  } = req.body;

  const sql = `
    UPDATE zonas SET nombre = ?, estado = ?, region_id = ?, estacion = ?, coordenadas = ?, estacion_id = ?, estacion_api = ? WHERE id = ?
    `;

  const values = [
    nombre,
    estado,
    region_id,
    estacion,
    coordenadas,
    estacion_id,
    estacion_api,
    id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al editar zona:", err);
      return res.status(500).json({ error: "Error al actualizar la zona" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Zona no encontrada" });
    }

    res.status(200).json({ message: "Zona actualizada correctamente" });
  });
});

// Información desde INIA

// Ejecutar la actualización diaria de caché manualmente
app.post("/api/cache-daily", async (_req, res) => {
  try {
    await actualizarCache();
    res.json({ message: "Caché actualizada" });
  } catch (err) {
    console.error("❌ Error al actualizar caché:", err);
    res.status(500).json({ error: err.message || "Error al actualizar caché" });
  }
});

// Endpoint para obtener datos ETo desde estación
app.get("/api/eto", async (req, res) => {
  const { estacion_id, estacion_api } = req.query;

  if (!estacion_id || !estacion_api) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros: estacion_id o estacion_api" });
  }

  try {
    const jsonEto = await leerCache("items-ET");
    const jsonResumen = await leerCache("items-resumen");
    let resultado = null;
    if (jsonEto && jsonResumen) {
      resultado = procesarDatosETo(
        jsonEto,
        jsonResumen,
        estacion_id,
        estacion_api
      );
    }
    if (!resultado) {
      resultado = await obtenerDatosETo(estacion_id, estacion_api);
    }
    res.json(resultado);
  } catch (error) {
    console.error("❌ Error al obtener datos ETo:", error);
    res
      .status(500)
      .json({ error: error.message || "No se pudieron obtener los datos ETo" });
  }
});

// Obtener los consumos de agua por zona
app.get("/zonas/:zonaId/consumo-agua", (req, res) => {
  const { zonaId } = req.params;
  const sql =
    "SELECT * FROM consumo_agua WHERE id_zona = ? ORDER BY semana_inicio DESC";

  db.query(sql, [zonaId], (err, results) => {
    if (err) {
      console.error("Error al obtener consumo de agua:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener consumo de agua" });
    }

    res.json(results);
  });
});

function redondearEntero(valor) {
  return Math.round(valor);
}
// Registrar consumo de agua en una zona
app.post("/zonas/:zonaId/consumo-agua", (req, res) => {
  const { zonaId } = req.params;
  const {
    semana_inicio,
    semana_fin,
    eto,
    precipitacion,
    kc,
    etc,
    consumo_pivote,
    consumo_cobertura,
    consumo_carrete,
    consumo_aspersor,
    id_temporada,
  } = req.body;
  const sql = `
        INSERT INTO consumo_agua 
        (id_zona, semana_inicio, semana_fin, eto, precipitacion, kc, etc, consumo_pivote, consumo_cobertura, consumo_carrete, consumo_aspersor, id_temporada)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  db.query(
    sql,
    [
      zonaId,
      semana_inicio,
      semana_fin,
      redondearEntero(eto),
      redondearEntero(precipitacion),
      kc,
      redondearEntero(etc),
      redondearEntero(consumo_pivote),
      redondearEntero(consumo_cobertura),
      redondearEntero(consumo_carrete),
      redondearEntero(consumo_aspersor),
      id_temporada,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Error al registrar consumo de agua:", err);
        return res
          .status(500)
          .json({ error: "Error al registrar consumo de agua" });
      }

      res.status(201).json({
        message: "Consumo de agua registrado correctamente",
        id: result.insertId,
      });
    }
  );
});

// Editar consumo de agua por ID
app.put("/zonas/:zonaId/consumo-agua/:consumoId", (req, res) => {
  const { zonaId, consumoId } = req.params;
  const {
    semana_inicio,
    semana_fin,
    eto,
    precipitacion,
    kc,
    etc,
    consumo_pivote,
    consumo_cobertura,
    consumo_carrete,
    consumo_aspersor,
    id_temporada,
  } = req.body;

  const sql = `
        UPDATE consumo_agua SET
        semana_inicio = ?, semana_fin = ?, eto = ?, precipitacion = ?, kc = ?, etc = ?,
        consumo_pivote = ?, consumo_cobertura = ?, consumo_carrete = ?, consumo_aspersor = ?,
        id_temporada = ?
        WHERE id = ?
    `;

  db.query(
    sql,
    [
      semana_inicio,
      semana_fin,
      redondearEntero(eto),
      redondearEntero(precipitacion),
      kc,
      redondearEntero(etc),
      redondearEntero(consumo_pivote),
      redondearEntero(consumo_cobertura),
      redondearEntero(consumo_carrete),
      redondearEntero(consumo_aspersor),
      id_temporada,
      consumoId,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Error al actualizar consumo de agua:", err);
        return res
          .status(500)
          .json({ error: "Error al actualizar consumo de agua" });
      }

      res
        .status(200)
        .json({ message: "Consumo de agua actualizado correctamente" });
    }
  );
});

// Eliminar consumo de agua por ID
app.delete("/zonas/:zonaId/consumo-agua/:consumoId", (req, res) => {
  const { zonaId, consumoId } = req.params;

  const sql = "DELETE FROM consumo_agua WHERE id = ?";

  db.query(sql, [consumoId], (err, result) => {
    if (err) {
      console.error("❌ Error al eliminar consumo de agua:", err);
      return res
        .status(500)
        .json({ error: "Error al eliminar consumo de agua" });
    }

    res
      .status(200)
      .json({ message: "Consumo de agua eliminado correctamente" });
  });
});

// Obtener datos de eto y consumo diario por zona
app.get("/zonas/:zonaId/eto-consumo-dia", (req, res) => {
  const { zonaId } = req.params;
  const sql =
    "SELECT * FROM eto_consumo_dia WHERE id_zona = ? ORDER BY fecha ASC";

  db.query(sql, [zonaId], (err, results) => {
    if (err) {
      console.error("Error al obtener datos eto_consumo_dia:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener datos eto_consumo_dia" });
    }

    res.json(results);
  });
});

// Registrar eto y consumos diarios de una zona
app.post("/zonas/:zonaId/eto-consumo-dia", (req, res) => {
  const { zonaId } = req.params;
  const {
    fecha,
    eto,
    kc,
    consumo_pivote,
    consumo_cobertura,
    consumo_carrete,
    consumo_aspersor,
    id_temporada,
  } = req.body;

  const checkSql =
    "SELECT 1 FROM eto_consumo_dia WHERE id_zona = ? AND fecha = ?";

  db.query(checkSql, [zonaId, fecha], (err, rows) => {
    if (err) {
      console.error("❌ Error al verificar eto_consumo_dia:", err);
      return res
        .status(500)
        .json({ error: "Error al verificar eto_consumo_dia" });
    }

    if (rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Ya existe registro para esta fecha" });
    }

    const insertSql = `
        INSERT INTO eto_consumo_dia
        (id_zona, id_temporada, fecha, eto, kc, consumo_pivote, consumo_cobertura, consumo_carrete, consumo_aspersor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    db.query(
      insertSql,
      [
        zonaId,
        id_temporada,
        fecha,
        redondearEntero(eto),
        kc,
        redondearEntero(consumo_pivote),
        redondearEntero(consumo_cobertura),
        redondearEntero(consumo_carrete),
        redondearEntero(consumo_aspersor),
      ],
      (err, result) => {
        if (err) {
          console.error("❌ Error al registrar eto_consumo_dia:", err);
          return res
            .status(500)
            .json({ error: "Error al registrar eto_consumo_dia" });
        }

        res.status(201).json({
          message: "ETo diario registrado correctamente",
          id: result.insertId,
        });
      }
    );
  });

  // Eliminar registro de ETo diario
  app.delete("/zonas/:zonaId/eto-consumo-dia/:id", (req, res) => {
    const { zonaId, id } = req.params;
    const sql =
      "DELETE FROM eto_consumo_dia WHERE id_eto_dia = ? AND id_zona = ?";

    db.query(sql, [id, zonaId], (err) => {
      if (err) {
        console.error("❌ Error al eliminar eto_consumo_dia:", err);
        return res
          .status(500)
          .json({ error: "Error al eliminar eto_consumo_dia" });
      }

      res.json({ message: "ETo diario eliminado correctamente" });
    });
  });
});

// Obtener datos climaticos por zona
app.get("/zonas/:zonaId/clima-semanal", (req, res) => {
  const { zonaId } = req.params;
  const sql = "SELECT * FROM clima_dia WHERE id_zona = ? ORDER BY fecha DESC";

  db.query(sql, [zonaId], (err, results) => {
    if (err) {
      console.error("Error al obtener datos climaticos:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener datos climaticos" });
    }

    res.json(results);
  });
});

// Endpoint para obtener clima semanal desde agrometeorologia.cl
app.get("/api/clima-semanal", async (req, res) => {
  const { estacion_id, estacion_api } = req.query;

  if (!estacion_id || !estacion_api) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros: estacion_id o estacion_api" });
  }

  try {
    const jsonResumen = await leerCache("items-resumen");
    let datos = null;
    if (jsonResumen) {
      datos = procesarClimaSemanal(jsonResumen, estacion_id, estacion_api);
    }
    if (!datos || datos.length === 0) {
      datos = await obtenerClimaSemanal(estacion_id, estacion_api);
    }
    if (!datos || datos.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontraron datos climáticos" });
    }

    res.json(datos);
  } catch (error) {
    console.error("❌ Error en /api/clima-semanal:", error);
    res
      .status(500)
      .json({ error: "Error interno al obtener datos climáticos" });
  }
});

// Registrar clima semanal de una zona
app.post("/zonas/:id/clima-semanal", (req, res) => {
  const { id } = req.params;
  const {
    fecha,
    ta_min,
    ta_max,
    ta_prom,
    precipitacion,
    id_temporada,
    grados_dia,
  } = req.body;

  const checkSql = `
        SELECT * FROM clima_dia 
        WHERE id_zona = ? AND fecha = ?
    `;

  db.query(checkSql, [id, fecha], (err, rows) => {
    if (err) {
      console.error("❌ Error al verificar existencia de clima:", err);
      return res
        .status(500)
        .json({ error: "Error al verificar clima existente" });
    }

    if (rows.length > 0) {
      console.warn("⚠️ Registro ya existe para esta fecha y zona");
      return res
        .status(409)
        .json({ message: "Ya existe clima registrado para esta fecha" });
    }

    const insertSql = `
            INSERT INTO clima_dia 
            (id_zona, fecha, ta_min, ta_max, ta_prom, precipitacion, id_temporada, grados_dia)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

    db.query(
      insertSql,
      [
        id,
        fecha,
        redondearEntero(ta_min),
        redondearEntero(ta_max),
        redondearEntero(ta_prom),
        redondearEntero(precipitacion),
        id_temporada,
        redondearEntero(grados_dia),
      ],
      (err, result) => {
        if (err) {
          console.error("❌ Error al registrar clima semanal:", err);
          return res
            .status(500)
            .json({ error: "Error al registrar clima semanal" });
        }

        res.status(201).json({
          message: "Clima semanal registrado correctamente",
          id: result.insertId,
        });
      }
    );
  });
});

// Eliminar clima semanal por ID
app.delete("/zonas/:zonaId/clima-semanal/:climaId", (req, res) => {
  const { zonaId, climaId } = req.params;
  const sql = "DELETE FROM clima_dia WHERE id = ? AND id_zona = ?";

  db.query(sql, [climaId, zonaId], (err) => {
    if (err) {
      console.error("❌ Error al eliminar clima:", err);
      return res.status(500).json({ error: "Error al eliminar clima" });
    }

    res.json({ message: "Clima eliminado correctamente" });
  });
});

// Endpoints Temporadas

// Crear temporadas
app.post("/temporadas", authMiddleware, (req, res) => {
  const { nombre, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const sql = `
    INSERT INTO temporadas (nombre, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, 'activa')
    `;
  db.query(sql, [nombre, fecha_inicio, fecha_fin], (err, result) => {
    if (err) {
      console.error("❌ Error al crear temporada:", err);
      return res.status(500).json({ error: "Error al crear temporada" });
    }

    res.status(201).json({ message: "Temporada creada", id: result.insertId });
  });
});

// Ver temporadas
// Todas
app.get("/temporadas", (req, res) => {
  const sql = "SELECT * FROM temporadas ORDER BY id DESC";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Error al obtener temporadas:", err);
      return res.status(500).json({ error: "Error al obtener temporadas" });
    }
    res.json(rows);
  });
});

// Solo activas
app.get("/temporadas/activas", (req, res) => {
  const sql = 'SELECT * FROM temporadas WHERE estado = "activa"';
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Error al obtener temporadas activas:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener temporadas activas" });
    }
    res.json(rows);
  });
});

// Desactivar temporada
app.put("/temporadas/:id/desactivar", authMiddleware, (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE temporadas SET estado = "inactiva" WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error al desactivar temporada:", err);
      return res.status(500).json({ error: "Error al desactivar temporada" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Temporada no encontrada" });
    }

    res.json({ message: "Temporada desactivada" });
  });
});

// Activar temporada
app.put("/temporadas/:id/activar", authMiddleware, (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE temporadas SET estado = "activa" WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error al activar temporada:", err);
      return res.status(500).json({ error: "Error al activar temporada" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Temporada no encontrada" });
    }

    res.json({ message: "Temporada activada" });
  });
});
