/**
 * NodeCanvas - Main canvas for rendering nodes and connections
 * Now powered by React Flow for professional drag-and-drop functionality
 */

import React from 'react';
import { IWorkflow } from '../../features/automation/models/types';
import { FlowCanvas } from './flow';
import { useReactFlow } from '../../hooks/useReactFlow';

interface NodeCanvasProps {
  workflow: IWorkflow | null;
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  onAddNode?: (x: number, y: number) => void;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ workflow, selectedNodeId, onNodeClick, onAddNode }) => {
  const { handleNodeDragStop, handleConnect, handleEdgeDelete, handleNodeDelete, handlePaneClick } = useReactFlow();

  if (!workflow) {
    return <div className="node-canvas">No workflow loaded</div>;
  }

  return (
    <div className="node-canvas">
      <FlowCanvas
        workflow={workflow}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onEdgeDelete={handleEdgeDelete}
        onNodeDelete={handleNodeDelete}
        onPaneClick={handlePaneClick}
      />
    </div>
  );
};
