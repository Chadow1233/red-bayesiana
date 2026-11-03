import { useState } from 'react';
import FormularioVariable from './componentes/FormularioVariable';
import LienzoGrafico from './componentes/LienzoGrafico';
import PanelInferencia from './componentes/PanelInferencia';
import GestionArchivo from './componentes/GestionArchivo';
import EditorProbabilidades from './componentes/EditorProbabilidades';

export default function App() {
  const [recargar, setRecargar] = useState(0);
  const [variableSeleccionada, setVariableSeleccionada] = useState(null);
  const [relacionSeleccionada, setRelacionSeleccionada] = useState(null);

  const notificarCambio = () => setRecargar(prev => prev + 1);

  const eliminarNodoSeleccionado = async () => {
    if (!variableSeleccionada) return;

    if (!confirm(`¿Estás seguro de que deseas eliminar la variable "${variableSeleccionada}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/variables/${encodeURIComponent(variableSeleccionada)}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setVariableSeleccionada(null);
      notificarCambio();
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleEliminarRelacion = async () => {
    if (!relacionSeleccionada) return;
    try {
      const res = await fetch('/api/relaciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          padre: relacionSeleccionada.source,
          hijo: relacionSeleccionada.target
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRelacionSeleccionada(null);
      notificarCambio(); // Usa el helper notificarCambio() en lugar de setRecargarTrigger
    } catch (err) {
      alert(`Error al eliminar la relación: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Red Bayesiana</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div>
          <GestionArchivo onRedActualizada={notificarCambio} />
          <FormularioVariable onVariableCreada={notificarCambio} />
          
          {/* Panel para Nodo Seleccionado */}
          {variableSeleccionada && (
            <div style={{ padding: '0.8rem', background: '#333', color: '#fff', borderRadius: '6px', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0 }}>
                  Nodo seleccionado: <strong>{variableSeleccionada}</strong>
                </p>
                <button 
                  onClick={eliminarNodoSeleccionado} 
                  style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Eliminar Nodo
                </button>
              </div>

              <EditorProbabilidades 
                key={variableSeleccionada}
                variableNombre={variableSeleccionada} 
                onProbabilidadesGuardadas={notificarCambio} 
              />
            </div>
          )}

          {/* Panel para Relación/Unión Seleccionada */}
          {relacionSeleccionada && (
            <div style={{ padding: '0.8rem', background: '#2b2b2b', color: '#fff', borderRadius: '6px', marginTop: '0.5rem', border: '1px solid #444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Unión: <strong>{relacionSeleccionada.source}</strong> → <strong>{relacionSeleccionada.target}</strong>
                </p>
                <button 
                  onClick={handleEliminarRelacion} 
                  style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Eliminar Unión
                </button>
              </div>
            </div>
          )}

          {!variableSeleccionada && !relacionSeleccionada && (
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              Haz clic en un nodo o en una línea de unión del lienzo para editar o eliminar.
            </p>
          )}
        </div>

        <div>
          <LienzoGrafico 
            recargarTrigger={recargar} 
            onSeleccionarVariable={setVariableSeleccionada} 
            onSeleccionarRelacion={setRelacionSeleccionada}
          />
        </div>
      </div>

      <PanelInferencia recargarTrigger={recargar} />
    </div>
  );
}