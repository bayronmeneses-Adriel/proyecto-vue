<template>
  <div class="dashboard">
    <!-- HERO -->
    <section class="coches-hero">
      <div class="hero-row">
        <div>
          <h1>Panel de Control del Taller <span>🛠️</span></h1>
          <div class="coches-kpi mt-1">
            <i class="bi bi-speedometer2"></i>
            {{ metricas.vehiculosEnTaller ?? 0 }} en taller
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn-action start" @click="refrescar">
            <i class="bi bi-arrow-clockwise me-1"></i> Refrescar
          </button>
        </div>
      </div>
    </section>

    <!-- ALERTA DE INVENTARIO (si aplica) -->
    <div
      v-if="stockAlertas && stockAlertas.count > 0"
      class="alerta card round"
      role="status"
      aria-live="polite"
    >
      <div class="alerta-row">
        <span class="badge badge-peligro">
          <i class="bi bi-exclamation-triangle"></i> Inventario bajo
        </span>
        <span class="alerta-text">
          Hay <strong>{{ stockAlertas.count }}</strong> repuestos con menos de 10 unidades.
        </span>
      </div>
    </div>

    <!-- ESTADOS DE CARGA/ERROR -->
    <div v-if="cargando" class="muted center">Cargando métricas…</div>
    <div v-else-if="error" class="error center">{{ error }}</div>

    <!-- MÉTRICAS -->
    <div v-else class="metricas">
      <div :class="['card', 'card-' + getVehiculosColor()]">
        <h2>Vehículos en Taller</h2>
        <p class="numero">{{ metricas.vehiculosEnTaller }}</p>
        <small>Total en reparación o pendientes</small>
      </div>

      <div class="card">
        <h2>Mecánicos Disponibles</h2>
        <p class="numero numero-ok">{{ metricas.mecanicosDisponibles }}</p>
        <small>Mecánicos listos para un nuevo trabajo</small>
      </div>

      <div class="card">
        <h2>Servicios Pendientes</h2>
        <p class="numero numero-warn">{{ metricas.serviciosPendientes }}</p>
        <small>Tareas sin asignar o en espera</small>
      </div>
    </div>

    <!-- DETALLE ALERTAS DE STOCK -->
    <div v-if="stockAlertas && stockAlertas.count > 0" class="card card-detalle-alerta">
      <h3 class="mb-1">Detalle de Inventario Crítico</h3>
      <ul>
        <li v-for="item in stockAlertas.items" :key="item.nombre">
          <span class="badge badge-run">{{ item.codigo || '—' }}</span>
          <strong>{{ item.nombre }}</strong> — quedan <strong>{{ item.stock }}</strong>
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
      API_URL: '/api/metricas',
      API_ALERTAS_STOCK: '/api/alertas/stock',
      stockAlertas: null,
    }
  },

  // HOOK DE NAVEGACIÓN: Fuerza la recarga de datos al entrar a la vista
  beforeRouteEnter(to, from, next) {
    // La función 'next' accede a la instancia del componente (vm)
    next((vm) => {
      vm.refrescar()
    })
  },

  mounted() {
    // También se llama en la carga inicial (F5)
    this.refrescar()
  },

  methods: {
    // FUNCIÓN UNIFICADA PARA RECARGA DE AMBOS ENDPOINTS
    refrescar() {
      this.fetchData()
      this.fetchAlertasStock()
    },

    // GET /metricas (Datos principales del Dashboard)
    fetchData() {
      this.cargando = true
      this.error = null
      axios
        .get(this.API_URL)
        .then((res) => {
          this.metricas = res.data || {}
          this.cargando = false
        })
        .catch(() => {
          this.error = 'Error al cargar Dashboard. ¿Está la API corriendo en el puerto 3000?'
          this.cargando = false
        })
    },

    // GET /alertas/stock (Alerta de Inventario)
    fetchAlertasStock() {
      axios
        .get(this.API_ALERTAS_STOCK)
        .then((res) => (this.stockAlertas = res.data))
        .catch((e) => console.error('No se pudieron cargar las alertas de stock:', e))
    },

    // Lógica para colores de la tarjeta de vehículos
    getVehiculosColor() {
      const count = Number(this.metricas.vehiculosEnTaller || 0)
      if (count > 5) return 'saturado' // Rojo
      if (count <= 1) return 'bajo' // Naranja
      return 'normal' // Verde
    },
  },
}
</script>

<style scoped>
/* Contenedor ya está alineado con main.css por .dashboard */
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
}

/* Alerta superior */
.alerta {
  border: 1px solid var(--danger);
  background: var(--danger-10);
  box-shadow: var(--shadow-sm);
  margin: 12px 0 20px;
}
.alerta-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.alerta-text {
  color: var(--text);
}
.badge-peligro {
  background: var(--danger-10);
  color: var(--danger);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-weight: 800;
}

/* Grid de métricas */
.metricas {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 12px;
}
@media (min-width: 900px) {
  .metricas {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Card numbers */
.numero {
  font-size: 40px;
  line-height: 1;
  font-weight: 800;
  margin: 6px 0 2px;
}
.numero-ok {
  color: var(--success);
}
.numero-warn {
  color: var(--warning);
}

/* Reglas de color por estado para la 1a card (vehículos) */
.card-saturado .numero {
  color: var(--danger);
}
.card-normal .numero {
  color: var(--success);
}
.card-bajo .numero {
  color: var(--warning);
}

/* Detalle de alerta */
.card-detalle-alerta {
  margin-top: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.card-detalle-alerta ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  gap: 6px;
}
.card-detalle-alerta li {
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Utilidades locales */
.center {
  text-align: center;
}
</style>
