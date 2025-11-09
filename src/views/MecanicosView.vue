<template>
  <div class="mecanicos-view">
    <h1>Personal del Taller 🔧</h1>

    <div class="formulario-agregar">
      <h2>Contratar Nuevo Mecánico</h2>
      <form @submit.prevent="agregarMecanico">
        <input type="text" v-model="nuevoMecanico.nombre" placeholder="Nombre Completo" required />
        <input
          type="text"
          v-model="nuevoMecanico.especialidad"
          placeholder="Especialidad (Ej: Motores)"
          required
        />
        <button type="submit">Añadir a la Plantilla</button>
      </form>
      <p v-if="mensajeExito" class="exito">{{ mensajeExito }}</p>
      <p v-if="errorCreacion" class="error">{{ errorCreacion }}</p>
    </div>

    <p v-if="cargando">Cargando personal desde la base de datos...</p>
    <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>
    <p v-else>Mecánicos disponibles: {{ disponibles.length }} de {{ mecanicos.length }}</p>

    <table class="mecanicos-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Especialidad</th>
          <th>Disponibilidad</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="mecanico in mecanicos" :key="mecanico.id">
          <td>{{ mecanico.id }}</td>
          <td>{{ mecanico.nombre }}</td>
          <td>{{ mecanico.especialidad }}</td>
          <td>
            <span :class="{ disponible: mecanico.disponible, ocupado: !mecanico.disponible }">
              {{ mecanico.disponible ? 'Disponible' : 'Ocupado' }}
            </span>
          </td>

          <td>
            <button
              @click="toggleDisponibilidad(mecanico)"
              :class="['btn-action', mecanico.disponible ? 'complete' : 'start']"
            >
              {{ mecanico.disponible ? 'Marcar Ocupado' : 'Marcar Libre' }}
            </button>

            <button @click="eliminarMecanico(mecanico.id)" class="btn-action delete">
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
      mecanicos: [],
      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      API_URL: 'http://localhost:3000/api/mecanicos', // Endpoint base
      nuevoMecanico: { nombre: '', especialidad: '', disponible: true },
      mensajeExito: null,
    }
  },
  mounted() {
    this.fetchData()
  },
  computed: {
    disponibles() {
      return this.mecanicos.filter((m) => m.disponible)
    },
  },
  methods: {
    // 1. OBTENER DATOS (GET)
    fetchData() {
      this.cargando = true
      axios
        .get(this.API_URL)
        .then((response) => {
          this.mecanicos = response.data
          this.cargando = false
        })
        .catch(() => {
          this.errorLectura = 'No se pudo conectar a la API para cargar mecánicos.'
          this.cargando = false
        })
    },

    // 2. AGREGAR DATOS (POST) - Se mantiene igual
    async agregarMecanico() {
      this.errorCreacion = null
      this.mensajeExito = null
      try {
        const response = await axios.post(this.API_URL, this.nuevoMecanico)

        this.mecanicos.unshift(response.data)
        this.mensajeExito = `¡${response.data.nombre} contratado con éxito!`
        this.nuevoMecanico = { nombre: '', especialidad: '', disponible: true }
      } catch (error) {
        this.errorCreacion = 'Error al contratar. Revisa la conexión al Backend.'
        console.error('Error al agregar mecánico:', error)
      }
    },

    // 3. ACTUALIZAR DISPONIBILIDAD (PUT) - NUEVO
    async toggleDisponibilidad(mecanico) {
      const nuevoEstado = !mecanico.disponible
      const url = `${this.API_URL}/${mecanico.id}`

      try {
        const data = {
          nombre: mecanico.nombre, // Necesario para el PUT
          especialidad: mecanico.especialidad, // Necesario para el PUT
          disponible: nuevoEstado,
        }

        await axios.put(url, data)

        // Actualiza el estado localmente para reflejar el cambio en la tabla
        mecanico.disponible = nuevoEstado
        this.mensajeExito = `${mecanico.nombre} marcado como ${nuevoEstado ? 'DISPONIBLE' : 'OCUPADO'}.`
      } catch (error) {
        this.errorLectura = 'No se pudo actualizar la disponibilidad.'
        console.error('Error al actualizar disponibilidad:', error)
      }
    },

    // 4. ELIMINAR REGISTRO (DELETE) - NUEVO
    async eliminarMecanico(id) {
      if (
        !confirm(`¿Está seguro de despedir al mecánico con ID ${id}? Esta acción es permanente.`)
      ) {
        return
      }

      try {
        const url = `${this.API_URL}/${id}`
        await axios.delete(url)

        // Filtra el registro eliminado de la lista local
        this.mecanicos = this.mecanicos.filter((m) => m.id !== id)
        this.mensajeExito = `Mecánico con ID ${id} eliminado correctamente.`
      } catch (error) {
        this.errorLectura = `No se pudo eliminar el mecánico con ID ${id}.`
        console.error('Error al eliminar:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Estilos generales */
.mecanicos-view {
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

/* Estilos de la tabla de mecánicos */
.mecanicos-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.mecanicos-table th,
.mecanicos-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #333;
}
.mecanicos-table th {
  background-color: #28a745; /* Un verde más oscuro y sólido para encabezados */
  color: white;
  font-weight: bold;
}
.mecanicos-table tbody tr:hover {
  background-color: #2c3e50; /* Un sutil cambio de fondo al pasar el ratón */
}

/* Colores de disponibilidad */
.disponible {
  color: #42b983; /* Verde Vue */
  font-weight: bold;
}
.ocupado {
  color: #ff6b6b; /* Rojo */
  font-weight: bold;
}

/* Estilos de formulario (ya definidos en main.css o aquí si es necesario) */
.formulario-agregar {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #333;
  border-radius: 8px;
}
.formulario-agregar input {
  margin-right: 10px;
  padding: 10px;
  border: 1px solid #444;
  background-color: #2c3e50;
  color: white;
  border-radius: 4px;
}
.formulario-agregar button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #28a745; /* Verde para añadir */
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}
.formulario-agregar button:hover {
  background-color: #218838;
}

/* --- ESTILOS DE BOTONES DE ACCIÓN MEJORADOS --- */
.btn-action {
  padding: 8px 12px; /* Más padding para mejorar el aspecto */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  margin: 2px; /* Margen más ajustado entre botones */
  transition:
    background-color 0.3s,
    transform 0.1s;
  white-space: nowrap; /* Evita que el texto se rompa en varias líneas */
}

/* Hover effect */
.btn-action:hover {
  transform: translateY(-1px); /* Pequeño efecto 3D */
}

/* Colores para el toggle de disponibilidad */
.btn-action.start {
  /* Para marcar como OCUPADO */
  background-color: #e6b700; /* Un amarillo/naranja más suave */
  color: white;
}
.btn-action.complete {
  /* Para marcar como DISPONIBLE */
  background-color: #42b983; /* Verde Vue */
  color: white;
}
.btn-action.delete {
  /* Para Eliminar */
  background-color: #e74c3c; /* Rojo */
  color: white;
}
</style>
