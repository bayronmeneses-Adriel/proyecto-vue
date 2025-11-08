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

// B. CREACIÓN (POST): Crear un nuevo coche con cliente_id
app.post('/api/coches', async (req, res) => {
  const { matricula, modelo, problema_descripcion, cliente_id, estado, mecanicoAsignado } = req.body // <-- cliente_id AÑADIDO
  try {
    const [result] = await db.execute(
      'INSERT INTO coches (matricula, modelo, problema_descripcion, cliente_id, estado, mecanicoAsignado) VALUES (?, ?, ?, ?, ?, ?)', // <-- SQL MODIFICADO
      [
        matricula,
        modelo,
        problema_descripcion,
        cliente_id,
        estado || 'Pendiente',
        mecanicoAsignado || null,
      ],
    )
    // Retorna el nuevo objeto
    res.status(201).json({
      id: result.insertId,
      matricula,
      modelo,
      problema_descripcion,
      cliente_id, // <-- Retornar ID
      estado: estado || 'Pendiente',
      mecanicoAsignado: mecanicoAsignado || null,
    })
  } catch (error) {
    console.error('Error al insertar coche:', error)
    res.status(409).json({ message: 'La matrícula ya existe o hay un error de datos.' })
  }
})

// C. MÉTRICAS (GET): Dashboard
app.get('/api/metricas', async (req, res) => {
  try {
    // 1. Obtener vehículos/servicios en reparación
    const [cochesEnTaller] = await db.query(
      "SELECT COUNT(*) AS total FROM coches WHERE estado NOT IN ('Listo para entrega')",
    )

    // 2. Obtener mecánicos disponibles REALES
    const [mecanicosDisp] = await db.query(
      'SELECT COUNT(*) AS total FROM mecanicos WHERE disponible = TRUE',
    )

    // Obtenemos el valor real del conteo
    const vehiculosActivos = cochesEnTaller[0].total

    res.json({
      vehiculosEnTaller: vehiculosActivos,
      mecanicosDisponibles: mecanicosDisp[0].total,
      // 3. ASIGNAMOS EL VALOR REAL DE VEHÍCULOS ACTIVOS A 'serviciosPendientes'
      serviciosPendientes: vehiculosActivos,
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

// G. LECTURA (GET): Obtener solo mecánicos DISPONIBLES
app.get('/api/mecanicos/disponibles', async (req, res) => {
  try {
    // Asumiendo que el campo 'disponible' es TRUE/FALSE en MySQL
    const [rows] = await db.query(
      'SELECT id, nombre FROM mecanicos WHERE disponible = TRUE ORDER BY nombre ASC',
    )
    res.json(rows)
  } catch (error) {
    console.error('Error al obtener mecánicos disponibles:', error)
    res.status(500).json({ message: 'Error en el servidor al consultar mecánicos disponibles.' })
  }
})

// H. ELIMINACIÓN (DELETE): Eliminar un coche por ID
app.delete('/api/coches/:id', async (req, res) => {
  const { id } = req.params // Captura el ID desde la URL

  try {
    const [result] = await db.execute('DELETE FROM coches WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coche no encontrado.' })
    }

    res.status(200).json({ message: 'Coche eliminado con éxito.', id: id })
  } catch (error) {
    console.error('Error al eliminar coche:', error)
    res.status(500).json({ message: 'Error en el servidor al eliminar el coche.' })
  }
})

// I. ACTUALIZACIÓN (PUT): Actualizar datos de un mecánico
app.put('/api/mecanicos/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, especialidad, disponible } = req.body

  try {
    const [result] = await db.execute(
      'UPDATE mecanicos SET nombre = ?, especialidad = ?, disponible = ? WHERE id = ?',
      [nombre, especialidad, disponible, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Mecánico no encontrado.' })
    }
    res.status(200).json({ message: 'Mecánico actualizado con éxito.', id: id })
  } catch (error) {
    console.error('Error al actualizar mecánico:', error)
    res.status(500).json({ message: 'Error en el servidor al actualizar el mecánico.' })
  }
})

// J. ELIMINACIÓN (DELETE): Eliminar un mecánico por ID
app.delete('/api/mecanicos/:id', async (req, res) => {
  const { id } = req.params

  try {
    const [result] = await db.execute('DELETE FROM mecanicos WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Mecánico no encontrado.' })
    }
    res.status(200).json({ message: 'Mecánico eliminado con éxito.', id: id })
  } catch (error) {
    console.error('Error al eliminar mecánico:', error)
    res.status(500).json({ message: 'Error en el servidor al eliminar el mecánico.' })
  }
})

// K. LECTURA (GET): Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre ASC')
    res.json(rows)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    res.status(500).json({ message: 'Error en el servidor al consultar clientes.' })
  }
})

