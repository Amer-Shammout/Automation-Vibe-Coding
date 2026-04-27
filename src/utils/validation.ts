/**
 * Validation utilities
 */

export const validators = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isEmpty: (value: string): boolean => {
    return value.trim().length === 0;
  },

  isValidWorkflowName: (name: string): boolean => {
    return name.length > 0 && name.length <= 255;
  },

  isValidNodeId: (id: string): boolean => {
    return id.length > 0;
  },

  hasValidConnections: (workflow: any): boolean => {
    // Check if all connections have valid source and target nodes
    if (!workflow.connections) return true;

    const nodeIds = new Set(workflow.nodes?.map((n: any) => n.id) || []);
    return workflow.connections.every((conn: any) => nodeIds.has(conn.sourceNodeId) && nodeIds.has(conn.targetNodeId));
  },
};

export const validateWorkflow = (workflow: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!validators.isValidWorkflowName(workflow.name)) {
    errors.push('Workflow name is invalid');
  }

  if (!validators.hasValidConnections(workflow)) {
    errors.push('Workflow has invalid connections');
  }

  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push('Workflow has no nodes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
