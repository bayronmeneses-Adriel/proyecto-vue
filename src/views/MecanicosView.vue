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

    <ul>
      <li v-for="mecanico in mecanicos" :key="mecanico.id">
        <strong>{{ mecanico.nombre }}</strong> - Especialidad: {{ mecanico.especialidad }}
        <span :class="{ disponible: mecanico.disponible, ocupado: !mecanico.disponible }">
          ({{ mecanico.disponible ? 'Disponible' : 'Ocupado' }})
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      mecanicos: [], // Cambiado de datos estáticos a array vacío
      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      API_URL: 'http://localhost:3000/api/mecanicos',
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
    // Lógica para OBTENER datos (GET)
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

    // Lógica para AGREGAR datos (POST)
    async agregarMecanico() {
      this.errorCreacion = null
      this.mensajeExito = null
      try {
        const response = await axios.post(this.API_URL, this.nuevoMecanico)

        // Añade el nuevo objeto a la lista local y limpia el formulario
        this.mecanicos.unshift(response.data)
        this.mensajeExito = `¡${response.data.nombre} contratado con éxito!`
        this.nuevoMecanico = { nombre: '', especialidad: '', disponible: true }
      } catch (error) {
        this.errorCreacion = 'Error al contratar. Revisa la conexión al Backend.'
        console.error('Error al agregar mecánico:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Estilos básicos para la vista de Mecánicos */
.mecanicos-view {
  padding: 20px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 8px 0;
  border-bottom: 1px dashed #444;
}
.disponible {
  color: #42b983;
  font-weight: bold;
} /* Verde Vue */
.ocupado {
  color: #ff6b6b;
}
/* Usamos los estilos de formulario definidos en main.css */
</style>
