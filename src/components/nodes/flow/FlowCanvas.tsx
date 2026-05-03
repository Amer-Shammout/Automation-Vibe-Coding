import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  OnSelectionChangeParams,
  updateEdge,
  addEdge,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ZoomIn, ZoomOut, Minimize2, Lock } from '../../../components/icons';
import { IWorkflow } from '../../../features/automation/models/Automation';
import { nodeToFlowNode, connectionToFlowEdge, IFlowNode } from './types';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import './FlowCanvas.css';

interface FlowCanvasProps {
  workflow: IWorkflow | null;
  showGrid?: boolean;
  snapToGrid?: boolean;
  autoFitOnRun?: boolean;
  fitViewTrigger?: number;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onNodeDragStop?: (nodeId: string, x: number, y: number) => void;
  onConnect?: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
  onEdgeReconnect?: (
    edgeId: string,
    sourceId: string,
    sourcePort: string,
    targetId: string,
    targetPort: string
  ) => void;
  onEdgeDelete?: (edgeId: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeConfigChange?: (nodeId: string, patch: Record<string, unknown>) => void;
  onSelectionChange?: (selectedNodeIds: string[], selectedEdgeIds: string[]) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  onDropNode?: (nodeType: string, x: number, y: number) => void;
}

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

interface CompactControlsProps {
  isLocked?: boolean;
  onToggleLock?: () => void;
}

const CompactControls: React.FC<CompactControlsProps> = ({ isLocked = false, onToggleLock }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="compact-controls">
      <button
        className="compact-control-btn"
        onClick={() => zoomIn()}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <ZoomIn size={18} strokeWidth={2.2} />
      </button>
      <button
        className="compact-control-btn"
        onClick={() => zoomOut()}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <ZoomOut size={18} strokeWidth={2.2} />
      </button>
      <button
        className="compact-control-btn"
        onClick={() => fitView({ padding: 0.15, duration: 280 })}
        title="Fit View"
        aria-label="Fit View"
      >
        <Minimize2 size={18} strokeWidth={2.2} />
      </button>
      <button
        className={`compact-control-btn ${isLocked ? 'locked' : ''}`}
        onClick={onToggleLock}
        title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
        aria-label={isLocked ? "Unlock Canvas" : "Lock Canvas"}
      >
        <Lock size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
};

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  workflow,
  showGrid = true,
  snapToGrid = false,
  autoFitOnRun = true,
  fitViewTrigger = 0,
  isLocked = false,
  onToggleLock,
  onNodeDragStop,
  onConnect,
  onEdgeReconnect,
  onEdgeDelete,
  onNodeDelete,
  onNodeConfigChange,
  onSelectionChange,
  onPaneClick,
  onDropNode,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const edgeReconnectSuccessful = useRef<boolean>(true);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const toFlowNodes = useCallback(
    (value: IWorkflow | null): IFlowNode[] => {
      if (!value) {
        return [];
      }

      return value.nodes.map(node => {
        const flowNode = nodeToFlowNode(node, {
          onUpdateConfig: patch => onNodeConfigChange?.(node.id, patch),
          onDelete: () => onNodeDelete?.(node.id),
        });
        return {
          ...flowNode,
          draggable: !isLocked,
        };
      });
    },
    [onNodeConfigChange, onNodeDelete, isLocked]
  );

  const toFlowEdges = useCallback((value: IWorkflow | null): Edge[] => {
    if (!value) {
      return [];
    }

    return value.connections.map(connection => connectionToFlowEdge(connection));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(workflow));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(workflow));

  // Sync only when workflow shape changes in source state
  React.useEffect(() => {
    setNodes(toFlowNodes(workflow));
    setEdges(toFlowEdges(workflow));
  }, [workflow, toFlowNodes, toFlowEdges, setNodes, setEdges]);

  React.useEffect(() => {
    if (!reactFlowInstance || !autoFitOnRun || fitViewTrigger === 0) {
      return;
    }

    reactFlowInstance.fitView({ padding: 0.15, duration: 280 });
  }, [reactFlowInstance, autoFitOnRun, fitViewTrigger]);

