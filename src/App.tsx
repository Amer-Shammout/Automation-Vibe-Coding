/**
 * App.tsx - Root application component with interactive node editor
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from './store';
import { MainLayout, Sidebar } from './components/layout';
import { NodePalette } from './components/nodes/NodePalette';
import { FlowCanvas } from './components/nodes/flow';
import { Modal } from './components/common';
import { IAutomation, IConnection, INode, INodePort, IWorkflow } from './features/automation/models/Automation';
import { executeWorkflowGraph } from './features/automation/services/ExecutionEngine';
import { isSupabaseConfigured, loadAppState, saveAppState } from './api';
import { Zap, BookOpen, Play, Settings, Edit2, Maximize2, X, Trash2 } from './components/icons';
import { NodeLibraryView } from './features/nodeLibrary/views/NodeLibraryView';
import { ExecutionsView, IExecutionViewItem } from './features/execution/views/ExecutionsView';
import { SettingsView, IEditorSettings } from './features/settings/views/SettingsView';
import { v4 as uuid } from 'uuid';
import { ChatBotView } from './features/chatbot/views/ChatBotView';
import './styles/globals.css';
import './styles/glassmorphism.css';

interface NodeTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  type: string;
  description: string;
  config: Record<string, unknown>;
  inputs: INodePort[];
  outputs: INodePort[];
}

interface ExecutionLine {
  id: string;
  nodeName: string;
  nodeType: string;
  message: string;
  color?: string;
}

type AppSection = 'automations' | 'library' | 'executions' | 'settings';
type RunVisualStatus = 'idle' | 'success' | 'failed';
type SaveFeedbackState = {
  kind: 'idle' | 'saving' | 'success' | 'error';
  message: string;
};

interface PersistedAppState {
  activeSection: AppSection;
  selectedAutomationId: string;
  automations: IAutomation[];
  executionHistory: IExecutionViewItem[];
  editorSettings: IEditorSettings;
  isOutputCollapsed: boolean;
}

const nodeTemplates: NodeTemplate[] = [
  {
    id: 'start',
    name: 'Start',
    category: 'Core Nodes',
    icon: 'play',
    type: 'start',
    description: 'The entry point for the automation flow.',
    config: { text: 'Start Run', color: '#00d2ff' },
    inputs: [],
    outputs: [{ id: 'out', type: 'action', dataType: 'event', name: 'out' }],
  },
  {
    id: 'color',
    name: 'Color',
    category: 'Core Nodes',
    icon: 'palette',
    type: 'color',
    description: 'Generates or updates active color in workflow context.',
    config: { color: '#22c55e' },
    inputs: [{ id: 'in', type: 'trigger', dataType: 'event', name: 'in' }],
    outputs: [{ id: 'out', type: 'action', dataType: 'color', name: 'color' }],
  },
  {
    id: 'log',
    name: 'Log',
    category: 'Core',
    icon: 'file-text',
    type: 'log',
    description: 'Writes a message to execution output using active context.',
    config: { message: 'Log node executed' },
    inputs: [{ id: 'in', type: 'trigger', dataType: 'event', name: 'in' }],
    outputs: [{ id: 'out', type: 'action', dataType: 'result', name: 'result' }],
  },
];

const createNodeFromTemplate = (template: NodeTemplate, x: number, y: number): INode => ({
  id: uuid(),
  name: template.name,
  type: template.type,
  inputs: template.inputs,
  outputs: template.outputs,
  config: template.config,
  position: { x, y },
  createdAt: new Date(),
  updatedAt: new Date(),
});

type ConfirmDialogState =
  | { action: 'deleteAutomation'; automationId: string; automationName: string }
  | { action: 'clearWorkspace' }
  | null;

const createAutomation = (id: string, name: string): IAutomation => ({
  id,
  name,
  description: 'New automation flow',
  workflow: {
    id: `workflow-${id}`,
    name: `Workflow ${name}`,
    description: 'Start by dragging nodes into the canvas.',
    nodes: [
      {
        ...createNodeFromTemplate(nodeTemplates[0], 120, 160),
        config: { text: 'Start Flow' },
      },
    ],
    connections: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  executionHistory: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

const hydrateAutomationDates = (automation: IAutomation): IAutomation => ({
  ...automation,
  createdAt: toDate(automation.createdAt),
  updatedAt: toDate(automation.updatedAt),
  workflow: {
    ...automation.workflow,
    createdAt: toDate(automation.workflow.createdAt),
    updatedAt: toDate(automation.workflow.updatedAt),
    nodes: automation.workflow.nodes.map(node => ({
      ...node,
      createdAt: toDate(node.createdAt),
      updatedAt: toDate(node.updatedAt),
    })),
    connections: automation.workflow.connections.map(connection => ({
      ...connection,
      createdAt: toDate(connection.createdAt),
      updatedAt: toDate(connection.updatedAt),
    })),
  },
  executionHistory: automation.executionHistory.map(execution => ({
    ...execution,
    createdAt: toDate(execution.createdAt),
    updatedAt: toDate(execution.updatedAt),
    startTime: toDate(execution.startTime),
    endTime: execution.endTime ? toDate(execution.endTime) : undefined,
  })),
});

const hydrateExecutionViewItemDates = (item: IExecutionViewItem): IExecutionViewItem => ({
  ...item,
  startedAt: toDate(item.startedAt),
});

const App: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [activeSection, setActiveSection] = useState<AppSection>('automations');
  const [selectedAutomationId, setSelectedAutomationId] = useState<string>('');
  const [automations, setAutomations] = useState<IAutomation[]>([]);
  const [executionLines, setExecutionLines] = useState<ExecutionLine[]>([]);
  const [executionHistory, setExecutionHistory] = useState<IExecutionViewItem[]>([]);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState<boolean>(true);
  const [isFocusMode] = useState<boolean>(false);
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);
  const [isRemoteStateLoaded, setIsRemoteStateLoaded] = useState<boolean>(false);
  const [runSequence, setRunSequence] = useState<number>(0);
  const [lastRunStatus, setLastRunStatus] = useState<RunVisualStatus>('idle');
  const [isRunFxActive, setIsRunFxActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [executingNodes, setExecutingNodes] = useState<string[]>([]);
  const [executingEdges, setExecutingEdges] = useState<string[]>([]);
  const [editorSettings, setEditorSettings] = useState<IEditorSettings>(() => {
    return {
      autoFitOnRun: true,
      showGrid: true,
      snapToGrid: false,
      compactOutput: true,
      darkMode: true,
    };
  });
  const [newAutomationName, setNewAutomationName] = useState<string>('');
  const [renamingAutomationId, setRenamingAutomationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>({ kind: 'idle', message: '' });
  const saveFeedbackTimerRef = useRef<number | null>(null);
  const themeColors = {
    panel: editorSettings.darkMode ? '#0f172a' : '#ffffff',
    panelSoft: editorSettings.darkMode ? '#111827' : '#ffffff',
    border: editorSettings.darkMode ? '#334155' : '#e2e8f0',
    text: editorSettings.darkMode ? '#e2e8f0' : '#0f172a',
    mutedText: editorSettings.darkMode ? '#94a3b8' : '#64748b',
    selectedBg: editorSettings.darkMode ? '#1e293b' : '#eff6ff',
    selectedText: editorSettings.darkMode ? '#93c5fd' : '#1e40af',
  };

  const sidebarItems = [
    {
      id: 'automations',
      label: 'Automations',
      icon: <Zap size={20} strokeWidth={2} />,
      active: activeSection === 'automations',
      onClick: () => setActiveSection('automations'),
    },
    {
      id: 'library',
      label: 'Node Library',
      icon: <BookOpen size={20} strokeWidth={2} />,
      active: activeSection === 'library',
      onClick: () => setActiveSection('library'),
    },
    {
      id: 'executions',
      label: 'Executions',
      icon: <Play size={20} strokeWidth={2} />,
      active: activeSection === 'executions',
      onClick: () => setActiveSection('executions'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} strokeWidth={2} />,
      active: activeSection === 'settings',
      onClick: () => setActiveSection('settings'),
    },
  ];

  const selectedAutomation = useMemo(
    () => automations.find(automation => automation.id === selectedAutomationId) ?? null,
    [automations, selectedAutomationId]
  );

  const showSaveFeedback = useCallback((kind: SaveFeedbackState['kind'], message: string) => {
    if (saveFeedbackTimerRef.current !== null) {
      window.clearTimeout(saveFeedbackTimerRef.current);
      saveFeedbackTimerRef.current = null;
    }

    setSaveFeedback({ kind, message });

    if (kind !== 'saving') {
      saveFeedbackTimerRef.current = window.setTimeout(() => {
        setSaveFeedback({ kind: 'idle', message: '' });
        saveFeedbackTimerRef.current = null;
      }, 2600);
    }
  }, []);

  const updateSelectedWorkflow = useCallback(
    (updater: (workflow: IWorkflow) => IWorkflow) => {
      setAutomations(prev =>
        prev.map(automation => {
          if (automation.id !== selectedAutomationId) {
            return automation;
          }

          return {
            ...automation,
            workflow: updater(automation.workflow),
            updatedAt: new Date(),
          };
        })
      );
    },
    [selectedAutomationId]
  );

  const handleAddNodeByTemplateId = useCallback(
    (templateId: string, x?: number, y?: number) => {
      const template = nodeTemplates.find(candidate => candidate.id === templateId);
      if (!template || !selectedAutomation) {
        return;
      }

      if (template.type === 'start') {
        return;
      }

      const nextX = x ?? 120 + selectedAutomation.workflow.nodes.length * 34;
      const nextY = y ?? 120 + selectedAutomation.workflow.nodes.length * 18;
      const nextNode = createNodeFromTemplate(template, nextX, nextY);

      updateSelectedWorkflow(workflow => ({
        ...workflow,
        nodes: [...workflow.nodes, nextNode],
        updatedAt: new Date(),
      }));
    },
    [selectedAutomation, updateSelectedWorkflow]
  );

  const handleNodeDragStop = useCallback(
    (nodeId: string, x: number, y: number) => {
      updateSelectedWorkflow(workflow => ({
        ...workflow,
        nodes: workflow.nodes.map(node =>
          node.id === nodeId
            ? {
                ...node,
                position: { x, y },
                updatedAt: new Date(),
              }
            : node
        ),
        updatedAt: new Date(),
      }));
    },
    [updateSelectedWorkflow]
  );

  const handleConnect = useCallback(
    (sourceId: string, sourcePortId: string, targetId: string, targetPortId: string) => {
      updateSelectedWorkflow(workflow => {
        const duplicate = workflow.connections.some(
          connection =>
            connection.sourceNodeId === sourceId &&
            connection.sourcePortId === sourcePortId &&
            connection.targetNodeId === targetId &&
            connection.targetPortId === targetPortId
        );

        if (duplicate) {
          return workflow;
        }

        const nextConnection: IConnection = {
          id: uuid(),
          sourceNodeId: sourceId,
          sourcePortId,
          targetNodeId: targetId,
          targetPortId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          ...workflow,
          connections: [...workflow.connections, nextConnection],
          updatedAt: new Date(),
        };
      });
    },
    [updateSelectedWorkflow]
  );

  const handleEdgeReconnect = useCallback(
    (edgeId: string, sourceId: string, sourcePortId: string, targetId: string, targetPortId: string) => {
      updateSelectedWorkflow(workflow => ({
        ...workflow,
        connections: workflow.connections.map(connection =>
          connection.id === edgeId
            ? {
                ...connection,
                sourceNodeId: sourceId,
                sourcePortId,
                targetNodeId: targetId,
                targetPortId,
                updatedAt: new Date(),
              }
            : connection
        ),
        updatedAt: new Date(),
      }));
    },
    [updateSelectedWorkflow]
  );

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      updateSelectedWorkflow(workflow => ({
        ...workflow,
        connections: workflow.connections.filter(connection => connection.id !== edgeId),
        updatedAt: new Date(),
      }));
    },
    [updateSelectedWorkflow]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      const nodeToDelete = selectedAutomation?.workflow.nodes.find(node => node.id === nodeId);
      if (nodeToDelete?.type?.toLowerCase() === 'start') {
        return;
      }

      updateSelectedWorkflow(workflow => ({
        ...workflow,
        nodes: workflow.nodes.filter(node => node.id !== nodeId),
        connections: workflow.connections.filter(
          connection => connection.sourceNodeId !== nodeId && connection.targetNodeId !== nodeId
        ),
        updatedAt: new Date(),
      }));
    },
    [selectedAutomation?.workflow.nodes, updateSelectedWorkflow]
  );

  const handleNodeConfigChange = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      updateSelectedWorkflow(workflow => ({
        ...workflow,
        nodes: workflow.nodes.map(node =>
          node.id === nodeId
            ? {
                ...node,
                config: {
                  ...node.config,
                  ...patch,
                },
                updatedAt: new Date(),
              }
            : node
        ),
        updatedAt: new Date(),
      }));
    },
    [updateSelectedWorkflow]
  );

  const handleToggleSetting = useCallback((key: keyof IEditorSettings) => {
    setEditorSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };

      if (key === 'compactOutput') {
        setIsOutputCollapsed(next.compactOutput);
      }

      return next;
    });
  }, []);

  const handleSaveSettings = useCallback(() => {
    const snapshot: PersistedAppState = {
      activeSection,
      selectedAutomationId,
      automations,
      executionHistory,
      editorSettings,
      isOutputCollapsed,
    };

    void saveAppState(snapshot);
  }, [activeSection, automations, editorSettings, executionHistory, isOutputCollapsed, selectedAutomationId]);

  const handleSidebarThemeToggle = useCallback(() => {
    setEditorSettings(prev => {
      return { ...prev, darkMode: !prev.darkMode };
    });
  }, []);

  React.useEffect(() => {
    if (editorSettings.darkMode) {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  }, [editorSettings.darkMode]);

  React.useEffect(() => {
    if (!isFullScreenMode) {
      document.body.classList.remove('canvas-fullscreen-active');
      return;
    }

    document.body.classList.add('canvas-fullscreen-active');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullScreenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('canvas-fullscreen-active');
    };
  }, [isFullScreenMode]);

  const paletteNodes = useMemo(
    () =>
      nodeTemplates.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        icon: template.icon,
        type: template.type,
        description: template.description,
      })),
    []
  );

  const visiblePaletteNodes = useMemo(
    () => paletteNodes.filter(node => node.type !== 'start'),
    [paletteNodes]
  );

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      showSaveFeedback(
        'error',
        'Supabase is not configured. Fill public/env.js with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.'
      );
    }

    const hydrateRemoteState = async () => {
      try {
        const remoteState = await loadAppState();

        if (!isMounted || !remoteState) {
          return;
        }

        if (Array.isArray(remoteState.automations)) {
          const hydratedAutomations = remoteState.automations.map(hydrateAutomationDates);
          setAutomations(hydratedAutomations);

          if (hydratedAutomations.length > 0) {
            const persistedSelectedId = remoteState.selectedAutomationId ?? hydratedAutomations[0].id;
            const resolvedSelectedId = hydratedAutomations.some(automation => automation.id === persistedSelectedId)
              ? persistedSelectedId
              : hydratedAutomations[0].id;

            setSelectedAutomationId(resolvedSelectedId);
          } else {
            setSelectedAutomationId('');
            setIsFullScreenMode(false);
          }
        }

        if (Array.isArray(remoteState.executionHistory)) {
          setExecutionHistory(remoteState.executionHistory.map(hydrateExecutionViewItemDates));
        }

        if (
          remoteState.activeSection &&
          ['automations', 'library', 'executions', 'settings'].includes(remoteState.activeSection)
        ) {
          setActiveSection(remoteState.activeSection);
        }

        if (remoteState.editorSettings) {
          setEditorSettings(prev => ({
            ...prev,
            ...remoteState.editorSettings,
          }));
        }

        if (remoteState.isOutputCollapsed !== undefined) {
          setIsOutputCollapsed(remoteState.isOutputCollapsed);
        }
      } catch {
        // Continue with the empty workspace if Supabase is unavailable.
      } finally {
        if (isMounted) {
          setIsRemoteStateLoaded(true);
        }
      }
    };

    void hydrateRemoteState();

    return () => {
      isMounted = false;
    };
  }, [showSaveFeedback]);

  useEffect(() => {
    if (!isRemoteStateLoaded) {
      return;
    }

    const snapshot: PersistedAppState = {
      activeSection,
      selectedAutomationId,
      automations,
      executionHistory,
      editorSettings,
      isOutputCollapsed,
    };

    const timeoutId = window.setTimeout(() => {
      void saveAppState(snapshot).catch(error => {
        showSaveFeedback(
          'error',
          error instanceof Error ? error.message : 'Failed to sync changes to Supabase.'
        );
      });
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isRemoteStateLoaded,
    activeSection,
    selectedAutomationId,
    automations,
    executionHistory,
    editorSettings,
    isOutputCollapsed,
    showSaveFeedback,
  ]);

  useEffect(() => {
    if (runSequence === 0) {
      return;
    }

    setIsRunFxActive(true);
    const timeoutId = window.setTimeout(() => {
      setIsRunFxActive(false);
    }, 1250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [runSequence]);

  const runFxClassName = isRunFxActive ? `run-fx-active run-fx-${lastRunStatus}` : '';

  const runWorkflow = async () => {
    if (!selectedAutomation || isProcessing) {
      return;
    }

    const { nodes, connections } = selectedAutomation.workflow;
    const result = executeWorkflowGraph(nodes, connections);

    // Progressive execution and animation phase
    setIsProcessing(true);
    setIsOutputCollapsed(false);
    setExecutionLines([]);
    setExecutingNodes([]);
    setExecutingEdges([]);
    document.body.classList.add('processing-active');

    let currentLines: ExecutionLine[] = [];

    // Log the start if no steps are present
    if (result.steps.length === 0) {
      const emptyLine = {
        id: uuid(),
        nodeName: 'System',
        nodeType: 'info',
        message: result.errors[0] ?? result.warnings[0] ?? 'No executable path found from start nodes.',
        color: result.errors.length > 0 ? '#ef4444' : '#f59e0b',
      };
      currentLines.push(emptyLine);
      setExecutionLines([...currentLines]);
      await new Promise(resolve => setTimeout(resolve, 800));
    } 

    const stepDelay = 1000;
    
    // Simulate iterative execution (parallel waves)
    for (let i = 0; i < result.steps.length; i++) {
      const wave = result.steps[i];
      
      // Target current nodes in this wave
      const waveNodeIds = wave.map(step => step.nodeId);
      setExecutingNodes(waveNodeIds);
      setExecutingEdges([]);

      // Append logs to terminal for this wave
      const newLines = wave.map(step => ({
        id: uuid(),
        nodeName: step.nodeName,
        nodeType: step.nodeType,
        message: step.message,
        color: step.output?.color ?? (step.status === 'executed' ? '#94a3b8' : undefined),
      }));
      currentLines = [...currentLines, ...newLines];
      setExecutionLines([...currentLines]);
      
      // Nodes actively processing time
      await new Promise(resolve => setTimeout(resolve, stepDelay));

      // After nodes process, locate their outbound edges to animate data transfer
      const activeOutgoingConnections = connections.filter(c => waveNodeIds.includes(c.sourceNodeId));
      if (activeOutgoingConnections.length > 0) {
        setExecutingEdges(activeOutgoingConnections.map(c => c.id));
        setExecutingNodes([]); // turn off node pulse
        // Wait for edge animation
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    result.warnings.forEach(warning => {
      if (!currentLines.some(line => line.message === warning)) {
        currentLines.push({
          id: uuid(),
          nodeName: 'Warning',
          nodeType: 'info',
          message: warning,
          color: '#f59e0b',
        });
      }
    });

    result.errors.forEach(error => {
      if (!currentLines.some(line => line.message === error)) {
        currentLines.push({
          id: uuid(),
          nodeName: 'Error',
          nodeType: 'info',
          message: error,
          color: '#ef4444',
        });
      }
    });

    // Cleanup phase
    setIsProcessing(false);
    document.body.classList.remove('processing-active');
    setExecutingNodes([]);
    setExecutingEdges([]);
    setExecutionLines([...currentLines]);
    setLastRunStatus(result.success ? 'success' : 'failed');
    setRunSequence(prev => prev + 1);

    setExecutionHistory(prev => [
      {
        id: uuid(),
        automationId: selectedAutomation.id,
        automationName: selectedAutomation.name,
        status: result.success ? 'success' : 'failed',
        startedAt: new Date(),
        linesCount: currentLines.length,
      },
      ...prev,
    ]);
  };

  const handleCreateAutomation = useCallback(async () => {
    const nextIndex = automations.length + 1;
    const id = uuid();
    const cleanName = newAutomationName.trim();
    const nextAutomation = createAutomation(id, cleanName.length > 0 ? cleanName : `Automation ${nextIndex}`);

    const nextAutomations = [...automations, nextAutomation];
    const snapshot: PersistedAppState = {
      activeSection,
      selectedAutomationId: id,
      automations: nextAutomations,
      executionHistory,
      editorSettings,
      isOutputCollapsed,
    };

    try {
      showSaveFeedback('saving', 'Creating automation...');
      await saveAppState(snapshot);

      setAutomations(nextAutomations);
      setSelectedAutomationId(id);
      setNewAutomationName('');
      setExecutionLines([]);
      showSaveFeedback('success', 'Automation created and saved to Supabase.');
    } catch {
      showSaveFeedback('error', 'Failed to create automation. Supabase save did not complete.');
    }
  }, [activeSection, automations, editorSettings, executionHistory, isOutputCollapsed, newAutomationName, showSaveFeedback]);

  const handleDeleteAutomation = useCallback(
    (automationId: string) => {
      const target = automations.find(automation => automation.id === automationId);
      if (!target) {
        return;
      }

      setConfirmDialog({ action: 'deleteAutomation', automationId, automationName: target.name });
    },
    [automations]
  );

  const confirmDeleteAutomation = useCallback(() => {
    if (!confirmDialog || confirmDialog.action !== 'deleteAutomation') {
      return;
    }

    const { automationId } = confirmDialog;

    const nextAutomations = automations.filter(automation => automation.id !== automationId);
    setAutomations(nextAutomations);
    setExecutionHistory(prev => prev.filter(item => item.automationId !== automationId));
    setRenamingAutomationId(current => (current === automationId ? null : current));
    setConfirmDialog(null);

    if (nextAutomations.length === 0) {
      setSelectedAutomationId('');
      setExecutionLines([]);
      setIsFullScreenMode(false);
      return;
    }

    if (selectedAutomationId === automationId) {
      setSelectedAutomationId(nextAutomations[0].id);
      setExecutionLines([]);
    }
  }, [automations, confirmDialog, selectedAutomationId]);

  const requestClearWorkspace = useCallback(() => {
    setConfirmDialog({ action: 'clearWorkspace' });
  }, []);

  const confirmClearWorkspace = useCallback(() => {
    const startTemplate = nodeTemplates.find(template => template.type === 'start');
    const startNode = selectedAutomation?.workflow.nodes.find(node => node.type?.toLowerCase() === 'start');

    updateSelectedWorkflow(workflow => ({
      ...workflow,
      nodes: startNode
        ? [startNode]
        : startTemplate
          ? [
              {
                ...createNodeFromTemplate(startTemplate, 120, 160),
                config: { text: 'Start Flow' },
              },
            ]
          : [],
      connections: [],
      updatedAt: new Date(),
    }));
    setConfirmDialog(null);
  }, [selectedAutomation?.workflow.nodes, updateSelectedWorkflow]);

  const startRenameAutomation = useCallback((automationId: string, currentName: string) => {
    setRenamingAutomationId(automationId);
    setRenameDraft(currentName);
  }, []);

  const commitRenameAutomation = useCallback(
    (automationId: string) => {
      const cleanName = renameDraft.trim();
      if (!cleanName) {
        setRenamingAutomationId(null);
        return;
      }

      setAutomations(prev =>
        prev.map(automation => {
          if (automation.id !== automationId) {
            return automation;
          }

          return {
            ...automation,
            name: cleanName,
            workflow: {
              ...automation.workflow,
              name: `Workflow ${cleanName}`,
              updatedAt: new Date(),
            },
            updatedAt: new Date(),
          };
        })
      );

      setRenamingAutomationId(null);
    },
    [renameDraft]
  );

  const cancelRenameAutomation = useCallback(() => {
    setRenamingAutomationId(null);
    setRenameDraft('');
  }, []);

  if (!isRemoteStateLoaded) {
    return (
      <div className="creative-loader-container">
        <div className="creative-loader">
          <div className="node"></div>
          <div className="node"></div>
          <div className="node"></div>
          <div className="connection conn-1"></div>
          <div className="connection conn-2"></div>
          <div className="connection conn-3"></div>
        </div>
        <div className="creative-loader-text">Loading workspace...</div>
      </div>
    );
  }

  const isSavingAutomation = saveFeedback.kind === 'saving';

  return (
    <>
      {saveFeedback.kind !== 'idle' && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 80,
            minWidth: '280px',
            maxWidth: '360px',
            padding: '12px 14px',
            borderRadius: '14px',
            color: '#e2e8f0',
            background:
              saveFeedback.kind === 'saving'
                ? 'rgba(15, 23, 42, 0.96)'
                : saveFeedback.kind === 'success'
                  ? 'rgba(16, 185, 129, 0.16)'
                  : 'rgba(239, 68, 68, 0.16)',
            border:
              saveFeedback.kind === 'saving'
                ? '1px solid rgba(148, 163, 184, 0.28)'
                : saveFeedback.kind === 'success'
                  ? '1px solid rgba(16, 185, 129, 0.35)'
                  : '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            {saveFeedback.kind === 'saving' ? 'Saving' : saveFeedback.kind === 'success' ? 'Saved' : 'Error'}
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#cbd5e1' }}>{saveFeedback.message}</div>
        </div>
      )}
      <style>
        {`
        ${executingNodes.map(id => `
          .processing-active .react-flow__node[data-id="${id}"] .glass-node {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 0 1px rgba(59, 130, 246, 0.6) !important;
            border-color: rgba(59, 130, 246, 0.8) !important;
            transform: scale(1.03);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
            animation: elegantNodePulse 1.5s infinite alternate ease-in-out !important;
            z-index: 1000;
          }
          .processing-active .react-flow__node[data-id="${id}"] .port-dot {
            box-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6 !important;
            background: #60a5fa !important;
          }
        `).join('')}

        ${executingEdges.map(id => `
          .processing-active .react-flow__edge[data-id="${id}"] .edge-path {
            stroke: #3b82f6 !important;
            stroke-width: 3px !important;
            filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8)) !important;
            transition: all 0.3s ease;
          }
          .processing-active .react-flow__edge[data-id="${id}"] .edge-flow {
            opacity: 1 !important;
            animation: energyBeam 1s linear infinite !important;
            stroke-dasharray: 6 12 !important;
            stroke: #ffffff !important;
            stroke-width: 2.5px !important;
            filter: drop-shadow(0 0 4px #ffffff) !important;
          }
        `).join('')}
        
        .processing-active .btn-primary {
           pointer-events: none;
           opacity: 0.7;
           position: relative;
        }

        .processing-active .btn-primary::after {
           content: '';
           position: absolute;
           top: 0; left: 0; right: 0; bottom: 0;
           background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
           background-size: 200% 100%;
           animation: pulseBackground 1.5s infinite;
        }
        
        @keyframes elegantNodePulse {
          0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 0 1px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), inset 0 0 0 1px rgba(59, 130, 246, 0.7); }
        }

        @keyframes energyBeam {
          from { stroke-dashoffset: 18; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes pulseBackground {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        `}
      </style>
      <MainLayout
        sidebar={
        <Sidebar
          items={sidebarItems}
          isOpen={sidebarOpen}
          isDarkMode={editorSettings.darkMode}
          onToggleTheme={handleSidebarThemeToggle}
          onToggleSidebar={toggleSidebar}
        />
      }
      sidebarCollapsed={!sidebarOpen}
      main={
        activeSection === 'automations' ? (
          <div
            className={`main-content ${runFxClassName}`}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}
          >
            {/* Automation Selector */}
            <div
              style={{
                background: themeColors.panel,
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: `1px solid ${themeColors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                  📋 Select Automation to Edit
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    value={newAutomationName}
                    onChange={event => setNewAutomationName(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        handleCreateAutomation();
                      }
                    }}
                    placeholder="Automation name"
                    style={{
                      height: '34px',
                      borderRadius: '8px',
                      border: `1px solid ${themeColors.border}`,
                      background: themeColors.panelSoft,
                      color: themeColors.text,
                      padding: '0 10px',
                      minWidth: '180px',
                      fontSize: '13px',
                    }}
                  />
                  <button className="btn btn-primary" onClick={() => void handleCreateAutomation()} disabled={isSavingAutomation}>
                    + New Automation
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {automations.length === 0 ? (
                  <div
                    style={{
                      width: '100%',
                      border: `1px dashed ${themeColors.border}`,
                      borderRadius: '10px',
                      padding: '16px',
                      color: themeColors.mutedText,
                      background: themeColors.panelSoft,
                      fontSize: '13px',
                    }}
                  >
                    No automations yet. Create your first automation to start building flows.
                  </div>
                ) : (
                  automations.map(automation => (
                    <div
                      key={automation.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px',
                        borderRadius: '8px',
                        border:
                          selectedAutomationId === automation.id
                            ? '1px solid #3b82f6'
                            : `1px solid ${themeColors.border}`,
                        background:
                          selectedAutomationId === automation.id ? themeColors.selectedBg : themeColors.panelSoft,
                      }}
                    >
                      {renamingAutomationId === automation.id ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={event => setRenameDraft(event.target.value)}
                          onBlur={() => commitRenameAutomation(automation.id)}
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              commitRenameAutomation(automation.id);
                            }
                            if (event.key === 'Escape') {
                              cancelRenameAutomation();
                            }
                          }}
                          style={{
                            height: '30px',
                            borderRadius: '6px',
                            border: '1px solid #93c5fd',
                            background: themeColors.panelSoft,
                            color: themeColors.text,
                            padding: '0 8px',
                            minWidth: '130px',
                            fontSize: '13px',
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setSelectedAutomationId(automation.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            color:
                              selectedAutomationId === automation.id ? themeColors.selectedText : themeColors.mutedText,
                            cursor: 'pointer',
                            fontWeight: selectedAutomationId === automation.id ? '700' : '500',
                            fontSize: '13px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {automation.name}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 7px' }}
                        onClick={() => startRenameAutomation(automation.id, automation.name)}
                        title="Rename automation"
                      >
                        <Edit2 size={14} strokeWidth={2.2} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 7px' }}
                        onClick={() => handleDeleteAutomation(automation.id)}
                        title="Delete automation"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {automations.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: themeColors.panel,
                  borderRadius: '12px',
                  border: `1px dashed ${themeColors.border}`,
                  padding: '24px',
                }}
              >
                <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                  <h3 style={{ color: themeColors.text, marginBottom: '10px', fontSize: '20px' }}>
                    Start Your First Automation
                  </h3>
                  <p style={{ color: themeColors.mutedText, marginBottom: '16px', lineHeight: 1.6 }}>
                    You currently have no automations. Create one using the input above, then drag nodes and connect your flow.
                  </p>
                  <button className="btn btn-primary" onClick={handleCreateAutomation}>
                    + Create First Automation
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isFocusMode ? '1fr' : '200px 1fr',
                  gap: '16px',
                  flex: 1,
                  minHeight: 0,
                }}
              >
              {!isFocusMode && (
                <div
                  style={{
                    background: themeColors.panel,
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: `1px solid ${themeColors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    minHeight: 0,
                  }}
                >
                  <NodePalette
                    nodes={visiblePaletteNodes}
                    interactive
                    onAddNode={templateId => handleAddNodeByTemplateId(templateId)}
                  />
                  <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    Drag a node into the canvas or click to add it automatically.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                <div
                  style={{
                    background: themeColors.panel,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: `1px solid ${themeColors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: themeColors.text, fontSize: '14px' }}>Workflow Runner</strong>
                      <span style={{ color: themeColors.mutedText, fontSize: '12px' }}>Supports Color + Log nodes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: themeColors.mutedText, fontSize: '12px' }}>Set the text on the Start Node inside the canvas.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsFullScreenMode(true)}
                      title="Enter Full Screen"
                      style={{ padding: '8px 10px' }}
                    >
                      <Maximize2 size={16} strokeWidth={2.3} />
                    </button>

                    <button className="btn btn-secondary" onClick={requestClearWorkspace}>
                      Clear Workspace
                    </button>
                    <button className="btn btn-primary" onClick={runWorkflow}>
                      ▶ Run
                    </button>
                  </div>
                </div>

                {/* React Flow Canvas */}
                {selectedAutomation && (
                  <div
                    className={`automation-canvas-shell ${runFxClassName}`}
                    style={{
                      flex: 1,
                      minHeight: 0,
                      background: themeColors.panel,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: `1px solid ${themeColors.border}`,
                      position: 'relative',
                    }}
                  >
                    <FlowCanvas
                      workflow={selectedAutomation.workflow}
                      showGrid={editorSettings.showGrid}
                      snapToGrid={editorSettings.snapToGrid}
                      autoFitOnRun={editorSettings.autoFitOnRun}
                      fitViewTrigger={runSequence}
                      isLocked={isLocked}
                      onToggleLock={() => setIsLocked(!isLocked)}
                      onNodeDragStop={handleNodeDragStop}
                      onConnect={handleConnect}
                      onEdgeReconnect={handleEdgeReconnect}
                      onEdgeDelete={handleEdgeDelete}
                      onNodeDelete={handleNodeDelete}
                      onNodeConfigChange={handleNodeConfigChange}
                      onDropNode={(nodeType, x, y) => handleAddNodeByTemplateId(nodeType, x, y)}
                    />

                    <div
                      className={`execution-output-panel ${runFxClassName}`}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        bottom: '14px',
                        width: isOutputCollapsed ? '220px' : '360px',
                        maxHeight: isOutputCollapsed ? '58px' : '38%',
                        background: 'rgba(15, 23, 42, 0.95)',
                        color: '#e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        boxShadow: '0 14px 26px rgba(15, 23, 42, 0.45)',
                        overflowY: isOutputCollapsed ? 'hidden' : 'auto',
                        border: '1px solid rgba(148,163,184,0.25)',
                        backdropFilter: 'blur(6px)',
                        transition: 'all 0.2s ease',
                        zIndex: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: isOutputCollapsed ? 0 : '8px',
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>Execution Output</h4>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setIsOutputCollapsed(prev => !prev)}
                          >
                            {isOutputCollapsed ? 'Open' : 'Hide'}
                          </button>
                          {!isOutputCollapsed && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => setExecutionLines([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      {!isOutputCollapsed && executionLines.length === 0 ? (
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>No output yet. Press Run.</p>
                      ) : !isOutputCollapsed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {executionLines.map(line => (
                            <div
                              className="execution-line-item"
                              key={line.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '8px',
                                background: 'rgba(30, 41, 59, 0.95)',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '7px 8px',
                                fontSize: '11px',
                              }}
                            >
                              <span>
                                <strong>{line.nodeName}</strong> [{line.nodeType}] - {line.message}
                              </span>
                              {line.color && (
                                <span
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: line.color,
                                    border: '1px solid #94a3b8',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                          {executionLines.length === 0
                            ? 'No output'
                            : `${executionLines.length} line${executionLines.length > 1 ? 's' : ''}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
            )}

            {isFullScreenMode && selectedAutomation && (
              <div className="canvas-fullscreen-overlay">
                <aside className="canvas-fullscreen-dock">
                  <NodePalette
                    nodes={visiblePaletteNodes}
                    interactive
                    onAddNode={templateId => handleAddNodeByTemplateId(templateId)}
                  />
                </aside>

                <section className="canvas-fullscreen-stage">
                  <div className="canvas-fullscreen-toolbar glass-panel">
                    <div className="canvas-fullscreen-toolbar-left">
                      <strong className="canvas-fullscreen-toolbar-title">{selectedAutomation.name}</strong>
                    </div>
                    <div className="canvas-fullscreen-toolbar-actions">
                      <button className="btn btn-primary premium-run-btn" onClick={runWorkflow}>
                        <span className="btn-text">▶ Run</span>
                        <div className="btn-glow"></div>
                      </button>
                      <button className="btn btn-secondary premium-clear-btn" onClick={requestClearWorkspace}>
                        Clear Workspace
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setIsFullScreenMode(false)}
                        title="Exit Full Screen"
                      >
                        <X size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>

                  <div className={`canvas-fullscreen-surface ${runFxClassName}`}>
                    <FlowCanvas
                      workflow={selectedAutomation.workflow}
                      showGrid={editorSettings.showGrid}
                      snapToGrid={editorSettings.snapToGrid}
                      autoFitOnRun={editorSettings.autoFitOnRun}
                      fitViewTrigger={runSequence}
                      isLocked={isLocked}
                      onToggleLock={() => setIsLocked(!isLocked)}
                      onNodeDragStop={handleNodeDragStop}
                      onConnect={handleConnect}
                      onEdgeReconnect={handleEdgeReconnect}
                      onEdgeDelete={handleEdgeDelete}
                      onNodeDelete={handleNodeDelete}
                      onNodeConfigChange={handleNodeConfigChange}
                      onDropNode={(nodeType, x, y) => handleAddNodeByTemplateId(nodeType, x, y)}
                    />

                    <div className={`canvas-fullscreen-output ${runFxClassName} ${isOutputCollapsed ? 'collapsed' : 'expanded'}`}>
                      <div className="canvas-fullscreen-output-head">
                        <h4>Execution Output</h4>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setIsOutputCollapsed(prev => !prev)}
                          >
                            {isOutputCollapsed ? 'Open' : 'Hide'}
                          </button>
                          {!isOutputCollapsed && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={requestClearWorkspace}
                            >
                              Clear Workspace
                            </button>
                          )}
                        </div>
                      </div>

                      {!isOutputCollapsed && executionLines.length === 0 ? (
                        <p className="canvas-fullscreen-output-empty">No output yet. Press Run.</p>
                      ) : !isOutputCollapsed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {executionLines.map(line => (
                            <div
                              className="execution-line-item"
                              key={line.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '8px',
                                background: 'rgba(30, 41, 59, 0.95)',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '7px 8px',
                                fontSize: '11px',
                              }}
                            >
                              <span>
                                <strong>{line.nodeName}</strong> [{line.nodeType}] - {line.message}
                              </span>
                              {line.color && (
                                <span
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: line.color,
                                    border: '1px solid #94a3b8',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="canvas-fullscreen-output-empty">
                          {executionLines.length === 0
                            ? 'No output'
                            : `${executionLines.length} line${executionLines.length > 1 ? 's' : ''}`}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        ) : activeSection === 'library' ? (
          <NodeLibraryView
            templates={nodeTemplates.map(template => ({
              id: template.id,
              name: template.name,
              type: template.type,
              category: template.category,
              icon: template.icon,
              inputsCount: template.inputs.length,
              outputsCount: template.outputs.length,
              description: template.description,
            }))}
          />
        ) : activeSection === 'executions' ? (
          <ExecutionsView executions={executionHistory} />
        ) : (
          <SettingsView settings={editorSettings} onToggle={handleToggleSetting} onSave={handleSaveSettings} />
        )
      }
    />

    <Modal
      isOpen={confirmDialog !== null}
      title={confirmDialog?.action === 'deleteAutomation' ? 'Delete Automation' : 'Clear Workspace'}
      onClose={() => setConfirmDialog(null)}
    >
      {confirmDialog?.action === 'deleteAutomation' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(251, 191, 36, 0.08))',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.14)',
                color: '#ef4444',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              !
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong style={{ color: '#0f172a', fontSize: '16px' }}>Delete automation permanently?</strong>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                The automation <strong>{confirmDialog.automationName}</strong> will be removed with its workflow and cannot be restored.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setConfirmDialog(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteAutomation}>
              Delete Automation
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(14, 165, 233, 0.08))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(59, 130, 246, 0.14)',
                color: '#3b82f6',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              ↺
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong style={{ color: '#0f172a', fontSize: '16px' }}>Clear the current workspace?</strong>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                This will remove all nodes and connections from the selected workspace.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setConfirmDialog(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={confirmClearWorkspace}>
              Clear Workspace
            </button>
          </div>
        </div>
      )}
    </Modal>

    {/* AI Agent Chatbot */}
    <ChatBotView
      automations={automations}
      onRunFlow={(automationId: string) => {
        const target = automations.find(a => a.id === automationId);
        if (target) {
          setSelectedAutomationId(automationId);
          setActiveSection('automations');
          // Trigger run after UI updates
          setTimeout(() => void runWorkflow(), 500);
        }
      }}
      onSelectAutomation={(automationId: string) => {
        setSelectedAutomationId(automationId);
        setActiveSection('automations');
      }}
    />
    </>
  );
};

export default App;
