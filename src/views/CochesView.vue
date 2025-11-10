<template>
  <div class="coches-view">
    <h1>Gestión de Vehículos 🚗</h1>

    <div class="formulario-agregar">
      <h2>Añadir Nuevo Vehículo (Asignación Directa)</h2>
      <form @submit.prevent="agregarCoche">
        <div class="input-group">
          <input
            type="text"
            v-model="nuevoCoche.matricula"
            placeholder="Placas (Matrícula Ej: NEW-111)"
            required
          />
          <input
            type="text"
            v-model="nuevoCoche.modelo"
            placeholder="Modelo de Carro (Ej: Audi A4)"
            required
          />
        </div>

        <textarea
          v-model="nuevoCoche.problema_descripcion"
          placeholder="Descripción detallada del problema o servicio solicitado"
          required
        ></textarea>

        <div class="input-group">
          <select v-model="nuevoCoche.cliente_id" required>
            <option :value="null" disabled>-- Seleccione el Cliente --</option>
            <option v-for="cliente in listaClientes" :key="cliente.id" :value="cliente.id">
              {{ cliente.nombre }}
            </option>
          </select>

          <select v-model="nuevoCoche.mecanicoAsignado" required>
            <option :value="null" disabled>-- Seleccione Mecánico Disponible --</option>
            <option
              v-for="mecanico in mecanicosDisponibles"
              :key="mecanico.id"
              :value="mecanico.nombre"
            >
              {{ mecanico.nombre }}
            </option>
          </select>
        </div>

        <hr style="border-top: 1px dashed #444; margin: 20px 0" />

        <h3 class="seccion-titulo">Consumo de Inventario</h3>

        <div class="repuesto-asignacion">
          <select v-model="repuestoSeleccionadoId">
            <option :value="null" disabled>-- Añadir Repuesto Necesario --</option>
            <option v-for="repuesto in listaRepuestos" :key="repuesto.id" :value="repuesto.id">
              {{ repuesto.nombre }} (Stock: {{ repuesto.stock }})
            </option>
          </select>
          <input
            type="number"
            v-model.number="cantidadRepuesto"
            min="1"
            placeholder="Cantidad"
            style="max-width: 100px"
          />
          <button
            type="button"
            @click="agregarRepuestoAlFormulario"
            :disabled="!repuestoSeleccionadoId || cantidadRepuesto <= 0"
            class="btn-action complete"
          >
            Añadir
          </button>
        </div>

        <div v-if="nuevoCoche.repuestosUsados.length > 0" class="repuestos-lista">
          <h4>Repuestos Asignados:</h4>
          <ul>
            <li v-for="(item, index) in nuevoCoche.repuestosUsados" :key="index">
              {{ item.nombre }} (x{{ item.cantidad }})
              <span @click="removerRepuesto(index)" class="remover-btn">❌</span>
            </li>
          </ul>
        </div>

        <button type="submit" class="btn-action final-submit">Registrar y Asignar</button>
      </form>

      <p v-if="mensajeExito" class="exito">{{ mensajeExito }}</p>
      <p v-if="errorCreacion" class="error">{{ errorCreacion }}</p>
    </div>

    <p v-if="cargando">Cargando vehículos desde la API...</p>
    <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>
    <p v-else>Total de vehículos en el taller: {{ coches.length }}</p>

    <table v-if="!cargando && !errorLectura">
      <thead>
        <tr>
          <th>ID</th>
          <th>Matrícula</th>
          <th>Modelo</th>
          <th>Cliente ID</th>
          <th>Problema</th>
          <th>Estado</th>
          <th>Mecánico Asignado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="coche in coches" :key="coche.id">
          <td>{{ coche.id }}</td>
          <td>{{ coche.matricula }}</td>
          <td>{{ coche.modelo }}</td>
          <td>{{ coche.cliente_id || 'N/A' }}</td>
          <td>{{ coche.problema_descripcion }}</td>

          <td
            :class="[
              coche.estado === 'Pendiente' ? 'pendiente-estado' : '',
              coche.estado === 'En reparación' ? 'reparacion-estado' : '',
              coche.estado === 'Listo para entrega' ? 'listo-estado' : '',
            ]"
          >
            {{ coche.estado }}
          </td>

          <td>{{ coche.mecanicoAsignado || 'Sin Asignar' }}</td>
          <td>
            <button
              v-if="coche.estado === 'Pendiente'"
              @click="actualizarEstado(coche.id, 'En reparación', coche.mecanicoAsignado)"
              class="btn-action start"
            >
              Iniciar Reparación
            </button>
            <button
              v-else-if="coche.estado === 'En reparación'"
              @click="actualizarEstado(coche.id, 'Listo para entrega', coche.mecanicoAsignado)"
              class="btn-action complete"
            >
              Marcar Listo
            </button>

            <button
              v-if="coche.estado === 'Listo para entrega' || coche.estado === 'Pendiente'"
              @click="eliminarCoche(coche.id)"
              class="btn-action delete"
            >
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      coches: [],
      listaClientes: [],
      mecanicosDisponibles: [],
      listaRepuestos: [], // Lista para el dropdown

      // --- VARIABLES TEMPORALES (Corregidas, fuera de nuevoCoche) ---
      repuestoSeleccionadoId: null,
      cantidadRepuesto: 1,

      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      mensajeExito: null,

      // --- CONFIGURACIÓN DE APIS (Todas usan puerto 3000) ---
      API_URL: '/api/coches',
      API_MECANICOS: '/api/mecanicos/disponibles',
      API_CLIENTES: '/api/clientes/lista',
      API_REPUESTOS: '/api/repuestos',
      API_INVENTARIO_CONSUMO: '/api/inventario/consumir',
      // --- OBJETO QUE SE ENVÍA AL BACKEND ---
      nuevoCoche: {
        matricula: '',
        modelo: '',
        problema_descripcion: '',
        estado: 'Pendiente',
        mecanicoAsignado: null,
        cliente_id: null,
        repuestosUsados: [], // Array que se envía
      },
    }
  },
  mounted() {
    this.fetchData()
    this.fetchMecanicosDisponibles()
    this.fetchClientes()
    this.fetchRepuestos() // Cargar la lista de repuestos
  },
  methods: {
    // 1. OBTENER COCHES (GET) - Se mantiene
    fetchData() {
      this.cargando = true
      this.errorLectura = null
      axios
        .get(this.API_URL)
        .then((response) => {
          this.coches = response.data
          this.cargando = false
        })
        .catch(() => {
          this.errorLectura = 'No se pudo conectar a la API de coches.'
          this.cargando = false
        })
    },

    // 2. OBTENER MECÁNICOS DISPONIBLES (GET) - Se mantiene
    fetchMecanicosDisponibles() {
      axios
        .get(this.API_MECANICOS)
        .then((response) => {
          this.mecanicosDisponibles = response.data
        })
        .catch((error) => {
          console.error('Error al cargar mecánicos disponibles:', error)
        })
    },

    // 3. OBTENER LISTA DE CLIENTES (GET) - Se mantiene
    fetchClientes() {
      axios
        .get(this.API_CLIENTES)
        .then((response) => {
          this.listaClientes = response.data
        })
        .catch((error) => {
          console.error('Error al cargar lista de clientes:', error)
        })
    },

    // 4. OBTENER LISTA DE REPUESTOS (GET) - Necesario para el selector
    fetchRepuestos() {
      axios
        .get(this.API_REPUESTOS)
        .then((response) => {
          this.listaRepuestos = response.data
        })
        .catch((error) => {
          console.error('Error al cargar lista de repuestos para el formulario:', error)
        })
    },

    // 5. AGREGAR REPUESTO AL FORMULARIO (CLIENT-SIDE)
    agregarRepuestoAlFormulario() {
      this.errorCreacion = null // Limpiar mensajes de error

      if (!this.repuestoSeleccionadoId || this.cantidadRepuesto <= 0) {
        this.errorCreacion = 'Debe seleccionar un repuesto y una cantidad válida.'
        return
      }

      const repuesto = this.listaRepuestos.find((r) => r.id === this.repuestoSeleccionadoId)

      if (repuesto) {
        const cantidadAAgregar = this.cantidadRepuesto
        const stockDisponible = repuesto.stock

        // Buscar si el ítem ya está en la lista temporal de consumo
        const existingIndex = this.nuevoCoche.repuestosUsados.findIndex(
          (item) => item.id === repuesto.id,
        )

        let cantidadTotalSolicitada = cantidadAAgregar

        if (existingIndex !== -1) {
          // Si ya existe, calculamos la nueva cantidad total (existente + nueva)
          cantidadTotalSolicitada =
            this.nuevoCoche.repuestosUsados[existingIndex].cantidad + cantidadAAgregar
        }

        // --- VERIFICACIÓN DE STOCK CRÍTICA ---
        if (stockDisponible < cantidadTotalSolicitada) {
          this.errorCreacion = `Stock insuficiente para ${repuesto.nombre}. Solo quedan ${stockDisponible} unidades disponibles.`
          return
        }

        // --- PROCESAR SUMA O ADICIÓN ---
        if (existingIndex !== -1) {
          // Si ya existe, sumar la nueva cantidad
          this.nuevoCoche.repuestosUsados[existingIndex].cantidad = cantidadTotalSolicitada
        } else {
          // Si no existe, añadir nuevo ítem
          const itemConsumido = {
            id: repuesto.id,
            nombre: repuesto.nombre,
            cantidad: cantidadAAgregar,
          }
          this.nuevoCoche.repuestosUsados.push(itemConsumido)
        }

        this.mensajeExito = `Añadido ${cantidadAAgregar}x ${repuesto.nombre} a la orden.`

        // Limpiar selección temporal
        this.repuestoSeleccionadoId = null
        this.cantidadRepuesto = 1
      }
    },

    // 6. REMOVER UN REPUESTO DE LA LISTA TEMPORAL
    removerRepuesto(index) {
      this.nuevoCoche.repuestosUsados.splice(index, 1)
    },

    // 7. REGISTRAR COCHE (POST)
    async agregarCoche() {
      this.errorCreacion = null
      this.mensajeExito = null

      // Validar Mecánico y Cliente (EXISTENTE)
      if (!this.nuevoCoche.mecanicoAsignado || !this.nuevoCoche.cliente_id) {
        this.errorCreacion =
          'Debe seleccionar tanto el Mecánico como el Cliente para registrar el vehículo.'
        return
      }

      // --- NUEVA VALIDACIÓN CRÍTICA: REQUISITO DE REPUESTOS ---
      if (this.nuevoCoche.repuestosUsados.length === 0) {
        this.errorCreacion =
          'Es necesario ingresar un producto en la sección de Consumo de Inventario antes de registrar el coche.'
        return
      }
      // --------------------------------------------------------

      try {
        // --- 1. PROCESAR CONSUMO DE STOCK ---
        if (this.nuevoCoche.repuestosUsados.length > 0) {
          // Nota: Se asume que este endpoint se conecta al puerto 3000 de tu API
          await axios.post(this.API_INVENTARIO_CONSUMO, {
            items: this.nuevoCoche.repuestosUsados,
          })
        }

        // --- 2. REGISTRAR EL COCHE ---
        const response = await axios.post(this.API_URL, this.nuevoCoche)

        // 3. ACTUALIZACIONES LOCALES (ÉXITO)
        this.coches.unshift(response.data)
        this.mensajeExito = `Vehículo ${response.data.matricula} añadido y asignado al Cliente ID ${response.data.cliente_id} y a ${response.data.mecanicoAsignado}.`

        // Limpiar el formulario y reiniciar la lista de repuestos
        this.nuevoCoche = {
          matricula: '',
          modelo: '',
          problema_descripcion: '',
          estado: 'Pendiente',
          mecanicoAsignado: null,
          cliente_id: null,
          repuestosUsados: [], // ARRAY DE REPUESTOS VACÍO
        }

        // Limpiar las variables temporales de inventario
        this.repuestoSeleccionadoId = null
        this.cantidadRepuesto = 1

        // Recargar listas necesarias (para actualizar el stock visible)
        this.fetchMecanicosDisponibles()
        this.fetchRepuestos()
      } catch (error) {
        // --- MANEJO DE ERRORES (Stock insuficiente o matrícula duplicada) ---
        if (error.response) {
          if (error.response.status === 409) {
            this.errorCreacion =
              error.response.data.message ||
              'Error: La matrícula ya existe o el stock es insuficiente.'
          } else {
            this.errorCreacion = 'No se pudo crear el vehículo. Error en la API.'
          }
        } else {
          this.errorCreacion = 'No se pudo crear el vehículo. Revisa la conexión al Backend.'
        }
        console.error('Error al agregar coche:', error)
      }
    },
    // 8. ACTUALIZAR ESTADO (PUT) - Se mantiene igual
    async actualizarEstado(id, nuevoEstado, mecanicoAsignado) {
      try {
        const url = `${this.API_URL}/${id}`
        const asignacion = nuevoEstado === 'Listo para entrega' ? null : mecanicoAsignado
        const data = {
          estado: nuevoEstado,
          mecanicoAsignado: asignacion,
        }
        await axios.put(url, data)
        const index = this.coches.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.coches[index].estado = nuevoEstado
          this.coches[index].mecanicoAsignado = asignacion
        }
        this.fetchMecanicosDisponibles()
      } catch (error) {
        this.errorLectura = 'No se pudo actualizar el estado del coche.'
        console.error('Error al actualizar:', error)
      }
    },

    // 9. ELIMINAR COCHE (DELETE) - Se mantiene igual
    async eliminarCoche(id) {
      if (
        !confirm(
          `¿Está seguro de eliminar el vehículo con ID ${id}? Esta acción no se puede deshacer.`,
        )
      ) {
        return
      }
      try {
        const url = `${this.API_URL}/${id}`
        await axios.delete(url)
        this.coches = this.coches.filter((c) => c.id !== id)
        this.mensajeExito = `Vehículo con ID ${id} eliminado correctamente.`
        this.errorLectura = null
      } catch (error) {
        this.errorLectura = `No se pudo eliminar el coche con ID ${id}.`
        console.error('Error al eliminar:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Estilos se mantienen */
.coches-view {
  padding: 20px;
}
/* ... otros estilos ... */

/* --- ESTILOS DE FORMULARIO MEJORADOS --- */
.formulario-agregar {
  padding: 20px;
  margin-bottom: 20px;
  background-color: #1a2430; /* Fondo ligeramente más claro para el formulario */
  border: 1px solid #333;
  border-radius: 8px;
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
/* Estilo unificado para inputs y selects */
.input-group input,
.input-group select {
  flex: 1;
  padding: 12px; /* Aumentamos el padding para hacerlo más alto */
  background-color: #2c3e50; /* Color de fondo oscuro similar al de la tabla */
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 1em;
  /* Eliminar la flecha por defecto de Chrome para select */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
/* Arreglo para que el select se vea igual que el input en todos los navegadores */
.input-group select {
  /* Añadimos un pequeño margen para compensar la flecha personalizada (opcional) */
  background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M7.41%208.59L12%2013.17l4.59-4.58L18%2010l-6%206-6-6z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px; /* Dejar espacio para la flecha */
}

textarea {
  width: 100%;
  min-height: 80px;
  margin-bottom: 10px;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #444;
  background-color: #2c3e50;
  color: white;
  border-radius: 4px;
}
/* Estilos se mantienen */
.coches-view {
  padding: 20px;
}
.error {
  color: #ff6b6b;
  font-weight: bold;
}
.exito {
  color: #42b983;
  font-weight: bold;
}
.formulario-agregar {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #333;
  border-radius: 8px;
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-group input,
.input-group select {
  flex: 1;
}
textarea {
  width: 100%;
  min-height: 80px;
  margin-bottom: 10px;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #444;
  background-color: #2c3e50;
  color: white;
  border-radius: 4px;
}
.btn-action {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  margin: 2px;
  transition: background-color 0.3s;
}
.start {
  background-color: #f39c12;
  color: white;
}
.complete {
  background-color: #3498db;
  color: white;
}
.delete {
  background-color: #e74c3c;
  color: white;
}
npm run dev .pendiente-estado {
  color: #f39c12;
  font-weight: bold;
}
.reparacion-estado {
  color: #3498db;
  font-weight: bold;
}
.listo-estado {
  color: #42b983;
  font-weight: bold;
}
.seccion-titulo {
  font-size: 1.3em;
  color: #fff;
  margin-top: 20px;
  margin-bottom: 15px;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
}

.repuesto-asignacion {
  display: flex;
  gap: 10px;
  align-items: center;
  background-color: #2c3e50; /* Fondo más oscuro para el área de asignación */
  padding: 15px;
  border-radius: 8px;
}

/* Estilo para los selectores de repuesto y el input de cantidad */
.repuesto-asignacion select,
.repuesto-asignacion input[type='number'] {
  padding: 10px;
  border: 1px solid #555;
  background-color: #1e2a38; /* Fondo oscuro */
  color: white;
  border-radius: 4px;
  height: 40px; /* Uniformidad de altura */
}

.repuesto-asignacion select {
  flex-grow: 1; /* Ocupa el mayor espacio posible */
}

.repuesto-asignacion input[type='number'] {
  max-width: 80px; /* Campo de cantidad pequeño */
  text-align: center;
}

.repuesto-asignacion .btn-action {
  height: 40px;
  background-color: #42b983; /* Nuevo color para el botón 'Añadir' */
  color: white;
}

/* Estilos para la lista de repuestos ya asignados */
.repuestos-lista {
  margin-top: 15px;
  padding: 10px;
  border-left: 3px solid #42b983;
}
.remover-btn {
  color: #e74c3c;
  cursor: pointer;
  font-weight: bold;
  margin-left: 10px;
}
</style>
