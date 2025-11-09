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
            <button @click="eliminarCliente(cliente.id, cliente.nombre)" class="btn-action delete">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
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
      API_URL: 'http://localhost:3000/api/clientes', // Nuevo endpoint

      nuevoCliente: { nombre: '', telefono: '', email: '', direccion: '' },
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

    // 3. ELIMINAR REGISTRO (DELETE)
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
/* Estilos necesarios para esta vista */
.clientes-view {
  padding: 20px;
}

/* Reutilizando estilos de formulario y tabla de main.css / CochesView.vue */
.formulario-agregar {
  background-color: #1e2a38;
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
}
.formulario-agregar button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
  font-weight: bold;
}
.btn-action.delete {
  background-color: #e74c3c; /* Rojo */
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background-color 0.3s;
}
</style>
