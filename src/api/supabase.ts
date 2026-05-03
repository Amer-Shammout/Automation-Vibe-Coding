import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { IAutomation } from '../features/automation/models/Automation';
import { IExecutionViewItem } from '../features/execution/views/ExecutionsView';
import { IEditorSettings } from '../features/settings/views/SettingsView';

const APP_STATE_ROW_ID = 'default';

let supabaseClient: SupabaseClient | null = null;

export interface AppStatePayload {
  activeSection: 'automations' | 'library' | 'executions' | 'settings';
  selectedAutomationId: string;
  automations: IAutomation[];
  executionHistory: IExecutionViewItem[];
  editorSettings: IEditorSettings;
  isOutputCollapsed: boolean;
}

const getSupabaseClient = (): SupabaseClient | null => {
  const SUPABASE_URL = typeof window !== 'undefined' ? window.SUPABASE_URL : undefined;
  const SUPABASE_PUBLISHABLE_KEY = typeof window !== 'undefined' ? window.SUPABASE_PUBLISHABLE_KEY : undefined;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }

  return supabaseClient;
};

export const isSupabaseConfigured = (): boolean => {
  const SUPABASE_URL = typeof window !== 'undefined' ? window.SUPABASE_URL : undefined;
  const SUPABASE_PUBLISHABLE_KEY = typeof window !== 'undefined' ? window.SUPABASE_PUBLISHABLE_KEY : undefined;

  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
};

export const loadAppState = async (): Promise<AppStatePayload | null> => {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const [appStateRes, automationsRes, executionsRes] = await Promise.all([
    client.from('app_state').select('payload').eq('id', APP_STATE_ROW_ID).maybeSingle(),
    client.from('automations').select('payload'),
    client.from('executions').select('payload').order('created_at', { ascending: false }),
  ]);

  if (appStateRes.error) throw appStateRes.error;
  if (automationsRes.error) throw automationsRes.error;
  if (executionsRes.error) throw executionsRes.error;

  const appStatePayload = appStateRes.data?.payload as Partial<AppStatePayload> | undefined;
  if (!appStatePayload) return null;

  return {
    ...appStatePayload,
    automations: automationsRes.data ? automationsRes.data.map(d => d.payload as IAutomation) : [],
    executionHistory: executionsRes.data ? executionsRes.data.map(d => d.payload as IExecutionViewItem) : [],
  } as AppStatePayload;
};

export const saveAppState = async (payload: AppStatePayload): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in public/env.js.');
  }

  // 1. Save main app state (excluding automations and executions)
  const mainPayload = {
    activeSection: payload.activeSection,
    selectedAutomationId: payload.selectedAutomationId,
    editorSettings: payload.editorSettings,
    isOutputCollapsed: payload.isOutputCollapsed,
  };

  const { error: appStateError } = await client.from('app_state').upsert({
    id: APP_STATE_ROW_ID,
    payload: mainPayload,
    updated_at: new Date().toISOString(),
  });

  if (appStateError) throw appStateError;

  // 2. Automations
  const currentAutomationIds = payload.automations.map(a => a.id);
  
  if (payload.automations.length > 0) {
    const automationsData = payload.automations.map(a => ({
      id: a.id,
      payload: a,
      updated_at: new Date().toISOString(),
    }));
    const { error: automationsError } = await client.from('automations').upsert(automationsData);
    if (automationsError) throw automationsError;
  }

  // Delete removed automations
  const { data: existingAutomations } = await client.from('automations').select('id');
  if (existingAutomations) {
    const idsToDelete = existingAutomations.map(a => a.id).filter(id => !currentAutomationIds.includes(id));
    if (idsToDelete.length > 0) {
      await client.from('automations').delete().in('id', idsToDelete);
    }
  }

  // 3. Executions
  const currentExecutionIds = payload.executionHistory.map(e => e.id);

  if (payload.executionHistory.length > 0) {
    const executionsData = payload.executionHistory.map(e => ({
      id: e.id,
      automation_id: e.automationId,
      payload: e,
      updated_at: new Date().toISOString(),
    }));
    const { error: executionsError } = await client.from('executions').upsert(executionsData);
    if (executionsError) throw executionsError;
  }

  // Delete removed executions
  const { data: existingExecutions } = await client.from('executions').select('id');
  if (existingExecutions) {
    const execIdsToDelete = existingExecutions.map(e => e.id).filter(id => !currentExecutionIds.includes(id));
    if (execIdsToDelete.length > 0) {
      await client.from('executions').delete().in('id', execIdsToDelete);
    }
  }
};
