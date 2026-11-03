import { useState } from 'react';

export default function FormularioVariable({ onVariableCreada }) {
  const [nombre, setNombre] = useState('');
  const [estados, setEstados] = useState('sí, no');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const listaEstados = estados.split(',').map(s => s.trim()).filter(Boolean);

    if (!nombre || listaEstados.length < 2) {
      alert('Debes ingresar un nombre y al menos dos estados separados por coma.');
      return;
    }

    try {
      const res = await fetch('/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, estados: listaEstados })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setNombre('');
      onVariableCreada();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem' }}>
      <h3>Crear Variable (Nodo)</h3>
      <div>
        <label>Nombre: </label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Lluvia" />
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <label>Estados (separados por coma): </label>
        <input value={estados} onChange={e => setEstados(e.target.value)} placeholder="sí, no" />
      </div>
      <button type="submit" style={{ marginTop: '0.5rem' }}>Agregar Nodo</button>
    </form>
  );
}