import { useState, useEffect } from 'react';
import FormularioVariable from './componentes/FormularioVariable';
import LienzoGrafico from './componentes/LienzoGrafico';
import PanelInferencia from './componentes/PanelInferencia';
import GestionArchivo from './componentes/GestionArchivo';
import EditorProbabilidades from './componentes/EditorProbabilidades';
import { obtenerRedLocal, guardarRedLocal } from './componentes/AlmacenamientoLocal';

export default function App() {
  const [recargar, setRecargar] = useState(0);
  const [variableSeleccionada, setVariableSeleccionada] = useState(null);
  const [relacionSeleccionada, setRelacionSeleccionada] = useState(null);
  
  // Detectar si la pantalla es móvil (< 768px)
  const [esMovil, setEsMovil] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const notificarCambio = () => setRecargar(prev => prev + 1);

  // 1. Eliminar nodo de forma 100% local en localStorage
  const eliminarNodoSeleccionado = () => {
    if (!variableSeleccionada) return;

    if (!confirm(`¿Estás seguro de que deseas eliminar la variable "${variableSeleccionada}"?`)) {
      return;
    }

    const variablesActuales = obtenerRedLocal() || [];

    // Eliminar la variable seleccionada y quitarla de las relaciones de los demás nodos
    const variablesModificadas = variablesActuales
      .filter(v => v.nombre !== variableSeleccionada)
      .map(v => ({
        ...v,
        padres: (v.padres || []).filter(p => {
          const nombrePadre = typeof p === 'object' ? p.nombre : p;
          return nombrePadre !== variableSeleccionada;
        })
      }));

    guardarRedLocal(variablesModificadas);
    setVariableSeleccionada(null);
    notificarCambio();
  };

  // 2. Eliminar relación de forma local en localStorage
  const handleEliminarRelacion = () => {
    if (!relacionSeleccionada) return;

    const variablesActuales = obtenerRedLocal() || [];

    const variablesModificadas = variablesActuales.map(variable => {
      if (variable.nombre === relacionSeleccionada.target) {
        return {
          ...variable,
          padres: (variable.padres || []).filter(p => {
            const nombrePadre = typeof p === 'object' ? p.nombre : p;
            return nombrePadre !== relacionSeleccionada.source;
          })
        };
      }
      return variable;
    });

    guardarRedLocal(variablesModificadas);
    setRelacionSeleccionada(null);
    notificarCambio();
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Red Bayesiana</h1>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: esMovil ? '1fr' : '1fr 2fr', 
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Panel Izquierdo / Formularios */}
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

        {/* Panel Derecho / Lienzo */}
        <div style={{ width: '100%', minWidth: 0 }}>
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