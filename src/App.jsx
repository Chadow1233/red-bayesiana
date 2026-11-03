import { useState } from 'react';
import FormularioVariable from './componentes/FormularioVariable';
import LienzoGrafico from './componentes/LienzoGrafico';
import PanelInferencia from './componentes/PanelInferencia';
import GestionArchivo from './componentes/GestionArchivo';
import EditorProbabilidades from './componentes/EditorProbabilidades'; // <-- IMPORTAR

export default function App() {
  const [recargar, setRecargar] = useState(0);
  const [variableSeleccionada, setVariableSeleccionada] = useState(null);

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

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Red Bayesiana</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div>
            <GestionArchivo onRedActualizada={notificarCambio} />
            <FormularioVariable onVariableCreada={notificarCambio} />
          
          {variableSeleccionada ? (
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

              {/* EDITOR VISUAL DE PROBABILIDADES */}
              <EditorProbabilidades 
                key={variableSeleccionada}
                variableNombre={variableSeleccionada} 
                onProbabilidadesGuardadas={notificarCambio} 
              />
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#888' }}>
              Haz clic en un nodo del lienzo para seleccionar, editar probabilidades o eliminar.
            </p>
          )}
        </div>

        <div>
          <LienzoGrafico 
            recargarTrigger={recargar} 
            onSeleccionarVariable={setVariableSeleccionada} 
          />
        </div>
      </div>

      <PanelInferencia recargarTrigger={recargar} />
    </div>
  );
}