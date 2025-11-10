<template>
  <div class="repuestos-view">
    <h1>Gestión de Inventario (Repuestos) 📦</h1>

    <div class="formulario-agregar">
      <h2>Registrar Nuevo Repuesto</h2>
      <form @submit.prevent="agregarRepuesto">
        <div class="input-group">
          <input type="text" v-model="nuevoRepuesto.nombre" placeholder="Nombre" required />
          <input
            type="text"
            v-model="nuevoRepuesto.codigo"
            placeholder="Código (Ej: FSA123)"
            required
          />
          <input type="text" v-model="nuevoRepuesto.fabricante" placeholder="Fabricante" />
        </div>
        <div class="input-group">
          <input
            type="number"
            v-model.number="nuevoRepuesto.stock"
            placeholder="Stock Inicial"
            required
          />
          <input
            type="number"
            step="0.01"
            v-model.number="nuevoRepuesto.precio"
            placeholder="Precio (Ej: 15.50)"
            required
          />
          <button type="submit">Añadir a Inventario</button>
        </div>
      </form>
      <p v-if="mensajeExito" class="exito">{{ mensajeExito }}</p>
      <p v-if="errorCreacion" class="error">{{ errorCreacion }}</p>
    </div>

    <p v-if="cargando">Cargando inventario...</p>
    <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>

    <p v-else-if="repuestos.length === 0" class="stock-bajo">
      ⚠️ No se han encontrado repuestos en el inventario. Añade uno nuevo para empezar.
    </p>

    <table v-else class="repuestos-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Código</th>
          <th>Fabricante</th>
          <th>Stock</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="repuesto in repuestos" :key="repuesto.id">
          <td>{{ repuesto.id }}</td>
          <td>{{ repuesto.nombre }}</td>
          <td>{{ repuesto.codigo }}</td>
          <td>{{ repuesto.fabricante }}</td>
          <td :class="{ 'stock-bajo': repuesto.stock < 10 }">{{ repuesto.stock }}</td>

          <td>${{ repuesto.precio ? parseFloat(repuesto.precio).toFixed(2) : '0.00' }}</td>

          <td>
            <button @click="abrirEdicion(repuesto)" class="btn-action start">Editar</button>

            <button @click="eliminarRepuesto(repuesto.id)" class="btn-action delete">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="repuestoSeleccionado" class="modal-backdrop" @click.self="cancelarEdicion">
      <div class="modal-content">
        <h2>Editar Repuesto: {{ repuestoSeleccionado.nombre }}</h2>
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
            <button type="button" @click="cancelarEdicion" class="btn-action delete">
              Cancelar
            </button>
            <button type="submit" class="btn-action complete">Guardar Cambios</button>
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
      API_URL: '/api/repuestos',
      repuestoSeleccionado: null, // Controla el modal de edición

      // Inicialización a NULL para que los placeholders se vean
      nuevoRepuesto: { nombre: '', codigo: '', fabricante: '', stock: null, precio: null },
      mensajeExito: null,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    // 1. OBTENER DATOS (GET)
    async fetchData() {
      this.cargando = true
      this.errorLectura = null

      try {
        const response = await axios.get(this.API_URL)
        this.repuestos = response.data
      } catch (error) {
        this.errorLectura = 'No se pudo conectar a la API para cargar el inventario.'
        console.error('ERROR FETCH:', error)
      } finally {
        // Garantiza que el spinner desaparezca siempre
        this.cargando = false
      }
    },

    // 2. AGREGAR DATOS (POST)
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

        const response = await axios.post(this.API_URL, this.nuevoRepuesto)

        this.repuestos.unshift(response.data)
        this.mensajeExito = `Repuesto '${response.data.nombre}' agregado al inventario.`
        this.nuevoRepuesto = { nombre: '', codigo: '', fabricante: '', stock: null, precio: null }
      } catch (error) {
        this.errorCreacion = 'Error al agregar repuesto. Revise si el código ya existe.'
        console.error('Error al agregar repuesto:', error)
      }
    },

    // 3. ABRIR EDICIÓN (Modal)
    abrirEdicion(repuesto) {
      // Crea una copia profunda del objeto para evitar modificar el original
      this.repuestoSeleccionado = { ...repuesto }
    },

    // 4. CANCELAR EDICIÓN (Modal)
    cancelarEdicion() {
      this.repuestoSeleccionado = null
      this.errorCreacion = null
    },

    // 5. GUARDAR EDICIÓN (PUT)
    async guardarEdicion() {
      this.errorCreacion = null
      const repuesto = this.repuestoSeleccionado

      if (repuesto.stock < 0 || repuesto.precio <= 0) {
        this.errorCreacion = 'El Stock debe ser positivo y el Precio mayor a cero.'
        return
      }

      try {
        const url = `${this.API_URL}/${repuesto.id}`
        await axios.put(url, repuesto)

        // Actualiza el objeto en la lista 'repuestos'
        const index = this.repuestos.findIndex((r) => r.id === repuesto.id)
        if (index !== -1) {
          // Reemplaza el objeto antiguo con el editado (repuestoSeleccionado)
          this.repuestos.splice(index, 1, repuesto)
        }

        this.mensajeExito = `Repuesto '${repuesto.nombre}' actualizado con éxito.`
        this.cancelarEdicion()
      } catch (error) {
        this.errorCreacion = 'Error al guardar los cambios.'
        console.error('Error al actualizar:', error)
      }
    },

    // 6. ELIMINAR REGISTRO (DELETE)
    async eliminarRepuesto(id) {
      if (!confirm(`¿Está seguro de eliminar este repuesto del inventario?`)) {
        return
      }

      try {
        const url = `${this.API_URL}/${id}`
        await axios.delete(url)

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
/* Los estilos se mantienen igual */

/* Contenedor principal */
.repuestos-view {
  padding: 20px;
}

/* --- Estilos de Tabla --- */
.repuestos-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}
.repuestos-table th {
  background-color: #3b5998; /* Color de Inventario */
  color: white;
  padding: 12px 15px; /* Añadido padding para consistencia */
}
.repuestos-table td {
  padding: 12px;
  border-bottom: 1px solid #444;
}

/* --- Estilos de Formulario --- */
.formulario-agregar {
  background-color: #1e2a38;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 30px;
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-group input {
  flex: 1;
}

/* --- Botones y Estados --- */
.btn-action {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  margin: 2px;
  transition: background-color 0.3s;
  color: white;
}
.btn-action.delete {
  background-color: #e74c3c;
}
.btn-action.start {
  background-color: #f39c12;
}
.stock-bajo {
  color: #f39c12;
  font-weight: bold;
}
.error {
  color: #ff6b6b;
  font-weight: bold;
}
.exito {
  color: #42b983;
  font-weight: bold;
}

/* --- ESTILOS PARA EL MODAL DE EDICIÓN --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* Fondo oscuro semitransparente */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Asegura que esté por encima de todo */
}

.modal-content {
  background-color: #1e2a38;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.8);
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  color: #42b983;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
/* Asegura que los campos dentro del modal ocupen el 100% */
.modal-content input {
  width: 100%;
  margin-bottom: 15px;
}
</style>
