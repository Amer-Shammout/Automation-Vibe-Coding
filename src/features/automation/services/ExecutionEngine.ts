import { IConnection, INode } from '../models/Automation';
import { logger } from '../../../utils/logger';

export type ExecutionPayload = {
  text: string;
  color?: string;
};

const DEFAULT_COLOR = '#94a3b8';

export type ExecutionNodeType = 'log' | 'color';

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
  steps: ExecutionStep[];
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

const normalizePayload = (input?: Partial<ExecutionPayload>): ExecutionPayload | null => {
  if (!input || typeof input.text !== 'string' || input.text.trim().length === 0) {
    return null;
  }

  return {
    text: input.text.trim(),
    color: typeof input.color === 'string' && input.color.trim().length > 0 ? input.color.trim() : undefined,
  };
};

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

const detectCycle = (graph: BuiltGraph): string[] | null => {
  const visitState = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  const visit = (nodeId: string): string[] | null => {
    visitState.set(nodeId, 1);
    stack.push(nodeId);

    for (const nextNodeId of graph.outgoingByNode.get(nodeId) ?? []) {
      const state = visitState.get(nextNodeId) ?? 0;
      if (state === 1) {
        const cycleStartIndex = stack.indexOf(nextNodeId);
        return stack.slice(cycleStartIndex).concat(nextNodeId);
      }

      if (state === 0) {
        const cycle = visit(nextNodeId);
        if (cycle) {
          return cycle;
        }
      }
    }

    stack.pop();
    visitState.set(nodeId, 2);
    return null;
  };

  for (const nodeId of graph.nodeMap.keys()) {
    if ((visitState.get(nodeId) ?? 0) === 0) {
      const cycle = visit(nodeId);
      if (cycle) {
        return cycle;
      }
    }
  }

  return null;
};

const createRuntimeNode = (node: INode, fallbackInput?: ExecutionPayload | null): RuntimeNode => {
  const normalizedType = String(node.type || '').toLowerCase();

  return {
    id: node.id,
    type: normalizedType,
    data: node.config,
    execute: (input?: ExecutionPayload) => {
      const label = `[Node ID: ${node.id} | Type: ${normalizedType}]`;
      const fallbackText = fallbackInput?.text?.trim();
      const inputText = input?.text?.trim();

      if (normalizedType === 'color') {
        const text = inputText || fallbackText;
        if (!text) {
          logger.warn(`${label} → Missing input`);
          return null;
        }

        const selectedColor =
          typeof node.config.color === 'string' && node.config.color.trim().length > 0
            ? node.config.color.trim()
            : (input?.color ?? DEFAULT_COLOR);

        const output: ExecutionPayload = {
          text,
          color: selectedColor,
        };

        logger.info(`${label} → Executed`, {
          input,
          output,
        });
        logger.info(`[Color Node] → Color set to ${selectedColor} for text: ${text}`);
        return output;
      }

      if (normalizedType === 'log') {
        const configuredMessage =
          typeof node.config.message === 'string' && node.config.message.trim().length > 0
            ? node.config.message.trim()
            : '';

        const text = configuredMessage || inputText || fallbackText;
        if (!text) {
          logger.warn(`${label} → Missing input`);
          return null;
        }

        const output: ExecutionPayload = {
          text,
          color: input?.color,
        };

        logger.info(`${label} → Executed`, {
          input,
          output,
        });
        logger.info(`[Log Node] → LOG: ${text} (color: ${output.color ?? 'none'})`);
        return output;
      }

      logger.error(`${label} → Unknown node type`, normalizedType);
      return null;
    },
  };
};

