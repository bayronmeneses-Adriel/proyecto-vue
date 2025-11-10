<template>
  <div class="clientes-view">
    <h1>Gestión de Clientes 👥</h1>

    <div class="formulario-agregar">
      <h2>Registrar Nuevo Cliente</h2>
      <form @submit.prevent="agregarCliente">
        <div class="input-group">
          <input type="text" v-model="nuevoCliente.nombre" placeholder="Nombre Completo" required />
          <input type="text" v-model="nuevoCliente.telefono" placeholder="Teléfono" required />
        </div>
        <div class="input-group">
          <input type="email" v-model="nuevoCliente.email" placeholder="Correo Electrónico" />
          <input type="text" v-model="nuevoCliente.direccion" placeholder="Dirección" />
        </div>
        <button type="submit">Registrar Cliente</button>
      </form>
      <p v-if="mensajeExito" class="exito">{{ mensajeExito }}</p>
      <p v-if="errorCreacion" class="error">{{ errorCreacion }}</p>
    </div>

    <p v-if="cargando">Cargando clientes desde la base de datos...</p>
    <p v-else-if="errorLectura" class="error">{{ errorLectura }}</p>

    <table v-if="!cargando && !errorLectura" class="clientes-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Email</th>
          <th>Dirección</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cliente in clientes" :key="cliente.id">
          <td>{{ cliente.id }}</td>
          <td>{{ cliente.nombre }}</td>
          <td>{{ cliente.telefono }}</td>
          <td>{{ cliente.email }}</td>
          <td>{{ cliente.direccion }}</td>
          <td>
            <button @click="abrirEdicion(cliente)" class="btn-action start">Editar</button>
            <button @click="eliminarCliente(cliente.id, cliente.nombre)" class="btn-action delete">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="clienteSeleccionado" class="modal-backdrop" @click.self="cancelarEdicion">
      <div class="modal-content">
        <h2>Editar Cliente: {{ clienteSeleccionado.nombre }}</h2>
        <form @submit.prevent="guardarEdicion">
          <div class="input-group">
            <input
              type="text"
              v-model="clienteSeleccionado.nombre"
              placeholder="Nombre Completo"
              required
            />
            <input type="text" v-model="clienteSeleccionado.telefono" placeholder="Teléfono" />
          </div>
          <div class="input-group">
            <input
              type="email"
              v-model="clienteSeleccionado.email"
              placeholder="Correo Electrónico"
            />
            <input type="text" v-model="clienteSeleccionado.direccion" placeholder="Dirección" />
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
      clientes: [],
      cargando: true,
      errorLectura: null,
      errorCreacion: null,
      API_URL: '/api/clientes',

      nuevoCliente: { nombre: '', telefono: '', email: '', direccion: '' },
      clienteSeleccionado: null, // Variable para la edición
      mensajeExito: null,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    // 1. OBTENER DATOS (GET)
    fetchData() {
      this.cargando = true
      axios
        .get(this.API_URL)
        .then((response) => {
          this.clientes = response.data
          this.cargando = false
        })
        .catch(() => {
          this.errorLectura = 'No se pudo conectar a la API para cargar clientes.'
          this.cargando = false
        })
    },

    // 2. AGREGAR DATOS (POST)
    async agregarCliente() {
      this.errorCreacion = null
      this.mensajeExito = null
      try {
        const response = await axios.post(this.API_URL, this.nuevoCliente)

        this.clientes.unshift(response.data)
        this.mensajeExito = `Cliente ${response.data.nombre} registrado con éxito.`
        this.nuevoCliente = { nombre: '', telefono: '', email: '', direccion: '' }
      } catch (error) {
        this.errorCreacion = 'Error al registrar cliente. Intente de nuevo.'
        console.error('Error al agregar cliente:', error)
      }
    },

    // 3. ABRIR EDICIÓN (Modal)
    abrirEdicion(cliente) {
      this.clienteSeleccionado = { ...cliente }
    },

    // 4. CANCELAR EDICIÓN (Modal)
    cancelarEdicion() {
      this.clienteSeleccionado = null
      this.errorCreacion = null
    },

    // 5. GUARDAR EDICIÓN (PUT)
    async guardarEdicion() {
      this.errorCreacion = null
      const cliente = this.clienteSeleccionado

      try {
        const url = `${this.API_URL}/${cliente.id}`
        await axios.put(url, cliente)

        // Actualiza el registro en la lista local
        const index = this.clientes.findIndex((c) => c.id === cliente.id)
        if (index !== -1) {
          this.clientes.splice(index, 1, cliente)
        }

        this.mensajeExito = `Cliente '${cliente.nombre}' actualizado con éxito.`
        this.cancelarEdicion()
      } catch (error) {
        this.errorCreacion = 'Error al guardar los cambios del cliente.'
        console.error('Error al actualizar cliente:', error)
      }
    },

    // 6. ELIMINAR REGISTRO (DELETE)
    async eliminarCliente(id, nombre) {
      if (!confirm(`¿Está seguro de eliminar al cliente ${nombre}? Esta acción es permanente.`)) {
        return
      }

      try {
        const url = `${this.API_URL}/${id}`
        await axios.delete(url)

        this.clientes = this.clientes.filter((c) => c.id !== id)
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
/* ESTILOS DE TABLA Y BOTONES (ESQUEMA OSCURO ORIGINAL) */

.clientes-view {
  padding: 20px;
}

/* Tabla y Encabezado */
.clientes-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.clientes-table th {
  background-color: #42b983; /* Color de acento (Verde Vue, del esquema original) */
  color: white;
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid #36a075;
}
.clientes-table td {
  padding: 12px;
  border-bottom: 1px solid #444;
}

/* Formulario de Registro (Para fondos oscuros) */
.formulario-agregar {
  background-color: #1e2a38; /* Fondo oscuro del formulario */
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-group input {
  flex: 1;
  background-color: #2c3e50; /* Fondo oscuro de los inputs */
  color: white;
  border: 1px solid #555;
  padding: 12px;
  border-radius: 5px;
}

/* Botones */
.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  margin: 2px;
  transition: background-color 0.3s;
  color: white;
}
.btn-action.start {
  background-color: #f39c12; /* Naranja para Editar */
}
.btn-action.delete {
  background-color: #e74c3c; /* Rojo para Eliminar */
}
.btn-action.complete {
  background-color: #3498db; /* Azul para Guardar Cambios */
}

/* --- Estilos del MODAL DE EDICIÓN --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: #1e2a38; /* Fondo oscuro del modal */
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.8);
  width: 90%;
  max-width: 500px;
}
.modal-content h2 {
  color: #42b983; /* Título verde */
  margin-bottom: 20px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.modal-content input {
  width: 100%;
  margin-bottom: 15px;
  background-color: #2c3e50; /* Fondo oscuro de los inputs del modal */
  color: white;
}
</style>
