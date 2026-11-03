import { useState, useEffect } from 'react';
import { obtenerRedLocal, guardarRedLocal } from './AlmacenamientoLocal';

export default function EditorProbabilidades({ variableNombre, onProbabilidadesGuardadas }) {
  const [variable, setVariable] = useState(null);
  const [variablesRed, setVariablesRed] = useState([]);
  const [valores, setValores] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Obtener variables localmente sin llamar a la API
    const data = obtenerRedLocal() || [];
    setVariablesRed(data);

    const varActual = data.find(v => v.nombre === variableNombre);
    setVariable(varActual);
    if (varActual) {
      inicializarValores(varActual, data);
    }
    setCargando(false);
  }, [variableNombre]);

  // Genera todas las combinaciones posibles de los estados de los padres
  const obtenerCombinacionesPadres = (padresList, listaVariables) => {
    const padresNombres = (padresList || []).map(p => typeof p === 'object' ? p.nombre : p);
    const padresObjs = padresNombres
      .map(pNombre => listaVariables.find(v => v.nombre === pNombre))
      .filter(Boolean);
    
    if (padresObjs.length === 0) return [{}];

    const aux = (index) => {
      if (index === padresObjs.length) return [{}];
      const padreActual = padresObjs[index];
      const combinacionesRestantes = aux(index + 1);
      const resultado = [];

      for (const estado of padreActual.estados) {
        for (const comb of combinacionesRestantes) {
          resultado.push({ [padreActual.nombre]: estado, ...comb });
        }
      }
      return resultado;
    };

    return aux(0);
  };

  const inicializarValores = (varObj, listaVariables) => {
    const padresNombres = (varObj.padres || []).map(p => typeof p === 'object' ? p.nombre : p);
    const combinaciones = obtenerCombinacionesPadres(varObj.padres, listaVariables);
    const nuevosValores = {};

    combinaciones.forEach(comb => {
      const key = JSON.stringify(comb);
      nuevosValores[key] = {};

      let probAnidada = varObj.probabilidades;
      for (const pNombre of padresNombres) {
        if (probAnidada && probAnidada[comb[pNombre]]) {
          probAnidada = probAnidada[comb[pNombre]];
        } else {
          probAnidada = null;
          break;
        }
      }

      varObj.estados.forEach(estado => {
        if (probAnidada && typeof probAnidada[estado] === 'number') {
          nuevosValores[key][estado] = probAnidada[estado];
        } else {
          nuevosValores[key][estado] = 0;
        }
      });
    });

    setValores(nuevosValores);
  };

  const handleValorChange = (combKey, estado, valor) => {
    let num = parseFloat(valor) || 0;

    // Si escribes un número entero como 80 o 20, lo convierte automáticamente a decimal (0.8 y 0.2)
    if (num > 1 && num <= 100) {
      num = num / 100;
    }

    setValores(prev => ({
      ...prev,
      [combKey]: {
        ...prev[combKey],
        [estado]: num
      }
    }));
  };

  const guardarProbabilidades = () => {
    if (!variable) return;

    const padresNombres = (variable.padres || []).map(p => typeof p === 'object' ? p.nombre : p);
    const combinaciones = obtenerCombinacionesPadres(variable.padres, variablesRed);
    const tablaFinal = {};

    if (padresNombres.length === 0) {
      const rootKey = JSON.stringify({});
      variable.estados.forEach(est => {
        tablaFinal[est] = valores[rootKey]?.[est] || 0;
      });
    } else {
      const agregarAObjeto = (objActual, padresRestantes, comb, valMap) => {
        const pNombre = padresRestantes[0];
        const estadoPadre = comb[pNombre];

        if (padresRestantes.length === 1) {
          if (!objActual[estadoPadre]) objActual[estadoPadre] = {};
          const key = JSON.stringify(comb);
          variable.estados.forEach(est => {
            objActual[estadoPadre][est] = valMap[key]?.[est] || 0;
          });
        } else {
          if (!objActual[estadoPadre]) objActual[estadoPadre] = {};
          agregarAObjeto(objActual[estadoPadre], padresRestantes.slice(1), comb, valMap);
        }
      };

      combinaciones.forEach(comb => {
        agregarAObjeto(tablaFinal, padresNombres, comb, valores);
      });
    }

    // Actualizar y guardar en el dispositivo local
    const variablesActuales = obtenerRedLocal() || [];
    const variablesActualizadas = variablesActuales.map(v => {
      if (v.nombre === variable.nombre) {
        return { ...v, probabilidades: tablaFinal };
      }
      return v;
    });

    guardarRedLocal(variablesActualizadas);
    alert('Probabilidades guardadas con éxito');
    if (onProbabilidadesGuardadas) onProbabilidadesGuardadas();
  };

  if (cargando || !variable) return <p style={{ color: '#aaa' }}>Cargando tabla...</p>;

  const padresNombres = (variable.padres || []).map(p => typeof p === 'object' ? p.nombre : p);
  const combinaciones = obtenerCombinacionesPadres(variable.padres, variablesRed);

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #444', borderRadius: '8px', background: '#222', color: '#fff' }}>
      <h4 style={{ margin: '0 0 0.5rem 0' }}>Editar Tabla de Probabilidades: {variable.nombre}</h4>
      <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.8rem' }}>
        {padresNombres.length === 0 
          ? 'Asigna la probabilidad para cada estado (deben sumar 1).' 
          : `Combinaciones según sus padres (${padresNombres.join(', ')}):`}
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #555' }}>
              {padresNombres.map(p => (
                <th key={p} style={{ padding: '0.4rem' }}>{p}</th>
              ))}
              {variable.estados.map(est => (
                <th key={est} style={{ padding: '0.4rem' }}>P({est})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {combinaciones.map(comb => {
              const combKey = JSON.stringify(comb);
              return (
                <tr key={combKey} style={{ borderBottom: '1px solid #333' }}>
                  {padresNombres.map(p => (
                    <td key={p} style={{ padding: '0.4rem', fontWeight: 'bold' }}>{comb[p]}</td>
                  ))}
                  {variable.estados.map(est => (
                    <td key={est} style={{ padding: '0.4rem' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={valores[combKey]?.[est] ?? 0}
                        onChange={e => handleValorChange(combKey, est, e.target.value)}
                        style={{ width: '65px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #666', background: '#333', color: '#fff' }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button 
        onClick={guardarProbabilidades} 
        style={{ marginTop: '1rem', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
      >
        Guardar Probabilidades
      </button>
    </div>
  );
}