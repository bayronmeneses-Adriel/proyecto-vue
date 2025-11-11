<template>
  <div class="coches-view">
    <!-- HERO -->
    <section class="coches-hero">
      <div class="hero-row">
        <div>
          <h1>Gestión de Vehículos <span>🚗</span></h1>
          <div class="coches-kpi mt-2">
            <i class="bi bi-speedometer2"></i> {{ coches.length }} en el taller
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
          type="text"
          v-model="query"
          placeholder="Buscar por placa, modelo, problema o mecánico…"
          aria-label="Buscar"
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
        :class="{ active: fEstado === 'Pendiente' }"
        @click="fEstado = 'Pendiente'"
      >
        Pendiente
      </button>
      <button
        class="filter-pill"
        :class="{ active: fEstado === 'En reparación' }"
        @click="fEstado = 'En reparación'"
      >
        En reparación
      </button>
      <button
        class="filter-pill"
        :class="{ active: fEstado === 'Listo para entrega' }"
        @click="fEstado = 'Listo para entrega'"
      >
        Listo
      </button>
    </div>

    <!-- CONTENIDO: LISTADO + ASIDE -->
    <div class="grid-2">
      <!-- LISTADO EN CARDS -->
      <section>
        <p v-if="cargando">Cargando vehículos desde la API…</p>
        <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>
        <p v-else class="muted">Total de vehículos en el taller: {{ coches.length }}</p>

        <div class="vehicle-list" v-if="!cargando && !errorLectura">
          <article v-for="coche in cochesFiltrados" :key="coche.id" class="vehicle-card">
            <div>
              <div class="vehicle-title">
                <span class="plate">{{ coche.matricula }}</span>
                <strong>{{ coche.modelo }}</strong>
                <span
                  class="badge"
                  :class="{
                    'badge-pend': coche.estado === 'Pendiente',
                    'badge-run': coche.estado === 'En reparación',
                    'badge-done': coche.estado === 'Listo para entrega',
                  }"
                >
                  {{ coche.estado }}
                </span>
              </div>

              <div class="v-meta">
                <i class="bi bi-person"></i>
                Cliente: <strong>{{ coche.cliente_id ?? 'N/A' }}</strong>
                ·
                <i class="bi bi-wrench-adjustable"></i>
                Mecánico: <strong>{{ coche.mecanicoAsignado || 'Sin Asignar' }}</strong>
              </div>

              <div class="v-desc">
                {{ coche.problema_descripcion }}
              </div>
            </div>

            <div class="v-actions">
              <button
                v-if="coche.estado === 'Pendiente'"
                @click="actualizarEstado(coche.id, 'En reparación', coche.mecanicoAsignado)"
                class="btn-action start"
                title="Iniciar reparación"
              >
                <i class="bi bi-play-fill"></i> Iniciar
              </button>

              <button
                v-else-if="coche.estado === 'En reparación'"
                @click="actualizarEstado(coche.id, 'Listo para entrega', coche.mecanicoAsignado)"
                class="btn-action complete"
                title="Marcar listo para entrega"
              >
                <i class="bi bi-check2-circle"></i> Finalizar
              </button>

              <button
                v-if="coche.estado === 'Listo para entrega' || coche.estado === 'Pendiente'"
                @click="eliminarCoche(coche.id)"
                class="btn-action delete"
                title="Eliminar"
              >
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </article>

          <!-- Estado vacío elegante -->
          <div v-if="cochesFiltrados.length === 0" class="empty">
            <i class="bi bi-inbox"></i>
            <div>No hay vehículos que coincidan con el filtro.</div>
          </div>
        </div>
      </section>

      <!-- ASIDE: FORMULARIO DE REGISTRO Y ASIGNACIÓN -->
      <aside class="coches-aside">
        <div class="card">
          <h2 class="mb-2">Registrar vehículo y asignar</h2>

          <form class="form-modern" @submit.prevent="agregarCoche">
            <!-- DATOS -->
            <p class="section-title">Datos del vehículo</p>
            <div class="grid-2">
              <div class="field">
                <label>Placas <span class="req">*</span></label>
                <input
                  type="text"
                  v-model="nuevoCoche.matricula"
                  placeholder="Ej.: NEW-111"
                  required
                />
              </div>
              <div class="field">
                <label>Modelo <span class="req">*</span></label>
                <input
                  type="text"
                  v-model="nuevoCoche.modelo"
                  placeholder="Ej.: Audi A4"
                  required
                />
              </div>
            </div>

            <div class="field">
              <label>Descripción del problema</label>
              <textarea
                v-model="nuevoCoche.problema_descripcion"
                rows="3"
                placeholder="Detalla el problema o servicio solicitado"
              ></textarea>
            </div>

            <!-- ASIGNACIÓN -->
            <div class="divider"></div>
            <p class="section-title">Asignación</p>
            <div class="grid-2">
              <div class="field">
                <label>Cliente <span class="req">*</span></label>
                <select v-model="nuevoCoche.cliente_id" required>
                  <option :value="null" disabled>— Seleccione el Cliente —</option>
                  <option v-for="c in listaClientes" :key="c.id" :value="c.id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Mecánico <span class="req">*</span></label>
                <select v-model="nuevoCoche.mecanicoAsignado" required>
                  <option :value="null" disabled>— Seleccione Mecánico —</option>
                  <option v-for="m in mecanicosDisponibles" :key="m.id" :value="m.nombre">
                    {{ m.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <!-- INVENTARIO -->
            <div class="divider"></div>
            <p class="section-title">Consumo de inventario</p>

            <div class="inv-row">
              <select v-model="repuestoSeleccionadoId">
                <option :value="null" disabled>— Añadir repuesto —</option>
                <option v-for="r in listaRepuestos" :key="r.id" :value="r.id">
                  {{ r.nombre }} (Stock: {{ r.stock }})
                </option>
              </select>

              <div class="qty">
                <button type="button" class="qty-btn" @click="decQty">−</button>
                <input
                  type="number"
                  inputmode="numeric"
                  v-model.number="cantidadRepuesto"
                  min="1"
                  step="1"
                />
                <button type="button" class="qty-btn" @click="incQty">+</button>
              </div>

              <button
                type="button"
                class="btn-action start add-btn"
                :disabled="!repuestoSeleccionadoId || cantidadRepuesto <= 0"
                @click="agregarRepuestoAlFormulario"
              >
                Añadir
              </button>
            </div>

            <ul v-if="nuevoCoche.repuestosUsados.length" class="chips">
              <li v-for="(item, i) in nuevoCoche.repuestosUsados" :key="i" class="chip">
                {{ item.nombre }} × {{ item.cantidad }}
                <button type="button" class="chip-x" @click="removerRepuesto(i)">✕</button>
              </li>
            </ul>

            <button type="submit" class="btn-action primary-submit w-100">
              Registrar y Asignar
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
      coches: [],
      listaClientes: [],
      mecanicosDisponibles: [],
      listaRepuestos: [],

      // Filtros UI
      query: '',
      fEstado: 'Todos',

      // Vars temporales inventario
      repuestoSeleccionadoId: null,
      cantidadRepuesto: 1,

      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      mensajeExito: null,

      API_URL: '/api/coches',
      API_MECANICOS: '/api/mecanicos/disponibles',
      API_CLIENTES: '/api/clientes/lista',
      API_REPUESTOS: '/api/repuestos',
      API_INVENTARIO_CONSUMO: '/api/inventario/consumir',

      nuevoCoche: {
        matricula: '',
        modelo: '',
        problema_descripcion: '',
        estado: 'Pendiente',
        mecanicoAsignado: null,
        cliente_id: null,
        repuestosUsados: [],
      },
    }
  },
  computed: {
    cochesFiltrados() {
      const q = this.query.trim().toLowerCase()
      return this.coches
        .filter((c) => (this.fEstado === 'Todos' ? true : c.estado === this.fEstado))
        .filter((c) => {
          if (!q) return true
          return (
            String(c.matricula || '')
              .toLowerCase()
              .includes(q) ||
            String(c.modelo || '')
              .toLowerCase()
              .includes(q) ||
            String(c.problema_descripcion || '')
              .toLowerCase()
              .includes(q) ||
            String(c.mecanicoAsignado || '')
              .toLowerCase()
              .includes(q) ||
            String(c.cliente_id || '')
              .toLowerCase()
              .includes(q)
          )
        })
    },
  },
  mounted() {
    this.fetchData()
    this.fetchMecanicosDisponibles()
    this.fetchClientes()
    this.fetchRepuestos()
  },
  methods: {
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
    fetchMecanicosDisponibles() {
      axios
        .get(this.API_MECANICOS)
        .then((response) => (this.mecanicosDisponibles = response.data))
        .catch((e) => console.error('Error al cargar mecánicos disponibles:', e))
    },
    fetchClientes() {
      axios
        .get(this.API_CLIENTES)
        .then((response) => (this.listaClientes = response.data))
        .catch((e) => console.error('Error al cargar lista de clientes:', e))
    },
    fetchRepuestos() {
      axios
        .get(this.API_REPUESTOS)
        .then((response) => (this.listaRepuestos = response.data))
        .catch((e) => console.error('Error al cargar repuestos:', e))
    },
    agregarRepuestoAlFormulario() {
      this.errorCreacion = null
      if (!this.repuestoSeleccionadoId || this.cantidadRepuesto <= 0) {
        this.errorCreacion = 'Debe seleccionar un repuesto y una cantidad válida.'
        return
      }
      const repuesto = this.listaRepuestos.find((r) => r.id === this.repuestoSeleccionadoId)
      if (!repuesto) return

      const idx = this.nuevoCoche.repuestosUsados.findIndex((i) => i.id === repuesto.id)
      const nuevaCantidad =
        (idx !== -1 ? this.nuevoCoche.repuestosUsados[idx].cantidad : 0) + this.cantidadRepuesto

      if (repuesto.stock < nuevaCantidad) {
        this.errorCreacion = `Stock insuficiente para ${repuesto.nombre}. Solo quedan ${repuesto.stock} unidades.`
        return
      }

      if (idx !== -1) {
        this.nuevoCoche.repuestosUsados[idx].cantidad = nuevaCantidad
      } else {
        this.nuevoCoche.repuestosUsados.push({
          id: repuesto.id,
          nombre: repuesto.nombre,
          cantidad: this.cantidadRepuesto,
        })
      }

      this.mensajeExito = `Añadido ${this.cantidadRepuesto}× ${repuesto.nombre} a la orden.`
      this.repuestoSeleccionadoId = null
      this.cantidadRepuesto = 1
    },
    removerRepuesto(index) {
      this.nuevoCoche.repuestosUsados.splice(index, 1)
    },
    async agregarCoche() {
      this.errorCreacion = null
      this.mensajeExito = null

      if (!this.nuevoCoche.mecanicoAsignado || !this.nuevoCoche.cliente_id) {
        this.errorCreacion =
          'Debe seleccionar tanto el Mecánico como el Cliente para registrar el vehículo.'
        return
      }
      if (this.nuevoCoche.repuestosUsados.length === 0) {
        this.errorCreacion =
          'Es necesario ingresar un producto en Consumo de Inventario antes de registrar.'
        return
      }

      try {
        if (this.nuevoCoche.repuestosUsados.length > 0) {
          await axios.post(this.API_INVENTARIO_CONSUMO, { items: this.nuevoCoche.repuestosUsados })
        }
        const response = await axios.post(this.API_URL, this.nuevoCoche)
        this.coches.unshift(response.data)
        this.mensajeExito = `Vehículo ${response.data.matricula} añadido y asignado.`
        this.nuevoCoche = {
          matricula: '',
          modelo: '',
          problema_descripcion: '',
          estado: 'Pendiente',
          mecanicoAsignado: null,
          cliente_id: null,
          repuestosUsados: [],
        }
        this.repuestoSeleccionadoId = null
        this.cantidadRepuesto = 1
        this.fetchMecanicosDisponibles()
        this.fetchRepuestos()
      } catch (error) {
        if (error.response?.status === 409) {
          this.errorCreacion =
            error.response.data.message || 'Error: matrícula ya existe o stock insuficiente.'
        } else {
          this.errorCreacion = 'No se pudo crear el vehículo. Revisa la API.'
        }
        console.error('Error al agregar coche:', error)
      }
    },
    async actualizarEstado(id, nuevoEstado, mecanicoAsignado) {
      try {
        const url = `${this.API_URL}/${id}`
        const asignacion = nuevoEstado === 'Listo para entrega' ? null : mecanicoAsignado
        await axios.put(url, { estado: nuevoEstado, mecanicoAsignado: asignacion })
        const i = this.coches.findIndex((c) => c.id === id)
        if (i !== -1) {
          this.coches[i].estado = nuevoEstado
          this.coches[i].mecanicoAsignado = asignacion
        }
        this.fetchMecanicosDisponibles()
      } catch (error) {
        this.errorLectura = 'No se pudo actualizar el estado del coche.'
        console.error('Error al actualizar:', error)
      }
    },
    async eliminarCoche(id) {
      if (
        !confirm(
          `¿Está seguro de eliminar el vehículo con ID ${id}? Esta acción no se puede deshacer.`,
        )
      )
        return
      try {
        await axios.delete(`${this.API_URL}/${id}`)
        this.coches = this.coches.filter((c) => c.id !== id)
        this.mensajeExito = `Vehículo con ID ${id} eliminado correctamente.`
        this.errorLectura = null
      } catch (error) {
        this.errorLectura = `No se pudo eliminar el coche con ID ${id}.`
        console.error('Error al eliminar:', error)
      }
    },

    // MÉTODOS PARA EL CONTROL DE CANTIDAD
    incQty() {
      this.cantidadRepuesto += 1
    },

    decQty() {
      if (this.cantidadRepuesto > 1) {
        this.cantidadRepuesto -= 1
      }
    },
  },
}
</script>

