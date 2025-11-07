<template>
  <div class="dashboard">
    <h1 class="titulo">Panel de Control del Taller Mecánico 🛠️</h1>
    <p class="subtitulo">Resumen Rápido del Taller</p>

    <div v-if="cargando" class="cargando">Cargando métricas...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="metricas">
      <div class="card">
        <h2>Vehículos en Taller</h2>
        <p class="numero">{{ metricas.vehiculosEnTaller }}</p>
        <small>Total en reparación o pendientes</small>
      </div>
      <div class="card">
        <h2>Mecánicos Disponibles</h2>
        <p class="numero">{{ metricas.mecanicosDisponibles }}</p>
        <small>Mecánicos listos para un nuevo trabajo</small>
      </div>
      <div class="card">
        <h2>Servicios Pendientes</h2>
        <p class="numero">{{ metricas.serviciosPendientes }}</p>
        <small>Tareas sin asignar o en espera</small>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      metricas: {},
      cargando: true,
      error: null,
      API_URL: 'http://localhost:3000/api/metricas',
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      axios
        .get(this.API_URL)
        .then((response) => {
          this.metricas = response.data
          this.cargando = false
        })
        .catch(() => {
          // <--- CORRECCIÓN: Quitamos '_err' para cumplir con ESLint
          this.error = 'Error al cargar Dashboard. ¿Está la API corriendo en el puerto 3000?'
          this.cargando = false
        })
    },
  },
}
</script>

<style scoped>
.dashboard {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}
.titulo {
  font-size: 2.5em;
  color: #42b983;
  margin-bottom: 10px;
}
.subtitulo {
  font-size: 1.2em;
  color: #aaa;
  margin-bottom: 30px;
}
.metricas {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.card {
  flex: 1 1 300px;
  background-color: #2c3e50;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  min-width: 250px;
}
.card h2 {
  font-size: 1.4em;
  margin-bottom: 10px;
  color: #fff;
}
.numero {
  font-size: 3em;
  font-weight: bold;
  color: #42b983;
  margin: 5px 0;
}
.cargando,
.error {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
}
.error {
  color: #ff6b6b;
}
</style>
