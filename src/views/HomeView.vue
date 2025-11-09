<template>
  <div class="dashboard">
    <h1 class="titulo">Panel de Control del Taller Mecánico &nbsp; 🛠️</h1>
    <p class="subtitulo">Resumen Rápido del Taller</p>

    <div v-if="stockAlertas && stockAlertas.count > 0" class="alerta-inventario">
      ¡INVENTARIO BAJO! Hay {{ stockAlertas.count }} repuestos con menos de 10 unidades.
    </div>

    <div v-if="cargando" class="cargando">Cargando métricas...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="metricas">
      <div :class="['card', 'card-' + getVehiculosColor()]">
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

    <div v-if="stockAlertas && stockAlertas.count > 0" class="card card-detalle-alerta">
      <h3>Detalle de Inventario Crítico (Bajo Stock)</h3>
      <ul>
        <li v-for="item in stockAlertas.items" :key="item.nombre">
          {{ item.nombre }} (Código: {{ item.codigo }}) - Quedan: {{ item.stock }}
        </li>
      </ul>
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
      API_ALERTAS_STOCK: 'http://localhost:3000/api/alertas/stock', // Nuevo endpoint
      stockAlertas: null, // Nuevo estado para alertas de inventario
    }
  },

  // HOOK DE NAVEGACIÓN
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.fetchData()
      vm.fetchAlertasStock() // Cargar alertas al entrar
    })
  },

  mounted() {
    this.fetchData()
    this.fetchAlertasStock() // Cargar alertas si es recarga completa (F5)
  },

  methods: {
    // FUNCIÓN DE LECTURA PRINCIPAL (GET /api/metricas)
    fetchData() {
      this.cargando = true
      this.error = null

      axios
        .get(this.API_URL)
        .then((response) => {
          this.metricas = response.data
          this.cargando = false
        })
        .catch(() => {
          this.error = 'Error al cargar Dashboard. ¿Está la API corriendo en el puerto 3000?'
          this.cargando = false
        })
    },

    // NUEVA FUNCIÓN: Obtener Alertas de Stock
    fetchAlertasStock() {
      axios
        .get(this.API_ALERTAS_STOCK)
        .then((response) => {
          this.stockAlertas = response.data
        })
        .catch((error) => {
          console.error('No se pudieron cargar las alertas de stock:', error)
        })
    },

    // NUEVA FUNCIÓN: Lógica para colores de la tarjeta de vehículos
    getVehiculosColor() {
      const count = this.metricas.vehiculosEnTaller
      if (count > 5) return 'saturado' // Alto número de vehículos
      if (count <= 1) return 'bajo' // Poca actividad
      return 'normal'
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
.alerta-inventario {
  background-color: #ff6b6b; /* Rojo fuerte */
  color: white;
  padding: 15px;
  margin-bottom: 25px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
}

.card-detalle-alerta {
  margin-top: 30px;
  background-color: #1e2a38;
  border: 1px solid #ff6b6b;
}
.card-detalle-alerta h3 {
  color: #ff6b6b;
  margin-bottom: 15px;
}
.card-detalle-alerta ul {
  list-style: none;
  padding: 0;
}
.card-detalle-alerta li {
  margin-bottom: 5px;
  font-size: 0.95em;
}

/* Indicadores de Capacidad en Tarjetas */
.card-saturado .numero {
  color: #ff6b6b;
} /* Rojo para vehículos > 10 */
.card-normal .numero {
  color: #42b983;
} /* Verde normal */
.card-bajo .numero {
  color: #f39c12;
} /* Naranja para poca actividad (<= 1) */
</style>
