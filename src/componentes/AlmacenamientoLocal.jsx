const CLAVE_LOCAL = 'red_bayesiana_local';

// Guardar el estado actual en el navegador
export const guardarRedLocal = (variables) => {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(variables));
  } catch (err) {
    console.error('Error al guardar en localStorage:', err);
  }
};

// Cargar el estado local si existe
export const obtenerRedLocal = () => {
  try {
    const datos = localStorage.getItem(CLAVE_LOCAL);
    return datos ? JSON.parse(datos) : null;
  } catch (err) {
    console.error('Error al leer de localStorage:', err);
    return null;
  }
};

// Limpiar para restaurar la red por defecto
export const limpiarRedLocal = () => {
  localStorage.removeItem(CLAVE_LOCAL);
};