  // Handle node drag stop
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeDragStop) {
        onNodeDragStop(node.id, node.position.x, node.position.y);
      }
    },
    [onNodeDragStop]
  );

  // Handle new connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (onConnect && connection.source && connection.target && connection.sourceHandle && connection.targetHandle) {
        // Extract port IDs from handles (format: "input-portId" or "output-portId")
        const sourcePort = connection.sourceHandle.replace('output-', '');
        const targetPort = connection.targetHandle.replace('input-', '');

        onConnect(connection.source, sourcePort, connection.target, targetPort);

        // Add edge to local state
        setEdges(eds =>
          addEdge(
            {
              ...connection,
              type: 'customEdge',
              updatable: true,
            },
            eds
          )
        );
      }
    },
    [onConnect, setEdges]
  );

  // Handle edge deletion
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      if (onEdgeDelete) {
        onEdgeDelete(edgeId);
      }
      setEdges(eds => eds.filter(e => e.id !== edgeId));
    },
    [onEdgeDelete, setEdges]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach(node => {
        onNodeDelete?.(node.id);
      });
    },
    [onNodeDelete]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach(edge => {
        handleEdgeDelete(edge.id);
      });
    },
    [handleEdgeDelete]
  );

  const handleEdgeUpdateStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const handleEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (
        !newConnection.source ||
        !newConnection.target ||
        !newConnection.sourceHandle ||
        !newConnection.targetHandle
      ) {
        return;
      }

      edgeReconnectSuccessful.current = true;

      setEdges(eds =>
        updateEdge(oldEdge, newConnection, eds).map(edge =>
          edge.id === oldEdge.id
            ? {
                ...edge,
                type: 'customEdge',
                updatable: true,
              }
            : edge
        )
      );

      const sourcePort = newConnection.sourceHandle.replace('output-', '');
      const targetPort = newConnection.targetHandle.replace('input-', '');
      onEdgeReconnect?.(oldEdge.id, newConnection.source, sourcePort, newConnection.target, targetPort);
    },
    [setEdges, onEdgeReconnect]
  );

  const handleEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        handleEdgeDelete(edge.id);
      }

      edgeReconnectSuccessful.current = true;
    },
    [handleEdgeDelete]
  );

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      onSelectionChange?.(
        params.nodes.map(node => node.id),
        params.edges.map(edge => edge.id)
      );
    },
    [onSelectionChange]
  );

  // Handle key press for edge deletion
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        edges.forEach(edge => {
          if (edge.selected) {
            handleEdgeDelete(edge.id);
          }
        });
        nodes.forEach(node => {
          if (node.selected && onNodeDelete) {
            onNodeDelete(node.id);
          }
        });
      }
    },
    [edges, nodes, handleEdgeDelete, onNodeDelete]
  );

  // Handle pane click
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (onPaneClick) {
        onPaneClick(event);
      }
    },
    [onPaneClick]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!onDropNode || !reactFlowInstance || !wrapperRef.current) {
        return;
      }

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onDropNode(nodeType, position.x, position.y);
    },
    [onDropNode, reactFlowInstance]
  );

  return (
    <div
      ref={wrapperRef}
      className="flow-canvas-container"
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onEdgeUpdateStart={handleEdgeUpdateStart}
        onEdgeUpdate={handleEdgeUpdate}
        onEdgeUpdateEnd={handleEdgeUpdateEnd}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionRadius={32}
        reconnectRadius={40}
        snapToGrid={snapToGrid}
        snapGrid={[24, 24]}
        edgesUpdatable
        onInit={setReactFlowInstance}
        fitView
      >
        {showGrid && <Background color="#94a3b8" gap={16} size={1} />}
        <CompactControls isLocked={isLocked} onToggleLock={onToggleLock} />
      </ReactFlow>
    </div>
  );
};
