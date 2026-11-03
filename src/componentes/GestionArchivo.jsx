import { obtenerRedLocal, guardarRedLocal, limpiarRedLocal } from './AlmacenamientoLocal';

export default function GestionArchivo({ onRedActualizada }) {
  
  // Exportar la red guardada en localStorage como archivo JSON
  const exportarJSON = () => {
    try {
      const data = obtenerRedLocal() || [];
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'red_bayesiana.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error al exportar: ${err.message}`);
    }
  };

  // Importar archivo JSON guardando SOLAMENTE en el navegador del usuario
  const importarJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) {
          throw new Error("El archivo JSON debe contener una lista de variables.");
        }
        guardarRedLocal(json);
        alert('Red bayesiana importada localmente con éxito');
        onRedActualizada();
      } catch (err) {
        alert(`Error al importar: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Limpiar input
  };

  // Restablecer eliminando la clave local del navegador
  const handleRestablecer = () => {
    if (confirm("¿Estás seguro de restablecer la red a su versión inicial por defecto? Se perderán los cambios locales.")) {
      limpiarRedLocal();
      onRedActualizada();
    }
  };

  return (
    <div style={{ 
      padding: '0.4rem 1.2rem',
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      marginBottom: '1rem',
      maxWidth: '310px',
    }}>
      <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem' }}>Gestión de Archivos</h3>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button onClick={exportarJSON} style={{ cursor: 'pointer', padding: '0.3rem 0.6rem', background: '#444', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.85rem', lineHeight: '1.2' }}>
          Exportar Red (JSON)
        </button>
        
        <label style={{ cursor: 'pointer', padding: '0.3rem 0.6rem', background: '#444', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', lineHeight: '1.2' }}>
          Importar Red (JSON)
          <input type="file" accept=".json" onChange={importarJSON} style={{ display: 'none' }} />
        </label>

        <button onClick={handleRestablecer} style={{ cursor: 'pointer', padding: '0.3rem 0.6rem', background: '#444', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.85rem', lineHeight: '1.2' }}>
          Restablecer Red <br />Base
        </button>
      </div>
    </div>
  );
}