import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import { obtenerRedLocal, guardarRedLocal } from '../componentes/AlmacenamientoLocal';

export default function LienzoGrafico({ recargarTrigger, onSeleccionarVariable, onSeleccionarRelacion }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const cargarVariables = async () => {
    try {
      let variables = obtenerRedLocal();

      // Si el dispositivo no tiene red local, descarga la base desde el servidor
      if (!variables) {
        const res = await fetch('/api/variables');
        variables = await res.json();
        guardarRedLocal(variables); // La guarda localmente para futuras modificaciones
      }

      const nuevosNodos = variables.map((v, idx) => ({
        id: v.nombre,
        data: { label: `${v.nombre}\n(${v.estados.join('/')})` },
        position: { x: 150 + (idx % 3) * 180, y: 100 + Math.floor(idx / 3) * 120 }
      }));

      const nuevasAristas = [];
      variables.forEach(v => {
        // v.padres puede ser un arreglo de strings ['H'] o de objetos [{nombre: 'H'}]
        v.padres.forEach(padre => {
          const nombrePadre = typeof padre === 'object' ? padre.nombre : padre;
          nuevasAristas.push({
            id: `e-${nombrePadre}-${v.nombre}`,
            source: nombrePadre,
            target: v.nombre,
            animated: true
          });
        });
      });

      setNodes(nuevosNodos);
      setEdges(nuevasAristas);
    } catch (err) {
      console.error('Error al cargar la red:', err);
    }
  };

  useEffect(() => {
    cargarVariables();
  }, [recargarTrigger]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Crear conexión de forma local en el navegador
  const onConnect = useCallback((connection) => {
    const variablesActuales = obtenerRedLocal() || [];
    const padreId = connection.source;
    const hijoId = connection.target;

    const variablesActualizadas = variablesActuales.map(v => {
      if (v.nombre === hijoId) {
        const padresNombres = v.padres.map(p => typeof p === 'object' ? p.nombre : p);
        if (!padresNombres.includes(padreId)) {
          return {
            ...v,
            padres: [...v.padres, padreId]
          };
        }
      }
      return v;
    });

    guardarRedLocal(variablesActualizadas);
    cargarVariables();
  }, []);

  // Eliminar conexión de forma local al presionar Suprimir / Delete
  const onEdgesDelete = useCallback((edgesToDelete) => {
    let variablesActuales = obtenerRedLocal() || [];

    edgesToDelete.forEach(edge => {
      variablesActuales = variablesActuales.map(v => {
        if (v.nombre === edge.target) {
          return {
            ...v,
            padres: v.padres.filter(p => {
              const nombrePadre = typeof p === 'object' ? p.nombre : p;
              return nombrePadre !== edge.source;
            })
          };
        }
        return v;
      });
    });

    guardarRedLocal(variablesActuales);
    cargarVariables();
  }, []);

  return (
    <div style={{ width: '100%', height: '60vh', minHeight: '450px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={['Backspace', 'Delete']}
        onNodeClick={(_, node) => {
          if (onSeleccionarRelacion) onSeleccionarRelacion(null);
          onSeleccionarVariable(node.id);
        }}
        onEdgeClick={(_, edge) => {
          if (onSeleccionarVariable) onSeleccionarVariable(null);
          if (onSeleccionarRelacion) onSeleccionarRelacion(edge);
        }}
        onPaneClick={() => {
          if (onSeleccionarVariable) onSeleccionarVariable(null);
          if (onSeleccionarRelacion) onSeleccionarRelacion(null);
        }}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}