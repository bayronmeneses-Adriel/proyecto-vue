<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/coches">Coches</RouterLink>
        <RouterLink to="/mecanicos">Mecánicos</RouterLink>
        <RouterLink to="/clientes">Clientes</RouterLink>
        <RouterLink to="/repuestos">Inventario</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  background-color: #1e2a38; /* Fondo oscuro para el header */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}
.wrapper {
  padding: 10px 0;
}
nav {
  width: 100%;
  font-size: 16px;
  text-align: center;
}
nav a {
  display: inline-block;
  padding: 0 1.5rem;
  color: #42b983; /* Color principal */
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}
nav a:hover {
  color: #6dcc98;
}
nav a.router-link-exact-active {
  color: #fff; /* Blanco para la activa */
  background-color: #42b983;
  border-radius: 4px;
}
</style>
