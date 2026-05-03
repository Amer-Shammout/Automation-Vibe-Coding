import { IConnection, INode } from '../models/Automation';
import { logger } from '../../../utils/logger';

export type ExecutionPayload = {
  text: string;
  color?: string;
};

const DEFAULT_COLOR = '#94a3b8';

export type ExecutionNodeType = 'start' | 'log' | 'color';

export type ExecutionStepStatus = 'executed' | 'warning' | 'error' | 'skipped';

export interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: ExecutionStepStatus;
  input?: ExecutionPayload;
  output?: ExecutionPayload;
  message: string;
}

export interface ExecutionRunResult {
  success: boolean;
  steps: ExecutionStep[][]; // Array of execution waves
  warnings: string[];
  errors: string[];
  rootNodeIds: string[];
  executionOrder: string[];
  finalPayload?: ExecutionPayload;
}

interface RuntimeNode {
  id: string;
  type: ExecutionNodeType | string;
  data: Record<string, unknown>;
  execute: (input?: ExecutionPayload) => ExecutionPayload | null;
}

interface BuiltGraph {
  incomingByNode: Map<string, string[]>;
  outgoingByNode: Map<string, string[]>;
  nodeMap: Map<string, INode>;
  invalidConnections: string[];
}

const buildGraph = (nodes: INode[], connections: IConnection[]): BuiltGraph => {
  const nodeMap = new Map<string, INode>();
  const incomingByNode = new Map<string, string[]>();
  const outgoingByNode = new Map<string, string[]>();
  const invalidConnections: string[] = [];

  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    incomingByNode.set(node.id, []);
    outgoingByNode.set(node.id, []);
  });

  connections.forEach(connection => {
    if (!nodeMap.has(connection.sourceNodeId) || !nodeMap.has(connection.targetNodeId)) {
      invalidConnections.push(connection.id);
      return;
    }

    outgoingByNode.get(connection.sourceNodeId)?.push(connection.targetNodeId);
    incomingByNode.get(connection.targetNodeId)?.push(connection.sourceNodeId);
  });

  return {
    incomingByNode,
    outgoingByNode,
    nodeMap,
    invalidConnections,
  };
};

const mixColors = (colors: string[]): string => {
  const validColors = colors.filter(c => c && c.startsWith('#'));
  if (validColors.length === 0) return DEFAULT_COLOR;
  if (validColors.length === 1) return validColors[0];
  
  let r = 0, g = 0, b = 0;
  validColors.forEach(c => {
    const hex = c.replace('#', '');
    r += parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16) || 0;
    g += parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16) || 0;
    b += parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16) || 0;
  });
  
  r = Math.floor(r / validColors.length);
  g = Math.floor(g / validColors.length);
  b = Math.floor(b / validColors.length);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const createRuntimeNode = (node: INode): RuntimeNode => {
  const normalizedType = String(node.type || '').toLowerCase();

  return {
    id: node.id,
    type: normalizedType,
    data: node.config,
    execute: (input?: ExecutionPayload) => {
      const label = `[Node ID: ${node.id} | Type: ${normalizedType}]`;
      const inputText = input?.text?.trim();

      if (normalizedType === 'start') {
        const configuredText = typeof node.config.text === 'string' ? node.config.text : 'Start Run';
        return { text: configuredText, color: node.config.color ?? DEFAULT_COLOR };
      }

      if (normalizedType === 'color') {
        const text = inputText || 'No Input';
        const selectedColor =
          typeof node.config.color === 'string' && node.config.color.trim().length > 0
            ? node.config.color.trim()
            : (input?.color ?? DEFAULT_COLOR);

        const output: ExecutionPayload = {
          text,
          color: selectedColor,
        };

        logger.info(`${label} → Executed`, { input, output });
        return output;
      }

      if (normalizedType === 'log') {
        const configuredMessage =
          typeof node.config.message === 'string' && node.config.message.trim().length > 0
            ? node.config.message.trim()
            : '';

        const text = configuredMessage || inputText || 'No Input';
        const output: ExecutionPayload = { text, color: input?.color };

        logger.info(`${label} → Executed`, { input, output });
        return output;
      }

      logger.error(`${label} → Unknown node type`, normalizedType);
      return null;
    },
  };
};