<style scoped>
/* ====== HERO ====== */
.coches-hero {
  background: linear-gradient(180deg, #f4f7ff, transparent);
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
  padding: 18px 0;
}
.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.coches-kpi {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  background: var(--primary-10);
  color: var(--primary);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-weight: 800;
}
.hero-actions {
  display: flex;
  gap: 8px;
}

/* ====== FILTROS ====== */
.coches-filtros {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}
.coches-filtros .search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
}
.coches-filtros .search input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  color: var(--text);
}
.filter-pill {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}
.filter-pill:hover {
  background: #f3f4f6;
}
.filter-pill.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* ====== GRID ====== */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 992px) {
  .grid-2 {
    grid-template-columns: 1.6fr 0.9fr;
  }
}

/* ====== CARDS LIST ====== */
.vehicle-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 992px) {
  .vehicle-list {
    grid-template-columns: 1fr 1fr;
  }
}

.vehicle-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;
}
.vehicle-card:hover {
  background: var(--surface-2);
  box-shadow: var(--shadow);
}

.vehicle-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.plate {
  font-family: ui-monospace, Menlo, monospace;
  background: var(--info-10);
  color: var(--info);
  border-radius: 10px;
  padding: 0.2rem 0.5rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.v-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 6px;
}
.v-desc {
  font-size: 0.92rem;
}
.v-actions {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.v-actions .btn-action {
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--border);
  background: var(--surface);
}
.v-actions .btn-action:hover {
  background: #f3f4f6;
}

