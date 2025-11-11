<template>
  <div class="clientes-view">
    <!-- HERO -->
    <section class="coches-hero">
      <div class="hero-row">
        <div>
          <h1>Gestión de Clientes <span>👥</span></h1>
          <div class="coches-kpi">
            <i class="bi bi-people"></i> {{ clientes.length }} registrados
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
          placeholder="Buscar por nombre, teléfono, email o dirección…"
          aria-label="Buscar cliente"
        />
      </div>
      <button
        class="filter-pill"
        :class="{ active: orden === 'reciente' }"
        @click="orden = 'reciente'"
      >
        Recientes
      </button>
      <button class="filter-pill" :class="{ active: orden === 'az' }" @click="orden = 'az'">
        A–Z
      </button>
    </div>

    <!-- CONTENIDO: LISTA + ASIDE -->
    <div class="grid-2">
      <!-- LISTA EN CARDS -->
      <section>
        <p v-if="cargando">Cargando clientes desde la base de datos…</p>
        <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>

        <div class="vehicle-list" v-else>
          <article v-for="c in clientesFiltrados" :key="c.id" class="vehicle-card">
            <div>
              <div class="vehicle-title">
                <strong>{{ c.nombre }}</strong>
                <span class="badge badge-muted">ID {{ c.id }}</span>
              </div>

              <div class="v-meta">
                <i class="bi bi-telephone"></i> {{ c.telefono || '—' }} ·
                <i class="bi bi-envelope"></i> {{ c.email || '—' }}
              </div>
              <div class="v-desc muted"><i class="bi bi-geo-alt"></i> {{ c.direccion || '—' }}</div>
            </div>

            <div class="v-actions">
              <button class="btn-action start" title="Editar" @click="abrirEdicion(c)">
                <i class="bi bi-pencil"></i> Editar
              </button>

              <button
                class="btn-action delete"
                title="Eliminar"
                @click="eliminarCliente(c.id, c.nombre)"
              >
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </article>

          <div v-if="clientesFiltrados.length === 0" class="empty">
            <i class="bi bi-inbox"></i>
            <div>No hay clientes que coincidan con el filtro.</div>
          </div>
        </div>
      </section>

      <!-- ASIDE: FORMULARIO NUEVO CLIENTE -->
      <aside class="coches-aside">
        <div class="card">
          <h2 class="mb-2">Registrar nuevo cliente</h2>
          <form @submit.prevent="agregarCliente">
            <div class="input-group">
              <input
                type="text"
                v-model="nuevoCliente.nombre"
                placeholder="Nombre completo"
                required
              />
              <input type="text" v-model="nuevoCliente.telefono" placeholder="Teléfono" required />
            </div>
            <div class="input-group">
              <input type="email" v-model="nuevoCliente.email" placeholder="Correo electrónico" />
              <input type="text" v-model="nuevoCliente.direccion" placeholder="Dirección" />
            </div>
            <button type="submit" class="btn-action primary-submit w-100">
              <i class="bi bi-person-plus me-1"></i> Registrar cliente
            </button>
          </form>

          <p v-if="mensajeExito" class="exito mt-2">{{ mensajeExito }}</p>
          <p v-if="errorCreacion" class="error mt-2">{{ errorCreacion }}</p>
        </div>
      </aside>
    </div>

    <!-- MODAL EDICIÓN -->
    <div v-if="clienteSeleccionado" class="modal-backdrop" @click.self="cancelarEdicion">
      <div class="modal-content">
        <h2>Editar: {{ clienteSeleccionado.nombre }}</h2>
        <form @submit.prevent="guardarEdicion">
          <div class="input-group">
            <input
              type="text"
              v-model="clienteSeleccionado.nombre"
              placeholder="Nombre completo"
              required
            />
            <input type="text" v-model="clienteSeleccionado.telefono" placeholder="Teléfono" />
          </div>
          <div class="input-group">
            <input
              type="email"
              v-model="clienteSeleccionado.email"
              placeholder="Correo electrónico"
            />
            <input type="text" v-model="clienteSeleccionado.direccion" placeholder="Dirección" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-action delete" @click="cancelarEdicion">
              Cancelar
            </button>
            <button type="submit" class="btn-action complete">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      clientes: [],
      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      API_URL: '/api/clientes',

      nuevoCliente: { nombre: '', telefono: '', email: '', direccion: '' },
      clienteSeleccionado: null,
      mensajeExito: null,

      // filtros UI
      query: '',
      orden: 'reciente', // 'reciente' | 'az'
    }
  },
  computed: {
    clientesFiltrados() {
      let arr = [...this.clientes]
      const q = this.query.trim().toLowerCase()

      // búsqueda
      if (q) {
        arr = arr.filter((c) =>
          [c.nombre, c.telefono, c.email, c.direccion].some((v) =>
            String(v || '')
              .toLowerCase()
              .includes(q),
          ),
        )
      }
      // orden
      if (this.orden === 'az')
        arr.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')))
      else arr.sort((a, b) => Number(b.id) - Number(a.id))

      return arr
    },
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    // GET
    fetchData() {
      this.cargando = true
      axios
        .get(this.API_URL)
        .then((res) => {
          this.clientes = res.data
          this.cargando = false
        })
        .catch(() => {
          this.errorLectura = 'No se pudo conectar a la API para cargar clientes.'
          this.cargando = false
        })
    },

    // POST
    async agregarCliente() {
      this.errorCreacion = null
      this.mensajeExito = null
      try {
        const { data } = await axios.post(this.API_URL, this.nuevoCliente)
        this.clientes.unshift(data)
        this.mensajeExito = `Cliente ${data.nombre} registrado con éxito.`
        this.nuevoCliente = { nombre: '', telefono: '', email: '', direccion: '' }
      } catch (error) {
        this.errorCreacion = 'Error al registrar cliente. Intente de nuevo.'
        console.error('Error al agregar cliente:', error)
      }
    },

    // Modal
    abrirEdicion(cliente) {
      this.clienteSeleccionado = { ...cliente }
    },
    cancelarEdicion() {
      this.clienteSeleccionado = null
      this.errorCreacion = null
    },

    // PUT
    async guardarEdicion() {
      this.errorCreacion = null
      const c = this.clienteSeleccionado
      try {
        await axios.put(`${this.API_URL}/${c.id}`, c)
        const i = this.clientes.findIndex((x) => x.id === c.id)
        if (i !== -1) this.clientes.splice(i, 1, c)
        this.mensajeExito = `Cliente '${c.nombre}' actualizado con éxito.`
        this.cancelarEdicion()
      } catch (error) {
        this.errorCreacion = 'Error al guardar los cambios del cliente.'
        console.error('Error al actualizar cliente:', error)
      }
    },

    // DELETE
    async eliminarCliente(id, nombre) {
      if (!confirm(`¿Está seguro de eliminar al cliente ${nombre}? Esta acción es permanente.`))
        return
      try {
        await axios.delete(`${this.API_URL}/${id}`)
        this.clientes = this.clientes.filter((x) => x.id !== id)
        this.mensajeExito = `Cliente ${nombre} eliminado correctamente.`
      } catch (error) {
        this.errorLectura = `No se pudo eliminar al cliente ${nombre}.`
        console.error('Error al eliminar cliente:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Reusa estilos globales de main.css: hero, filtros, grid, cards */

/* Modal (mismos tokens del sistema) */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: var(--surface);
  color: var(--text);
  padding: 24px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  width: 90%;
  max-width: 520px;
}
.modal-content h2 {
  color: var(--text);
  margin-bottom: 12px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
