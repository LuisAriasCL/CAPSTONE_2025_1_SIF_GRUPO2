// Importación del encabezado
import './src/componentes/encabezado.js';
// Importación del menú lateral
import './src/componentes/menu-lateral.js';

document.addEventListener('DOMContentLoaded', () => {
  async function cargarPaginaDesdeHash() {
    const hash = window.location.hash || '#/dashboard';
    const pagina = hash.replace('#/', '') || 'dashboard'; // Elimina #/ y usa 'dashboard' por defecto

    try {
      // Eliminar contenido anterior
      const contenedor = document.getElementById('main-content');
      contenedor.innerHTML = '';

      // Eliminar scripts anteriores
      const scriptAnterior = document.getElementById('pagina-script');
      if (scriptAnterior) {
        scriptAnterior.remove();
      }

      // Usar importación dinámica con la ruta correcta
      const moduloPagina = await import(`./src/paginas/${pagina}.js`); // Aquí importa el archivo JS dinámicamente

      // Verificar si el módulo tiene una función por defecto y ejecutarla
      if (typeof moduloPagina.default === 'function') {
        moduloPagina.default(contenedor); // Llama a la función predeterminada y le pasa el contenedor
      } else {
        contenedor.innerHTML = `<p>Error: El módulo ${pagina} no exporta una función por defecto</p>`;
      }

    } catch (err) {
      console.error('Error al cargar la página:', err);
      document.getElementById('main-content').innerHTML = '<p>Error al cargar la página.</p>';
    }
  }

  // Escuchar cambios en el hash y cargar la página correspondiente
  window.addEventListener('hashchange', cargarPaginaDesdeHash);
  cargarPaginaDesdeHash(); // Llamar una vez al cargar la página
});