/* Badges estado */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
}
.badge-pend {
  background: color-mix(in srgb, var(--warning) 14%, #fff);
  color: var(--warning);
}
.badge-run {
  background: var(--info-10);
  color: var(--info);
}
.badge-done {
  background: var(--success-10);
  color: var(--success);
}
.badge-muted {
  background: #eef2f7;
  color: var(--text-muted);
}

/* ====== ASIDE FORM ====== */
.coches-aside {
  position: sticky;
  top: 16px;
  height: max-content;
}
.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0.3rem 0;
}
.step strong {
  color: var(--text);
}

.inv-row {
  display: grid;
  grid-template-columns: 1fr 96px;
  gap: 0.5rem;
}
.inv-row .qty-group {
  display: flex;
}
.inv-row .qty-group input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.inv-row .qty-group .btn-action {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.repuestos-lista {
  margin: 10px 0;
}
.repuestos-lista ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.repuestos-lista li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.link.danger {
  background: transparent;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-weight: 700;
}

/* ====== EMPTY ====== */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px;
  color: var(--text-muted);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

/* ====== FORM MODERNO (ASIDE) ====== */
.form-modern {
  display: grid;
  gap: 14px;
}
.section-title {
  font-weight: 700;
  color: var(--text);
  margin: 4px 0 2px;
}
.req {
  color: var(--danger);
}

/* Grid dos columnas, colapsa en móvil */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 720px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.field {
  display: grid;
  gap: 6px;
}
.field label {
  font-size: 13px;
  color: var(--text-muted);
}
.field input,
.field select,
.field textarea {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 12px;
  color: var(--text);
}
.field textarea {
  resize: vertical;
}

/* Separador */
.divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0 6px;
}

/* Fila inventario */
.inv-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
}
.add-btn {
  white-space: nowrap;
}

/* Qty stepper */
.qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.qty input {
  width: 56px;
  text-align: center;
  border: 0;
  background: var(--surface);
  padding: 8px 6px;
  color: var(--text);
  -moz-appearance: textfield;
  appearance: textfield;
}
.qty input::-webkit-outer-spin-button,
.qty input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-btn {
  background: var(--surface-2);
  border: 0;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 700;
}
.qty-btn:hover {
  background: #eef2f7;
}

/* Chips de repuestos */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 2px;
  padding: 0;
  list-style: none;
}
.chip {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.chip-x {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  font-weight: 700;
}
.chip-x:hover {
  color: var(--danger);
}

/* Botón ancho */
.w-100 {
  width: 100%;
}
.mt-2 {
  margin-top: 8px;
}
</style>
