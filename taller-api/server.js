// taller-api/server.js (API REAL CONEXIÓN MYSQL)
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const app = express()
const PORT = 3000

// --- 1. CONFIGURACIÓN DE MYSQL (CREDENTIALES REALES) ---
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'C@tolica10', // Credencial actualizada
  database: 'taller_mecanico',
  connectionLimit: 10,
})

// Middlewares
app.use(cors())
app.use(express.json()) // Permite a Express leer el cuerpo JSON
app.use(express.urlencoded({ extended: true }))

// --- 2. ENDPOINTS DE LA API REAL ---

// A. LECTURA (GET): Obtener todos los coches
app.get('/api/coches', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM coches ORDER BY id DESC')
    res.json(rows)
  } catch (error) {
    console.error('Error al obtener coches:', error)
    res.status(500).json({ message: 'Error en el servidor al consultar la base de datos.' })
  }
})

// B. CREACIÓN (POST): Crear un nuevo coche
app.post('/api/coches', async (req, res) => {
  const { matricula, modelo, estado, mecanicoAsignado } = req.body
  try {
    const [result] = await db.execute(
      'INSERT INTO coches (matricula, modelo, estado, mecanicoAsignado) VALUES (?, ?, ?, ?)',
      [matricula, modelo, estado || 'Pendiente', mecanicoAsignado || null],
    )
    // Retorna el nuevo objeto incluyendo el ID generado por MySQL
    res.status(201).json({
      id: result.insertId,
      matricula,
      modelo,
      estado: estado || 'Pendiente',
      mecanicoAsignado: mecanicoAsignado || null,
    })
  } catch (error) {
    console.error('Error al insertar coche:', error)
    // Código 409: Conflicto (probable matrícula duplicada)
    res.status(409).json({ message: 'La matrícula ya existe o hay un error de datos.' })
  }
})

// C. MÉTRICAS (GET): Dashboard
app.get('/api/metricas', async (req, res) => {
  try {
    const [cochesEnTaller] = await db.query(
      "SELECT COUNT(*) AS total FROM coches WHERE estado NOT IN ('Listo para entrega')",
    )

    // Datos de mecánicos y servicios simulados para el Dashboard
    res.json({
      vehiculosEnTaller: cochesEnTaller[0].total,
      mecanicosDisponibles: 2, // Dato simulado
      serviciosPendientes: 7, // Dato simulado
    })
  } catch (error) {
    console.error('Error al obtener métricas:', error)
    res.status(500).json({ message: 'Error al consultar métricas.' })
  }
})

// D. LECTURA (GET): Obtener todos los mecánicos
app.get('/api/mecanicos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM mecanicos ORDER BY disponible DESC, nombre ASC')
    res.json(rows)
  } catch (error) {
    console.error('Error al obtener mecánicos:', error)
    res.status(500).json({ message: 'Error en el servidor al consultar mecánicos.' })
  }
})

// E. CREACIÓN (POST): Crear un nuevo mecánico
app.post('/api/mecanicos', async (req, res) => {
  const { nombre, especialidad, disponible } = req.body
  try {
    const [result] = await db.execute(
      'INSERT INTO mecanicos (nombre, especialidad, disponible) VALUES (?, ?, ?)',
      [nombre, especialidad, disponible === undefined ? true : disponible],
    )
    res
      .status(201)
      .json({ id: result.insertId, nombre, especialidad, disponible: disponible || true })
  } catch (error) {
    console.error('Error al insertar mecánico:', error)
    res.status(409).json({ message: 'Error al crear el mecánico.' })
  }
})

// F. ACTUALIZACIÓN (PUT): Actualizar el estado y/o asignación de un coche
app.put('/api/coches/:id', async (req, res) => {
  const { id } = req.params // Captura el ID desde la URL
  const { estado, mecanicoAsignado } = req.body // Captura los nuevos datos desde Vue

  try {
    // Construye la consulta de actualización
    const [result] = await db.execute(
      'UPDATE coches SET estado = ?, mecanicoAsignado = ? WHERE id = ?',
      [estado, mecanicoAsignado, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coche no encontrado.' })
    }

    // Retorna un mensaje de éxito
    res.status(200).json({ message: 'Coche actualizado con éxito.', id: id })
  } catch (error) {
    console.error('Error al actualizar coche:', error)
    res.status(500).json({ message: 'Error en el servidor al actualizar el coche.' })
  }
})

// --- 3. INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Backend API REAL corriendo en http://localhost:${PORT}`)
})