export const executeWorkflowGraph = (
  nodes: INode[],
  connections: IConnection[]
): ExecutionRunResult => {
  const graph = buildGraph(nodes, connections);
  const steps: ExecutionStep[][] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const executionOrder: string[] = [];
  const processed = new Set<string>();

  if (nodes.length === 0) {
    const warning = 'No nodes found in the workflow.';
    warnings.push(warning);
    logger.warn(warning);
    return { success: false, steps, warnings, errors, rootNodeIds: [], executionOrder };
  }

  if (graph.invalidConnections.length > 0) {
    const warning = `Ignored ${graph.invalidConnections.length} invalid connection(s).`;
    warnings.push(warning);
  }

  // Automation ONLY starts from nodes of type 'start'
  const rootNodeIds = nodes.filter(node => node.type.toLowerCase() === 'start').map(node => node.id);

  if (rootNodeIds.length === 0) {
    const message = 'No strictly "Start" nodes found. Execution must start via a Start node.';
    errors.push(message);
    logger.error(message);
    return { success: false, steps, warnings, errors, rootNodeIds, executionOrder };
  }

  let readyQueue = [...rootNodeIds];
  const incomingRemaining = new Map<string, number>();
  const incomingSources = new Map<string, string[]>();
  
  // Track output payloads for each node
  const outputPayloads = new Map<string, ExecutionPayload>();

  nodes.forEach(node => {
    const validIncoming = graph.incomingByNode.get(node.id) ?? [];
    incomingRemaining.set(node.id, validIncoming.length);
    incomingSources.set(node.id, validIncoming);
  });

  while (readyQueue.length > 0) {
    const currentWave = [...readyQueue];
    readyQueue = [];
    const stepWave: ExecutionStep[] = [];

    for (const nodeId of currentWave) {
      if (processed.has(nodeId)) continue;
      
      const node = graph.nodeMap.get(nodeId);
      if (!node) continue;

      const runtimeNode = createRuntimeNode(node);
      const sources = incomingSources.get(nodeId) ?? [];
      
      // Combine inputs from sources
      const incomingPayloads = sources.map(src => outputPayloads.get(src)).filter((p): p is ExecutionPayload => p !== undefined);
      
      let availableInput: ExecutionPayload | undefined = undefined;
      if (incomingPayloads.length > 0) {
        availableInput = {
          text: incomingPayloads.map(p => p.text).join(' & '),
          color: mixColors(incomingPayloads.map(p => p.color ?? ''))
        };
      }

      if (!availableInput && runtimeNode.type !== 'start') {
        const message = `[Node ID: ${node.id} | Type: ${runtimeNode.type}] → Missing input`;
        stepWave.push({ nodeId: node.id, nodeName: node.name, nodeType: node.type, status: 'warning', message: 'Missing input' });
        warnings.push(message);
        processed.add(nodeId);
        executionOrder.push(nodeId);
        continue;
      }

      const output = runtimeNode.execute(availableInput);
      executionOrder.push(nodeId);
      processed.add(nodeId);

      if (!output) {
        stepWave.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          status: runtimeNode.type === 'color' || runtimeNode.type === 'log' ? 'warning' : 'error',
          input: availableInput,
          message: 'Execution skipped',
        });
        continue;
      }
      
      outputPayloads.set(nodeId, output);

      stepWave.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        status: 'executed',
        input: availableInput,
        output,
        message: runtimeNode.type === 'start' 
          ? `Started with text: ${output.text}`
          : runtimeNode.type === 'color'
          ? `Color set to ${output.color ?? DEFAULT_COLOR} for text: ${output.text}`
          : `LOG: ${output.text} (color: ${output.color ?? 'none'})`,
      });

      // Prepare next wave
      for (const nextNodeId of graph.outgoingByNode.get(nodeId) ?? []) {
        const remaining = (incomingRemaining.get(nextNodeId) ?? 0) - 1;
        incomingRemaining.set(nextNodeId, remaining);

        if (remaining === 0) {
          readyQueue.push(nextNodeId);
        }
      }
    }
    
    if (stepWave.length > 0) {
      steps.push(stepWave);
    }
  }

  if (processed.size < nodes.length) {
    // Only warn about unreachable nodes instead of making it an error, 
    // since we restrict starting to purely "Start" nodes. Some might be disconnected.
    const blockedNodes = nodes.filter(node => !processed.has(node.id)).map(node => node.name);
    warnings.push(`${blockedNodes.length} node(s) were ignored or unreachable.`);
  }

  const lastWave = steps[steps.length - 1];
  const lastExecutedStep = lastWave ? lastWave.find(step => step.output) : undefined;

  return {
    success: errors.length === 0 && steps.some(wave => wave.some(s => s.status === 'executed')),
    steps, // ExecutionStep[][] representing parallel waves
    warnings,
    errors,
    rootNodeIds,
    executionOrder,
    finalPayload: lastExecutedStep?.output,
  };
};
