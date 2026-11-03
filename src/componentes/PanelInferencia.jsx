import { useState, useEffect } from 'react';
import { obtenerRedLocal } from './AlmacenamientoLocal';

export default function PanelInferencia({ recargarTrigger }) {
  const [variables, setVariables] = useState([]);
  const [consultaVar, setConsultaVar] = useState('');
  const [evidencia, setEvidencia] = useState({});
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const dataLocal = obtenerRedLocal();
    if (dataLocal && dataLocal.length > 0) {
      setVariables(dataLocal);
      if (!consultaVar || !dataLocal.some(v => v.nombre === consultaVar)) {
        setConsultaVar(dataLocal[0].nombre);
      }
    } else {
      fetch('/api/variables')
        .then(res => res.json())
        .then(data => {
          setVariables(data);
          if (data.length > 0 && !consultaVar) setConsultaVar(data[0].nombre);
        });
    }
  }, [recargarTrigger]);

  const handleCambioVariableConsulta = (nuevaVar) => {
    setConsultaVar(nuevaVar);
    setEvidencia(prev => {
      const copia = { ...prev };
      delete copia[nuevaVar];
      return copia;
    });
  };

  const handleEvidenciaChange = (nombreVar, estado) => {
    setEvidencia(prev => {
      const copia = { ...prev };
      if (!estado) {
        delete copia[nombreVar];
      } else {
        copia[nombreVar] = estado;
      }
      return copia;
    });
  };

  const ejecutarConsulta = async () => {
    try {
      const redLocal = obtenerRedLocal() || [];
      const res = await fetch('/api/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variable: consultaVar, evidencia, redLocal })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setResultado(data.probabilidades);
    } catch (err) {
      alert(`Error en consulta: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Motor de Inferencia (Eliminación de Variables)</h3>
      
      <div>
        <label><strong>Variable a consultar: </strong></label>
        <select value={consultaVar} onChange={e => handleCambioVariableConsulta(e.target.value)}>
          {variables.map(v => (
            <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h4>Evidencia (Opcional):</h4>
        {variables.filter(v => v.nombre !== consultaVar).map(v => (
          <div key={v.nombre} style={{ marginBottom: '0.25rem' }}>
            <span>{v.nombre}: </span>
            <select
              value={evidencia[v.nombre] || ''}
              onChange={e => handleEvidenciaChange(v.nombre, e.target.value)}
            >
              <option value="">-- Sin evidencia --</option>
              {v.estados.map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button onClick={ejecutarConsulta} style={{ marginTop: '1rem' }}>Calcular Probabilidades</button>

      {resultado && (
        <div style={{ marginTop: '1rem', background: '#f4f4f4', color: '#222', padding: '0.8rem', borderRadius: '4px' }}>
          <h4>Resultado de P({consultaVar}):</h4>
          <ul>
            {resultado.map((fila, idx) => (
              <li key={idx}>
                Estado <strong>{fila[consultaVar]}</strong>: {(fila.probabilidad * 100).toFixed(2)}% ({fila.probabilidad.toFixed(4)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}