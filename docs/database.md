# 🗄️ Base de Datos - `iansa_riego`

La base de datos utilizada por el sistema se llama `iansa_riego` y está diseñada en **MySQL/MariaDB**. Contiene las entidades necesarias para modelar zonas de riego, usuarios, recomendaciones, consumo de agua, estaciones meteorológicas y temporadas.

---

## 🧱 Esquema General

```plaintext
📦 iansa_riego
├── usuarios
├── regiones
├── zonas
├── temporadas
├── recomendaciones
├── consumo_agua
├── crawler_cache
```

---

## 📋 Tablas Principales

### 🔐 `usuarios`

| Campo        | Tipo         | Descripción                        |
|--------------|--------------|------------------------------------|
| rut          | VARCHAR(12)  | Identificador único                |
| nombre       | VARCHAR(100) | Nombre completo                    |
| telefono     | VARCHAR(20)  | Teléfono de contacto               |
| correo       | VARCHAR(100) | Correo electrónico (login)         |
| tipo         | ENUM         | `administrador` / `tecnico`        |
| estado       | TINYINT      | 1 = Activo, 0 = Inactivo           |
| contrasenia  | TEXT         | Hash de contraseña                 |

---

### 🌎 `regiones` y `zonas`

**`regiones`** define agrupaciones geográficas.  
**`zonas`** representa áreas específicas de riego.

| Campo en zonas   | Tipo         | Descripción                       |
|------------------|--------------|-----------------------------------|
| id               | INT          | Identificador                     |
| nombre           | VARCHAR(100) | Nombre de la zona                 |
| region_id        | FK           | Relación a `regiones`             |
| estacion_id      | VARCHAR(50)  | ID de estación agrometeorológica |
| estacion_api     | VARCHAR(10)  | Fuente de datos (`INIA`, etc.)   |
| latitud          | DECIMAL      | Coordenada geográfica             |
| longitud         | DECIMAL      | Coordenada geográfica             |
| activa           | BOOLEAN      | Estado lógico                     |

---

### 📆 `temporadas`

| Campo        | Tipo         | Descripción                     |
|--------------|--------------|---------------------------------|
| id           | INT          | ID autoincremental              |
| nombre       | VARCHAR(100) | Ej: "Primavera 2025"            |
| fecha_inicio | DATE         | Inicio de temporada             |
| fecha_fin    | DATE         | Fin de temporada                |
| activa       | BOOLEAN      | Si está disponible para uso     |

---

### 💧 `consumo_agua`

Esta tabla guarda los datos semanales de consumo y ETo calculados o importados.

| Campo          | Tipo        | Descripción                           |
|----------------|-------------|----------------------------------------|
| zona_id        | FK          | Relación a `zonas`                     |
| semana_inicio  | DATE        | Fecha de inicio del periodo semanal    |
| semana_fin     | DATE        | Fecha de término del periodo semanal   |
| eto            | FLOAT       | Evapotranspiración potencial semanal   |
| kc             | FLOAT       | Coeficiente de cultivo                 |
| etc            | FLOAT       | Evapotranspiración del cultivo         |
| riego_aspersor | FLOAT       | Recomendación en litros                |
| riego_goteo    | FLOAT       | Recomendación en litros                |
| riego_pivote   | FLOAT       | Recomendación en litros                |
| precipitacion  | FLOAT       | Precipitación efectiva semanal         |
| temporada_id   | FK (opcional) | Asociada a una temporada              |

---

### 📈 `recomendaciones`

Guarda las recomendaciones generadas para riego basadas en ETo, kc y precipitación.

| Campo         | Tipo       | Descripción                          |
|---------------|------------|--------------------------------------|
| zona_id       | FK         | Relación con la zona                 |
| semana_inicio | DATE       | Semana analizada                     |
| semana_fin    | DATE       | Fin de semana                        |
| etc           | FLOAT      | ETc calculada                        |
| kc            | FLOAT      | Coeficiente utilizado                |
| precipitacion | FLOAT      | Precipitación total                  |
| riego_goteo   | FLOAT      | Recomendación en litros              |
| riego_pivote  | FLOAT      | Recomendación en litros              |
| riego_aspersor| FLOAT      | Recomendación en litros              |
| creado_en     | TIMESTAMP  | Fecha de creación                    |

---

### 📂 `crawler_cache`

Almacena los archivos JSON descargados diariamente desde el sitio de INIA.

| Campo     | Tipo    | Descripción                               |
|-----------|---------|-------------------------------------------|
| fecha     | DATE    | Día al que pertenece la descarga          |
| tipo      | VARCHAR | `items-ET` o `items-resumen`              |
| json_data | JSON    | Contenido del archivo original completo   |

---

## 🔐 Consideraciones de Seguridad

## 🔐 Consideraciones de Seguridad

- Las contraseñas se almacenan hasheadas.
- Acceso diferenciado por tipo de usuario (`tecnico`, `administrador`).
- Validaciones y filtros por zona y estado activo en el backend.

---

## 🧪 Posibles Mejoras

- Historial de ejecuciones del crawler.
- Trazabilidad de cambios en `zonas` y `usuarios`.
- Registro de recomendaciones manuales vs automáticas.

---

> Esta base de datos está pensada para escalar fácilmente en nuevos módulos como sensores, pagos o auditorías.