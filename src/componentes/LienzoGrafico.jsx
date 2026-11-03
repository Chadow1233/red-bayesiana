import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

export default function LienzoGrafico({ recargarTrigger, onSeleccionarVariable }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const cargarVariables = async () => {
    try {
      const res = await fetch('/api/variables');
      const variables = await res.json();

      // Convertir variables del backend a Nodos de React Flow
      const nuevosNodos = variables.map((v, idx) => ({
        id: v.nombre,
        data: { label: `${v.nombre}\n(${v.estados.join('/')})` },
        position: { x: 150 + (idx % 3) * 180, y: 100 + Math.floor(idx / 3) * 120 }
      }));

      // Convertir relaciones de padres a Aristas (Edges)
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

  // Conectar dos nodos en el lienzo
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

  return (
    <div style={{ width: '100%', height: '745px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onSeleccionarVariable(node.id)}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}