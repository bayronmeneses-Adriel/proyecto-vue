<template>
  <div class="mecanicos-view">
    <!-- HERO -->
    <section class="coches-hero">
      <div class="hero-row">
        <div>
          <h1>Personal del Taller <span>🔧</span></h1>
          <div class="coches-kpi">
            <i class="bi bi-person-gear"></i>
            {{ disponibles.length }} disponibles de {{ mecanicos.length }}
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn-action start" @click="fetchData">
            <i class="bi bi-arrow-clockwise me-1"></i> Refrescar
          </button>
        </div>
      </div>
    </section>

    <!-- FILTROS -->
    <div class="coches-filtros">
      <div class="search">
        <i class="bi bi-search"></i>
        <input
          v-model="query"
          type="text"
          placeholder="Buscar por nombre o especialidad…"
          aria-label="Buscar mecánico"
        />
      </div>

      <button
        class="filter-pill"
        :class="{ active: fEstado === 'Todos' }"
        @click="fEstado = 'Todos'"
      >
        Todos
      </button>
      <button
        class="filter-pill"
        :class="{ active: fEstado === 'Disponible' }"
        @click="fEstado = 'Disponible'"
      >
        Disponibles
      </button>
      <button
        class="filter-pill"
        :class="{ active: fEstado === 'Ocupado' }"
        @click="fEstado = 'Ocupado'"
      >
        Ocupados
      </button>
    </div>

    <!-- CONTENIDO: LISTA + ASIDE -->
    <div class="grid-2">
      <!-- LISTA EN CARDS -->
      <section>
        <p v-if="cargando">Cargando personal desde la base de datos…</p>
        <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>

        <div class="vehicle-list" v-else>
          <article v-for="m in mecanicosFiltrados" :key="m.id" class="vehicle-card">
            <div>
              <div class="vehicle-title">
                <strong>{{ m.nombre }}</strong>
                <span class="badge" :class="m.disponible ? 'badge-done' : 'badge-run'">
                  {{ m.disponible ? 'Disponible' : 'Ocupado' }}
                </span>
              </div>

              <div class="v-meta">
                <i class="bi bi-tools"></i> {{ m.especialidad || 'General' }}
                <span v-if="Number(m.ordenesActivas) >= 0">
                  · <i class="bi bi-briefcase"></i> OT activas:
                  <strong>{{ m.ordenesActivas || 0 }}</strong>
                </span>
              </div>

              <div class="v-desc muted">
                {{ m.nota || '—' }}
              </div>
            </div>

            <div class="v-actions">
              <button
                class="btn-action start"
                @click="toggleDisponibilidad(m)"
                :title="m.disponible ? 'Marcar Ocupado' : 'Marcar Disponible'"
              >
                {{ m.disponible ? 'Marcar Ocupado' : 'Marcar Disponible' }}
              </button>

              <button class="btn-action delete" @click="eliminarMecanico(m.id)" title="Eliminar">
                Eliminar <i class="bi bi-trash"></i>
              </button>
            </div>
          </article>

          <div v-if="mecanicosFiltrados.length === 0" class="empty">
            <i class="bi bi-inbox"></i>
            <div>No hay mecánicos que coincidan con el filtro.</div>
          </div>
        </div>
      </section>

      <!-- ASIDE: FORMULARIO NUEVO MECÁNICO -->
      <aside class="coches-aside">
        <div class="card">
          <h2 class="mb-2">Contratar nuevo mecánico</h2>

          <form @submit.prevent="agregarMecanico">
            <div class="input-group">
              <input
                type="text"
                v-model="nuevoMecanico.nombre"
                placeholder="Nombre completo"
                required
              />
              <input
                type="text"
                v-model="nuevoMecanico.especialidad"
                placeholder="Especialidad (Ej.: Motores)"
                required
              />
            </div>

            <button type="submit" class="btn-action primary-submit w-100">
              <i class="bi bi-person-plus me-1"></i> Añadir a la plantilla
            </button>
          </form>

          <p v-if="mensajeExito" class="exito mt-2">{{ mensajeExito }}</p>
          <p v-if="errorCreacion" class="error mt-2">{{ errorCreacion }}</p>
        </div>
      </aside>
    </div>
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
      API_URL: '/api/mecanicos',

      // formulario
      nuevoMecanico: { nombre: '', especialidad: '', disponible: true },
      mensajeExito: null,

      // filtros UI
      query: '',
      fEstado: 'Todos',
    }
  },
  computed: {
    disponibles() {
      return this.mecanicos.filter((m) => m.disponible)
    },
    mecanicosFiltrados() {
      const q = this.query.trim().toLowerCase()
      return this.mecanicos
        .filter((m) => {
          if (this.fEstado === 'Todos') return true
          if (this.fEstado === 'Disponible') return !!m.disponible
          if (this.fEstado === 'Ocupado') return !m.disponible
          return true
        })
        .filter((m) => {
          if (!q) return true
          return [m.nombre, m.especialidad].some((v) =>
            String(v || '')
              .toLowerCase()
              .includes(q),
          )
        })
    },
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.cargando = true
      this.errorLectura = null
      try {
        const { data } = await axios.get(this.API_URL)
        this.mecanicos = data
      } catch (error) {
        this.errorLectura = 'Error al cargar la lista de mecánicos.'
        console.error('ERROR AL CARGAR MECÁNICOS:', error)
      } finally {
        this.cargando = false
      }
    },

    async agregarMecanico() {
      this.errorCreacion = null
      this.mensajeExito = null
      try {
        const { data } = await axios.post(this.API_URL, this.nuevoMecanico)
        this.mecanicos.unshift(data)
        this.mensajeExito = `¡${data.nombre} contratado con éxito!`
        this.nuevoMecanico = { nombre: '', especialidad: '', disponible: true }
      } catch (error) {
        this.errorCreacion = 'Error al contratar. Revisa la conexión al Backend.'
        console.error('Error al agregar mecánico:', error)
      }
    },

    async toggleDisponibilidad(m) {
      const nuevoEstado = !m.disponible
      try {
        await axios.put(`${this.API_URL}/${m.id}`, {
          nombre: m.nombre,
          especialidad: m.especialidad,
          disponible: nuevoEstado,
        })
        m.disponible = nuevoEstado
        this.mensajeExito = `${m.nombre} marcado como ${nuevoEstado ? 'DISPONIBLE' : 'OCUPADO'}.`
      } catch (error) {
        this.errorLectura = 'No se pudo actualizar la disponibilidad.'
        console.error('Error al actualizar disponibilidad:', error)
      }
    },

    async eliminarMecanico(id) {
      if (!confirm(`¿Está seguro de despedir al mecánico con ID ${id}? Esta acción es permanente.`))
        return
      try {
        await axios.delete(`${this.API_URL}/${id}`)
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
/* Reusa estilos globales del main.css: hero, filtros, grid, cards */

/* Ajuste mínimo de contenedor (ya tienes padding global por vista) */
.mecanicos-view {
  max-width: 12000px;
  margin: 0 auto;
}

/* Nada más aquí: todo lo demás lo hereda de main.css */
</style>
