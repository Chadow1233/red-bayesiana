import { useState } from 'react';
import { obtenerRedLocal, guardarRedLocal } from './AlmacenamientoLocal';

export default function FormularioVariable({ onVariableCreada }) {
  const [nombre, setNombre] = useState('');
  const [estados, setEstados] = useState('sí, no');

  const handleSubmit = (e) => {
    e.preventDefault();
    const listaEstados = estados.split(',').map(s => s.trim()).filter(Boolean);

    if (!nombre.trim() || listaEstados.length < 2) {
      alert('Debes ingresar un nombre y al menos dos estados separados por coma.');
      return;
    }

    const variables = obtenerRedLocal() || [];
    const nombreLimpio = nombre.trim();

    // Validar que la variable no exista previamente
    if (variables.some(v => v.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
      alert(`La variable "${nombreLimpio}" ya existe.`);
      return;
    }

    const nuevaVariable = {
      nombre: nombreLimpio,
      estados: listaEstados,
      padres: [],
      probabilidades: {}
    };

    // Guardar en el dispositivo del usuario
    guardarRedLocal([...variables, nuevaVariable]);
    setNombre('');
    onVariableCreada();
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