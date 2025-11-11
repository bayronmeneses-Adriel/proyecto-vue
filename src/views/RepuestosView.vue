<template>
  <div class="repuestos-view">
    <!-- HERO -->
    <section class="coches-hero">
      <div class="hero-row">
        <div>
          <h1>Inventario (Repuestos) <span>📦</span></h1>
          <div class="coches-kpi">
            <i class="bi bi-box-seam"></i> {{ repuestos.length }} repuestos
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
          placeholder="Buscar por nombre, código, fabricante…"
          aria-label="Buscar repuesto"
        />
      </div>

      <button class="filter-pill" :class="{ active: fStock === 'Todos' }" @click="fStock = 'Todos'">
        Todos
      </button>
      <button class="filter-pill" :class="{ active: fStock === 'Bajo' }" @click="fStock = 'Bajo'">
        Stock bajo
      </button>
      <button class="filter-pill" :class="{ active: fStock === 'Sin' }" @click="fStock = 'Sin'">
        Sin stock
      </button>
    </div>

    <!-- CONTENIDO: LISTA + ASIDE -->
    <div class="grid-2">
      <!-- LISTA EN CARDS -->
      <section>
        <p v-if="cargando">Cargando inventario...</p>
        <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>

        <div class="vehicle-list" v-else>
          <article v-for="r in repuestosFiltrados" :key="r.id" class="vehicle-card">
            <div>
              <div class="vehicle-title">
                <strong>{{ r.nombre }}</strong>
                <span
                  class="badge"
                  :class="
                    r.stock === 0
                      ? 'badge-pend'
                      : r.stock <= (r.minimo || 0)
                        ? 'badge-run'
                        : 'badge-done'
                  "
                >
                  {{ r.stock === 0 ? 'Sin stock' : r.stock <= (r.minimo || 0) ? 'Bajo' : 'Óptimo' }}
                </span>
              </div>

              <div class="v-meta">
                <i class="bi bi-upc-scan"></i> {{ r.codigo || '—' }} ·
                <i class="bi bi-building"></i> {{ r.fabricante || '—' }}
              </div>

              <div class="v-desc muted">
                Stock: <strong>{{ r.stock }}</strong>
                <span v-if="r.minimo !== undefined"> (mín: {{ r.minimo }})</span>
                · Precio: <strong>\${{ formatPrice(r.precio) }}</strong>
              </div>
            </div>

            <div class="v-actions">
              <button class="btn-action start" @click="abrirEdicion(r)" title="Editar">
                <i class="bi bi-pencil"></i> Editar
              </button>

              <button class="btn-action delete" @click="eliminarRepuesto(r.id)" title="Eliminar">
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </article>

          <div v-if="repuestosFiltrados.length === 0" class="empty">
            <i class="bi bi-inbox"></i>
            <div>No hay repuestos que coincidan con el filtro.</div>
          </div>
        </div>
      </section>

      <!-- ASIDE: FORM NUEVO REPUESTO -->
      <aside class="coches-aside">
        <div class="card">
          <h2 class="mb-2">Registrar nuevo repuesto</h2>
          <form @submit.prevent="agregarRepuesto">
            <div class="input-group">
              <input type="text" v-model="nuevoRepuesto.nombre" placeholder="Nombre" required />
              <input
                type="text"
                v-model="nuevoRepuesto.codigo"
                placeholder="Código (Ej: FSA123)"
                required
              />
            </div>
            <div class="input-group">
              <input type="text" v-model="nuevoRepuesto.fabricante" placeholder="Fabricante" />
            </div>
            <div class="input-group">
              <input
                type="number"
                v-model.number="nuevoRepuesto.stock"
                placeholder="Stock inicial"
                required
              />
              <input
                type="number"
                step="0.01"
                v-model.number="nuevoRepuesto.precio"
                placeholder="Precio (Ej: 15.50)"
                required
              />
            </div>
            <button type="submit" class="btn-action primary-submit w-100">
              <i class="bi bi-plus-lg me-1"></i> Añadir a inventario
            </button>
          </form>

          <p v-if="mensajeExito" class="exito mt-2">{{ mensajeExito }}</p>
          <p v-if="errorCreacion" class="error mt-2">{{ errorCreacion }}</p>
        </div>
      </aside>
    </div>

    <!-- MODAL EDICIÓN -->
    <div v-if="repuestoSeleccionado" class="modal-backdrop" @click.self="cancelarEdicion">
      <div class="modal-content">
        <h2>Editar: {{ repuestoSeleccionado.nombre }}</h2>
        <form @submit.prevent="guardarEdicion">
          <div class="input-group">
            <input
              type="text"
              v-model="repuestoSeleccionado.nombre"
              placeholder="Nombre"
              required
            />
            <input type="text" v-model="repuestoSeleccionado.fabricante" placeholder="Fabricante" />
          </div>
          <div class="input-group">
            <input
              type="number"
              v-model.number="repuestoSeleccionado.stock"
              placeholder="Stock"
              required
            />
            <input
              type="number"
              step="0.01"
              v-model.number="repuestoSeleccionado.precio"
              placeholder="Precio"
              required
            />
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
      repuestos: [],
      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      mensajeExito: null,

      API_URL: '/api/repuestos',
      repuestoSeleccionado: null,

      // formulario nuevo
      nuevoRepuesto: { nombre: '', codigo: '', fabricante: '', stock: null, precio: null },

      // filtros UI
      query: '',
      fStock: 'Todos',
    }
  },
  computed: {
    repuestosFiltrados() {
      let arr = [...this.repuestos]
      const q = this.query.trim().toLowerCase()

      // filtro por estado de stock
      arr = arr.filter((r) => {
        if (this.fStock === 'Todos') return true
        if (this.fStock === 'Sin') return r.stock === 0
        if (this.fStock === 'Bajo') return r.stock > 0 && r.stock <= (r.minimo || 0)
        return true
      })

      // búsqueda
      if (q) {
        arr = arr.filter((r) =>
          [r.nombre, r.codigo, r.fabricante].some((v) =>
            String(v || '')
              .toLowerCase()
              .includes(q),
          ),
        )
      }
      return arr
    },
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    formatPrice(v) {
      const n = Number(v || 0)
      return n.toFixed(2)
    },

    // GET
    async fetchData() {
      this.cargando = true
      this.errorLectura = null
      try {
        const { data } = await axios.get(this.API_URL)
        this.repuestos = data
      } catch (error) {
        this.errorLectura = 'No se pudo conectar a la API para cargar el inventario.'
        console.error('ERROR FETCH:', error)
      } finally {
        this.cargando = false
      }
    },

    // POST
    async agregarRepuesto() {
      this.errorCreacion = null
      this.mensajeExito = null
      try {
        if (
          this.nuevoRepuesto.stock < 0 ||
          this.nuevoRepuesto.precio <= 0 ||
          this.nuevoRepuesto.stock === null ||
          this.nuevoRepuesto.precio === null
        ) {
          this.errorCreacion = 'El Stock debe ser positivo y el Precio mayor a cero.'
          return
        }
        const { data } = await axios.post(this.API_URL, this.nuevoRepuesto)
        this.repuestos.unshift(data)
        this.mensajeExito = `Repuesto '${data.nombre}' agregado al inventario.`
        this.nuevoRepuesto = { nombre: '', codigo: '', fabricante: '', stock: null, precio: null }
      } catch (error) {
        this.errorCreacion = 'Error al agregar repuesto. Revise si el código ya existe.'
        console.error('Error al agregar repuesto:', error)
      }
    },

    // Modal
    abrirEdicion(repuesto) {
      this.repuestoSeleccionado = { ...repuesto }
    },
    cancelarEdicion() {
      this.repuestoSeleccionado = null
      this.errorCreacion = null
    },

    // PUT
    async guardarEdicion() {
      this.errorCreacion = null
      const r = this.repuestoSeleccionado
      if (r.stock < 0 || r.precio <= 0) {
        this.errorCreacion = 'El Stock debe ser positivo y el Precio mayor a cero.'
        return
      }
      try {
        await axios.put(`${this.API_URL}/${r.id}`, r)
        const i = this.repuestos.findIndex((x) => x.id === r.id)
        if (i !== -1) this.repuestos.splice(i, 1, r)
        this.mensajeExito = `Repuesto '${r.nombre}' actualizado con éxito.`
        this.cancelarEdicion()
      } catch (error) {
        this.errorCreacion = 'Error al guardar los cambios.'
        console.error('Error al actualizar:', error)
      }
    },

    // DELETE
    async eliminarRepuesto(id) {
      if (!confirm(`¿Está seguro de eliminar este repuesto del inventario?`)) return
      try {
        await axios.delete(`${this.API_URL}/${id}`)
        this.repuestos = this.repuestos.filter((r) => r.id !== id)
        this.mensajeExito = `Repuesto eliminado correctamente.`
        this.errorLectura = null
      } catch (error) {
        this.errorLectura = `No se pudo eliminar el repuesto.`
        console.error('Error al eliminar repuesto:', error)
      }
    },
  },
}
</script>

<style scoped>
/* Reusa estilos globales (hero, filtros, grid, cards) de main.css */

/* Ajustes mínimos del modal con tokens globales */
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
  background-color: var(--surface);
  padding: 24px;
  border-radius: var(--radius);
  width: 90%;
  max-width: 520px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}
.modal-content h2 {
  color: var(--text);
  margin-bottom: 16px;
}
.modal-content input {
  width: 100%;
  margin-bottom: 12px;
  background-color: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}
</style>
