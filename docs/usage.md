# 📘 Guía de Uso del Sistema de Riego

Esta sección detalla cómo utilizar la plataforma web de gestión de consumo de agua, desde el inicio de sesión hasta la generación de recomendaciones.

---

## 🔐 1. Iniciar Sesión

- Haz clic en el botón ☰ y luego en "Iniciar Sesión".
- Ingresa tu **correo** y **contraseña**.
- Solo los usuarios **activos** pueden ingresar.

Tipos de usuario:

- 👨‍💼 Administrador: acceso completo (usuarios, zonas, regiones).

- 👷 Técnico: acceso restringido (zonas, clima, consumo).

---

## 🌍 2. Gestión de Regiones y Zonas

### Regiones

- Desde el menú lateral, selecciona **Regiones**.
- Puedes ver una lista con el nombre y cantidad de zonas asociadas.

### Zonas

- En la vista de una región, verás la lista de zonas asociadas.
- Acciones disponibles:
  - Crear nueva zona
  - Desactivar zona (solo admin)
  - Ver detalles de zona (redirige a ZonaView)

---

## 📍 3. Vista de Zona (`ZonaView`)

Al ingresar a una zona, accedes a la sección central del sistema:

### Paneles disponibles:

#### 1. 🔢 **Datos Generales**
- Información de nombre, estación meteorológica, coordenadas.

#### 2. 📊 **Consumo de Agua Semanal**
- Visualiza ETo, kc, ETc, precipitaciones y consumo por tipo de riego.
- Exportación a Excel

#### 3. 🧮 **Generar Recomendación**
- Ingreso manual del kc
- Obtención automática de datos de ETo mediante crawler
- Validación de datos faltantes
- Previsualización antes de guardar

#### 4. 🌦️ **Clima Semanal**
- Vista previa de temperaturas y humedad
- Ingreso desde estación INIA o DMC
- Modal interactivo para revisión y guardado
- Exportación a Excel

#### 5. 📈 **Gráficos**
- Grados Día Acumulado (por temporada o total)
- Exportación a imagen

---

## 👤 4. Gestión de Usuarios

Solo visible para **administradores**.

- Crear, editar y desactivar usuarios
- Validaciones automáticas: RUT, correo, teléfono, contraseña

---

## 🔁 5. Flujo del Crawler

1. El administrador presiona "Generar recomendación"
2. Se ejecuta el crawler (Puppeteer) en backend
3. Se obtienen ETo y fechas desde la estación
4. Se validan datos (máximo 2 faltantes con promedio)
5. Se muestra previsualización
6. Usuario guarda recomendación manualmente

---

## 💡 6. Recomendaciones

- Revisa la estación configurada en cada zona
- Ingresa kc antes de generar recomendaciones
- Usa la vista de clima para comparar con años anteriores
- Exporta los datos para informes agrícolas

---

> Esta plataforma está pensada para facilitar la toma de decisiones en el riego técnico agrícola, asegurando eficiencia hídrica y respaldo en datos climáticos confiables.