// L. CREACIÓN (POST): Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  const { nombre, telefono, email, direccion } = req.body
  try {
    const [result] = await db.execute(
      'INSERT INTO clientes (nombre, telefono, email, direccion) VALUES (?, ?, ?, ?)',
      [nombre, telefono, email, direccion],
    )
    res.status(201).json({ id: result.insertId, nombre, telefono, email, direccion })
  } catch (error) {
    console.error('Error al insertar cliente:', error)
    res.status(500).json({ message: 'Error al crear el cliente.' })
  }
})

// M. ELIMINACIÓN (DELETE): Eliminar un cliente por ID
app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params

  try {
    const [result] = await db.execute('DELETE FROM clientes WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' })
    }
    res.status(200).json({ message: 'Cliente eliminado con éxito.', id: id })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    res.status(500).json({ message: 'Error al eliminar el cliente.' })
  }
})

// N. LECTURA (GET): Obtener lista simple de todos los clientes (para el SELECT)
app.get('/api/clientes/lista', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre FROM clientes ORDER BY nombre ASC')
    res.json(rows)
  } catch (error) {
    console.error('Error al obtener lista de clientes:', error)
    res.status(500).json({ message: 'Error en el servidor al consultar lista de clientes.' })
  }
})

// O. LECTURA (GET): Obtener todos los repuestos
app.get('/api/repuestos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM repuestos ORDER BY nombre ASC')
    res.json(rows)
  } catch (error) {
    console.error('Error al obtener repuestos:', error)
    res.status(500).json({ message: 'Error en el servidor al consultar repuestos.' })
  }
})

// P. CREACIÓN (POST): Crear un nuevo repuesto
app.post('/api/repuestos', async (req, res) => {
  const { nombre, codigo, fabricante, stock, precio } = req.body
  try {
    const [result] = await db.execute(
      'INSERT INTO repuestos (nombre, codigo, fabricante, stock, precio) VALUES (?, ?, ?, ?, ?)',
      [nombre, codigo, fabricante, stock, precio],
    )
    res.status(201).json({ id: result.insertId, nombre, codigo, fabricante, stock, precio })
  } catch (error) {
    // Si el código ya existe, MySQL devuelve un error
    console.error('Error al insertar repuesto:', error)
    res.status(409).json({ message: 'El código de repuesto ya existe o hay un error de datos.' })
  }
})
// Q. ELIMINACIÓN (DELETE): Eliminar un repuesto por ID
app.delete('/api/repuestos/:id', async (req, res) => {
  const { id } = req.params
  try {
    const [result] = await db.execute('DELETE FROM repuestos WHERE id = ?', [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Repuesto no encontrado.' })
    }
    res.status(200).json({ message: 'Repuesto eliminado con éxito.', id: id })
  } catch (error) {
    console.error('Error al eliminar repuesto:', error)
    res.status(500).json({ message: 'Error al eliminar el repuesto.' })
  }
})

// R. ACTUALIZACIÓN (PUT): Actualizar un repuesto por ID
app.put('/api/repuestos/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, codigo, fabricante, stock, precio } = req.body

  try {
    const [result] = await db.execute(
      'UPDATE repuestos SET nombre = ?, codigo = ?, fabricante = ?, stock = ?, precio = ? WHERE id = ?',
      [nombre, codigo, fabricante, stock, precio, id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Repuesto no encontrado.' })
    }
    res.status(200).json({ message: 'Repuesto actualizado con éxito.', id: id })
  } catch (error) {
    console.error('Error al actualizar repuesto:', error)
    res.status(500).json({ message: 'Error en el servidor al actualizar el repuesto.' })
  }
})
// Nota: La actualización (PUT) se implementaría si necesita modificar precio o stock.
// --- 3. INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Backend API REAL corriendo en http://localhost:${PORT}`)
})
