<template>
  <div class="coches-view">
    <h1>Gestión de Vehículos 🚗</h1>

    <div class="formulario-agregar">
      <h2>Añadir Nuevo Vehículo</h2>
      <form @submit.prevent="agregarCoche">
        <input
          type="text"
          v-model="nuevoCoche.matricula"
          placeholder="Matrícula (Ej: NEW-111)"
          required
        />
        <input
          type="text"
          v-model="nuevoCoche.modelo"
          placeholder="Modelo (Ej: Audi A4)"
          required
        />
        <button type="submit">Dar Entrada al Taller</button>
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
          <td>{{ coche.estado }}</td>
          <td>{{ coche.mecanicoAsignado || 'PENDIENTE' }}</td>

          <td>
            <button
              v-if="coche.estado === 'Pendiente'"
              @click="actualizarEstado(coche.id, 'En reparación')"
              class="btn-action start"
            >
              Iniciar Reparación
            </button>
            <button
              v-else-if="coche.estado === 'En reparación'"
              @click="actualizarEstado(coche.id, 'Listo para entrega')"
              class="btn-action complete"
            >
              Finalizar Trabajo
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
      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      API_URL: 'http://localhost:3000/api/coches',
      nuevoCoche: { matricula: '', modelo: '', estado: 'Pendiente', mecanicoAsignado: null },
      mensajeExito: null,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    // Lógica para OBTENER datos (GET)
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
          this.errorLectura =
            'No se pudo conectar a la API. Asegúrate de que el servidor Backend esté corriendo.'
          this.cargando = false
        })
    },

    // Lógica para AGREGAR datos (POST)
    async agregarCoche() {
      this.errorCreacion = null
      this.mensajeExito = null

      try {
        const response = await axios.post(this.API_URL, this.nuevoCoche)
        this.coches.unshift(response.data)
        this.mensajeExito = `Vehículo ${response.data.matricula} añadido con ID ${response.data.id}.`
        this.nuevoCoche = { matricula: '', modelo: '', estado: 'Pendiente', mecanicoAsignado: null }
      } catch (error) {
        if (error.response && error.response.status === 409) {
          this.errorCreacion = 'Error: ¡La matrícula ya existe en el sistema!'
        } else {
          this.errorCreacion = 'No se pudo crear el vehículo. Revisa la conexión al Backend.'
        }
        console.error('Error al agregar coche:', error)
      }
    },

    // Lógica para ACTUALIZAR datos (PUT)
    async actualizarEstado(id, nuevoEstado) {
      try {
        const url = `${this.API_URL}/${id}`

        // Determina el mecánico asignado/liberado
        const asignacion = nuevoEstado === 'En reparación' ? 'Mecánico de Prueba' : null

        const data = {
          estado: nuevoEstado,
          mecanicoAsignado: asignacion,
        }

        await axios.put(url, data)

        // Actualiza la lista local (Frontend) sin recargar la página
        const index = this.coches.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.coches[index].estado = nuevoEstado
          this.coches[index].mecanicoAsignado = asignacion
        }
      } catch (error) {
        this.errorLectura = 'No se pudo actualizar el estado del coche.'
        console.error('Error al actualizar:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Estilos básicos ya están en main.css, añadimos los específicos aquí */
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
  margin-top: 10px;
}
/* Estilos para botones de acción */
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
  background-color: #f39c12; /* Naranja (Pendiente -> Reparación) */
  color: white;
}
.complete {
  background-color: #3498db; /* Azul (Reparación -> Listo) */
  color: white;
}
</style>
