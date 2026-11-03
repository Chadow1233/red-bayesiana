export default function GestionArchivo({ onRedActualizada }) {
  // Exportar la red actual como archivo JSON descargable
  const exportarJSON = async () => {
    try {
      const res = await fetch('/api/exportar');
      const data = await res.json();

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

  // Cargar una red desde un archivo JSON seleccionado
  const importarJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await fetch('/api/importar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        alert('Red bayesiana importada con éxito');
        onRedActualizada();
      } catch (err) {
        alert(`Error al importar: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Limpiar input
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem' }}>
      <h3>Gestión de Archivos (JSON)</h3>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={exportarJSON}>Exportar Red (JSON)</button>
        
        <label style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', background: '#444', color: '#fff', borderRadius: '4px' }}>
          Importar Red (JSON)
          <input type="file" accept=".json" onChange={importarJSON} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}