export const executeWorkflowGraph = (
  nodes: INode[],
  connections: IConnection[],
  initialInput?: Partial<ExecutionPayload>
): ExecutionRunResult => {
  const graph = buildGraph(nodes, connections);
  const steps: ExecutionStep[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const executionOrder: string[] = [];
  const payloadByNode = new Map<string, ExecutionPayload>();
  const processed = new Set<string>();

  if (nodes.length === 0) {
    const warning = 'No nodes found in the workflow.';
    warnings.push(warning);
    logger.warn(warning);
    return {
      success: false,
      steps,
      warnings,
      errors,
      rootNodeIds: [],
      executionOrder,
    };
  }

  if (graph.invalidConnections.length > 0) {
    const warning = `Ignored ${graph.invalidConnections.length} invalid connection(s) with missing endpoints.`;
    warnings.push(warning);
    logger.warn(warning, graph.invalidConnections);
  }

  const rootNodeIds = nodes.filter(node => (graph.incomingByNode.get(node.id) ?? []).length === 0).map(node => node.id);

  if (rootNodeIds.length === 0) {
    const cycle = detectCycle(graph);
    if (cycle) {
      const message = `Cyclic graph detected: ${cycle.join(' -> ')}`;
      errors.push(message);
      logger.error(message);
    } else {
      const message = 'Graph has no starting nodes. Execution is blocked until at least one root node exists.';
      errors.push(message);
      logger.error(message);
    }

    return {
      success: false,
      steps,
      warnings,
      errors,
      rootNodeIds,
      executionOrder,
    };
  }

  const initialPayload = normalizePayload(initialInput);

  const readyQueue = [...rootNodeIds];
  const incomingRemaining = new Map<string, number>();
  const incomingSources = new Map<string, string[]>();

  nodes.forEach(node => {
    const validIncoming = graph.incomingByNode.get(node.id) ?? [];
    incomingRemaining.set(node.id, validIncoming.length);
    incomingSources.set(node.id, validIncoming);
  });

  while (readyQueue.length > 0) {
    const nodeId = readyQueue.shift();
    if (!nodeId || processed.has(nodeId)) {
      continue;
    }

    const node = graph.nodeMap.get(nodeId);
    if (!node) {
      continue;
    }

    const runtimeNode = createRuntimeNode(node, initialPayload);
    const incomingCount = incomingSources.get(nodeId)?.length ?? 0;
    const availableInput =
      payloadByNode.get(nodeId) ?? (incomingCount === 0 ? (initialPayload ?? undefined) : undefined);

    if (!availableInput) {
      const message = `[Node ID: ${node.id} | Type: ${runtimeNode.type}] → Missing input`;
      steps.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        status: 'warning',
        message: 'Missing input',
      });
      warnings.push(message);
      logger.warn(message);
      processed.add(nodeId);
      executionOrder.push(nodeId);
      continue;
    }

    if (incomingCount > 1) {
      const warning = `[Node ID: ${node.id} | Type: ${runtimeNode.type}] → Multiple incoming edges detected; using the latest propagated payload.`;
      warnings.push(warning);
      logger.warn(warning);
    }

    const output = runtimeNode.execute(availableInput);
    executionOrder.push(nodeId);
    processed.add(nodeId);

    if (!output) {
      steps.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        status: runtimeNode.type === 'color' || runtimeNode.type === 'log' ? 'warning' : 'error',
        input: availableInput,
        message: 'Execution skipped',
      });
      continue;
    }

    steps.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: 'executed',
      input: availableInput,
      output,
      message:
        runtimeNode.type === 'color'
          ? `Color set to ${output.color ?? DEFAULT_COLOR} for text: ${output.text}`
          : `LOG: ${output.text} (color: ${output.color ?? 'none'})`,
    });

    (graph.outgoingByNode.get(nodeId) ?? []).forEach(nextNodeId => {
      const remaining = (incomingRemaining.get(nextNodeId) ?? 0) - 1;
      incomingRemaining.set(nextNodeId, remaining);
      payloadByNode.set(nextNodeId, output);

      if (remaining === 0) {
        readyQueue.push(nextNodeId);
      }
    });
  }

  if (processed.size < nodes.length) {
    const cycle = detectCycle(graph);
    if (cycle) {
      const message = `Cyclic graph detected: ${cycle.join(' -> ')}`;
      errors.push(message);
      logger.error(message);
    } else {
      const blockedNodes = nodes.filter(node => !processed.has(node.id)).map(node => node.name);
      const message = `Broken graph: some nodes never became ready (${blockedNodes.join(', ')}).`;
      errors.push(message);
      logger.error(message);
    }
  }

  const lastExecutedStep = [...steps].reverse().find(step => step.output);

  return {
    success: errors.length === 0 && steps.some(step => step.status === 'executed'),
    steps,
    warnings,
    errors,
    rootNodeIds,
    executionOrder,
    finalPayload: lastExecutedStep?.output,
  };
};
