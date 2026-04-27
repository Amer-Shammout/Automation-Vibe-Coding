/**
 * App.tsx - Root application component with interactive node editor
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from './store';
import { MainLayout, Header, Sidebar } from './components/layout';
import { NodePalette } from './components/nodes/NodePalette';
import { FlowCanvas } from './components/nodes/flow';
import { IAutomation, IConnection, INode, INodePort, IWorkflow } from './features/automation/models/Automation';
import { executeWorkflowGraph } from './features/automation/services/ExecutionEngine';
import { Zap, BookOpen, Play, Settings, Edit2, Maximize2, X, Menu, Trash2 } from './components/icons';
import { NodeLibraryView } from './features/nodeLibrary/views/NodeLibraryView';
import { ExecutionsView, IExecutionViewItem } from './features/execution/views/ExecutionsView';
import { SettingsView, IEditorSettings } from './features/settings/views/SettingsView';
import { v4 as uuid } from 'uuid';
import './styles/globals.css';

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

const SETTINGS_STORAGE_KEY = 'automation-editor-settings-v1';
const APP_STORAGE_KEY = 'automation-editor-app-state-v1';

interface PersistedAppState {
  activeSection: AppSection;
  selectedAutomationId: string;
  automations: IAutomation[];
  executionHistory: IExecutionViewItem[];
  runInputText: string;
  editorSettings: IEditorSettings;
  isOutputCollapsed: boolean;
}

const nodeTemplates: NodeTemplate[] = [
  {
    id: 'color',
    name: 'Color Node',
    category: 'Core Nodes',
    icon: '🎨',
    type: 'color',
    description: 'Generates or updates active color in workflow context.',
    config: { color: '#22c55e' },
    inputs: [{ id: 'in', type: 'trigger', dataType: 'event', name: 'in' }],
    outputs: [{ id: 'out', type: 'action', dataType: 'color', name: 'color' }],
  },
  {
    id: 'log',
    name: 'Log Node',
    category: 'Core Nodes',
    icon: '📝',
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

const createInitialWorkflow = (automationId: string): IWorkflow => {
  const colorNode = createNodeFromTemplate(nodeTemplates[0], 160, 140);
  const logNode = createNodeFromTemplate(nodeTemplates[1], 470, 140);

  return {
    id: `workflow-${automationId}`,
    name: `Workflow ${automationId}`,
    description: 'Drag nodes, connect them, then run to see results.',
    nodes: [
      {
        ...colorNode,
        config: { color: '#3b82f6' },
      },
      {
        ...logNode,
        config: { message: 'Pipeline executed successfully' },
      },
    ],
    connections: [
      {
        id: uuid(),
        sourceNodeId: colorNode.id,
        sourcePortId: 'out',
        targetNodeId: logNode.id,
        targetPortId: 'in',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const createInitialAutomations = (): IAutomation[] => [
  {
    id: '1',
    name: 'Visual Automation',
    description: 'Primary automation canvas',
    workflow: createInitialWorkflow('1'),
    executionHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Testing Flow',
    description: 'Sandbox automation',
    workflow: createInitialWorkflow('2'),
    executionHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createAutomation = (id: string, name: string): IAutomation => ({
  id,
  name,
  description: 'New automation flow',
  workflow: {
    id: `workflow-${id}`,
    name: `Workflow ${name}`,
    description: 'Start by dragging nodes into the canvas.',
    nodes: [],
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
  const [selectedAutomationId, setSelectedAutomationId] = useState<string>('1');
  const [automations, setAutomations] = useState<IAutomation[]>(() => createInitialAutomations());
  const [executionLines, setExecutionLines] = useState<ExecutionLine[]>([]);
  const [executionHistory, setExecutionHistory] = useState<IExecutionViewItem[]>([]);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState<boolean>(true);
  const [isFocusMode] = useState<boolean>(false);
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);
  const [isStorageHydrated, setIsStorageHydrated] = useState<boolean>(false);
  const [runSequence, setRunSequence] = useState<number>(0);
  const [lastRunStatus, setLastRunStatus] = useState<RunVisualStatus>('idle');
  const [isRunFxActive, setIsRunFxActive] = useState<boolean>(false);
  const [runInputText, setRunInputText] = useState<string>('Hello');
  const [editorSettings, setEditorSettings] = useState<IEditorSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return {
          autoFitOnRun: true,
          showGrid: true,
          snapToGrid: false,
          compactOutput: true,
          darkMode: false,
        };
      }

      const parsed = JSON.parse(raw) as Partial<IEditorSettings>;
      return {
        autoFitOnRun: parsed.autoFitOnRun ?? true,
        showGrid: parsed.showGrid ?? true,
        snapToGrid: parsed.snapToGrid ?? false,
        compactOutput: parsed.compactOutput ?? true,
        darkMode: parsed.darkMode ?? false,
      };
    } catch {
      return {
        autoFitOnRun: true,
        showGrid: true,
        snapToGrid: false,
        compactOutput: true,
        darkMode: false,
      };
    }
  });
  const [newAutomationName, setNewAutomationName] = useState<string>('');
  const [renamingAutomationId, setRenamingAutomationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');
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
      updateSelectedWorkflow(workflow => ({
        ...workflow,
        nodes: workflow.nodes.filter(node => node.id !== nodeId),
        connections: workflow.connections.filter(
          connection => connection.sourceNodeId !== nodeId && connection.targetNodeId !== nodeId
        ),
        updatedAt: new Date(),
      }));
    },
    [updateSelectedWorkflow]
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
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(editorSettings));
  }, [editorSettings]);

  const handleSidebarThemeToggle = useCallback(() => {
    setEditorSettings(prev => {
      const next = { ...prev, darkMode: !prev.darkMode };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedAppState>;

        if (Array.isArray(parsed.automations)) {
          const hydratedAutomations = parsed.automations.map(hydrateAutomationDates);
          setAutomations(hydratedAutomations);

          if (hydratedAutomations.length > 0) {
            const persistedSelectedId = parsed.selectedAutomationId ?? hydratedAutomations[0].id;
            const resolvedSelectedId = hydratedAutomations.some(automation => automation.id === persistedSelectedId)
              ? persistedSelectedId
              : hydratedAutomations[0].id;

            setSelectedAutomationId(resolvedSelectedId);
          } else {
            setSelectedAutomationId('');
            setIsFullScreenMode(false);
          }
        }

        if (Array.isArray(parsed.executionHistory)) {
          setExecutionHistory(parsed.executionHistory.map(hydrateExecutionViewItemDates));
        }

        if (parsed.runInputText !== undefined) {
          setRunInputText(parsed.runInputText);
        }

        if (
          parsed.activeSection &&
          ['automations', 'library', 'executions', 'settings'].includes(parsed.activeSection)
        ) {
          setActiveSection(parsed.activeSection);
        }

        if (parsed.editorSettings) {
          setEditorSettings(prev => ({
            ...prev,
            ...parsed.editorSettings,
          }));
        }

        if (parsed.isOutputCollapsed !== undefined) {
          setIsOutputCollapsed(parsed.isOutputCollapsed);
        }
      }
    } catch {
      // Ignore invalid persisted state and continue with defaults.
    } finally {
      setIsStorageHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }

    const snapshot: PersistedAppState = {
      activeSection,
      selectedAutomationId,
      automations,
      executionHistory,
      runInputText,
      editorSettings,
      isOutputCollapsed,
    };

    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(snapshot));
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(editorSettings));
  }, [
    isStorageHydrated,
    activeSection,
    selectedAutomationId,
    automations,
    executionHistory,
    runInputText,
    editorSettings,
    isOutputCollapsed,
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

  const runWorkflow = () => {
    if (!selectedAutomation) {
      return;
    }

    const { nodes, connections } = selectedAutomation.workflow;
    const result = executeWorkflowGraph(nodes, connections, { text: runInputText });
    const lines: ExecutionLine[] =
      result.steps.length > 0
        ? result.steps.map(step => ({
            id: uuid(),
            nodeName: step.nodeName,
            nodeType: step.nodeType,
            message: step.message,
            color: step.output?.color ?? (step.status === 'executed' ? '#94a3b8' : undefined),
          }))
        : [
            {
              id: uuid(),
              nodeName: 'System',
              nodeType: 'info',
              message: result.errors[0] ?? result.warnings[0] ?? 'No executable path found from start nodes.',
              color: result.errors.length > 0 ? '#ef4444' : '#f59e0b',
            },
          ];

    result.warnings.forEach(warning => {
      if (!lines.some(line => line.message === warning)) {
        lines.push({
          id: uuid(),
          nodeName: 'Warning',
          nodeType: 'info',
          message: warning,
          color: '#f59e0b',
        });
      }
    });

    result.errors.forEach(error => {
      if (!lines.some(line => line.message === error)) {
        lines.push({
          id: uuid(),
          nodeName: 'Error',
          nodeType: 'info',
          message: error,
          color: '#ef4444',
        });
      }
    });

    setLastRunStatus(result.success ? 'success' : 'failed');
    setExecutionLines(lines);
    setRunSequence(prev => prev + 1);

    setExecutionHistory(prev => [
      {
        id: uuid(),
        automationName: selectedAutomation.name,
        status: result.success ? 'success' : 'failed',
        startedAt: new Date(),
        linesCount: lines.length,
      },
      ...prev,
    ]);
  };

  const handleCreateAutomation = useCallback(() => {
    const nextIndex = automations.length + 1;
    const id = uuid();
    const cleanName = newAutomationName.trim();
    const nextAutomation = createAutomation(id, cleanName.length > 0 ? cleanName : `Automation ${nextIndex}`);

    setAutomations(prev => [...prev, nextAutomation]);
    setSelectedAutomationId(id);
    setNewAutomationName('');
    setExecutionLines([]);
  }, [automations.length, newAutomationName]);

  const handleDeleteAutomation = useCallback(
    (automationId: string) => {
      const target = automations.find(automation => automation.id === automationId);
      if (!target) {
        return;
      }

      const shouldDelete = window.confirm(`Delete automation "${target.name}" permanently?`);
      if (!shouldDelete) {
        return;
      }

      const nextAutomations = automations.filter(automation => automation.id !== automationId);
      setAutomations(nextAutomations);
      setRenamingAutomationId(current => (current === automationId ? null : current));

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
    },
    [automations, selectedAutomationId]
  );

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

  return (
    <MainLayout
      header={<Header title="Automation Vibe" sidebarCollapsed={!sidebarOpen} onSidebarToggle={toggleSidebar} />}
      sidebar={
        <Sidebar
          items={sidebarItems}
          isOpen={sidebarOpen}
          isDarkMode={editorSettings.darkMode}
          onToggleTheme={handleSidebarThemeToggle}
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
                  <button className="btn btn-primary" onClick={handleCreateAutomation}>
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
                  gridTemplateColumns: isFocusMode ? '1fr' : '260px 1fr',
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
                    nodes={paletteNodes}
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
                      <span style={{ color: themeColors.mutedText, fontSize: '12px' }}>Initial text</span>
                      <input
                        value={runInputText}
                        onChange={event => setRunInputText(event.target.value)}
                        placeholder="Hello"
                        style={{
                          minWidth: '220px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${themeColors.border}`,
                          background: themeColors.panelSoft,
                          color: themeColors.text,
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
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

                    <button className="btn btn-secondary" onClick={() => setExecutionLines([])}>
                      Clear Output
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
                  <div className="canvas-fullscreen-dock-head">
                    <strong>Node Library</strong>
                    <span className="canvas-fullscreen-dock-head-icon">
                      <Menu size={14} strokeWidth={2.4} />
                    </span>
                  </div>

                  <NodePalette
                    nodes={paletteNodes}
                    interactive
                    onAddNode={templateId => handleAddNodeByTemplateId(templateId)}
                  />
                  <p className="canvas-fullscreen-dock-note">Drag and drop nodes directly into the canvas.</p>
                </aside>

                <section className="canvas-fullscreen-stage">
                  <div className="canvas-fullscreen-toolbar">
                    <div className="canvas-fullscreen-toolbar-left">
                      <strong>Full Screen Canvas</strong>
                      <span>{selectedAutomation.name}</span>
                      <input
                        value={runInputText}
                        onChange={event => setRunInputText(event.target.value)}
                        placeholder="Initial text"
                        className="canvas-fullscreen-input"
                      />
                    </div>
                    <div className="canvas-fullscreen-toolbar-actions">
                      <button className="btn btn-primary" onClick={runWorkflow}>
                        ▶ Run
                      </button>
                      <button className="btn btn-secondary" onClick={() => setExecutionLines([])}>
                        Clear Output
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
                      onNodeDragStop={handleNodeDragStop}
                      onConnect={handleConnect}
                      onEdgeReconnect={handleEdgeReconnect}
                      onEdgeDelete={handleEdgeDelete}
                      onNodeDelete={handleNodeDelete}
                      onNodeConfigChange={handleNodeConfigChange}
                      onDropNode={(nodeType, x, y) => handleAddNodeByTemplateId(nodeType, x, y)}
                    />

                    <div className={`canvas-fullscreen-output ${runFxClassName}`}>
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
                              onClick={() => setExecutionLines([])}
                            >
                              Clear
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
  );
};

export default App;
