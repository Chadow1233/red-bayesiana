import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

export default function LienzoGrafico({ recargarTrigger, onSeleccionarVariable, onSeleccionarRelacion }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const cargarVariables = async () => {
    try {
      const res = await fetch('/api/variables');
      const variables = await res.json();

      const nuevosNodos = variables.map((v, idx) => ({
        id: v.nombre,
        data: { label: `${v.nombre}\n(${v.estados.join('/')})` },
        position: { x: 150 + (idx % 3) * 180, y: 100 + Math.floor(idx / 3) * 120 }
      }));

      const nuevasAristas = [];
      variables.forEach(v => {
        v.padres.forEach(padre => {
          nuevasAristas.push({
            id: `e-${padre}-${v.nombre}`,
            source: padre,
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

  const onConnect = useCallback(async (connection) => {
    try {
      const res = await fetch('/api/relaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ padre: connection.source, hijo: connection.target })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      cargarVariables();
    } catch (err) {
      alert(`Error al crear relación: ${err.message}`);
    }
  }, []);

  const onEdgesDelete = useCallback(async (edgesToDelete) => {
    for (const edge of edgesToDelete) {
      try {
        const res = await fetch('/api/relaciones', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ padre: edge.source, hijo: edge.target })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } catch (err) {
        alert(`Error al eliminar relación: ${err.message}`);
      }
    }
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
      fitView // <--- Centra y ajusta el zoom automáticamente a la pantalla del celular
    >
      <Background />
      <Controls />
    </ReactFlow>
  </div>
)}