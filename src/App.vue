<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="app-header">
    <div class="wrapper">
      <nav class="app-nav" aria-label="Principal">
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
/* Header sticky, fondo claro y borde sutil */
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

/* Contenedor centrado y ancho coherente con las vistas */
.wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
}

/* Nav como "pills" minimalistas */
.app-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.app-nav a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px; /* estilo pill */
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.app-nav a:hover {
  background: #f3f4f6;
  color: var(--text);
  transform: translateY(-1px);
}

/* Estado activo consistente con main.css */
.app-nav a.router-link-exact-active {
  background: var(--primary);
  color: #fff !important;
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* Accesibilidad: focus visible */
.app-nav a:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--primary) 25%, transparent);
}

/* Ajustes responsivos sutiles */
@media (max-width: 640px) {
  .app-nav {
    justify-content: flex-start;
    overflow-x: auto;
  }
  .app-nav a {
    white-space: nowrap;
  }
}
</style>
