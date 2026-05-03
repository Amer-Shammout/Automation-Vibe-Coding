/**
 * AgentService - AI Agent that interprets user intent and maps to system actions
 * Uses Gemini API as the LLM backend
 */

import { IAutomation } from '../../automation/models/Automation';

// --- Types ---

export interface AgentAction {
  action: 'run_flow' | 'list_flows' | 'get_flow_details' | 'clarify';
  flowName?: string;
  flowId?: string;
  confidence?: number;
  question?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  action?: AgentAction;
  timestamp: Date;
}

// --- System Prompt (from chatbot.md) ---

const SYSTEM_PROMPT = `You are an AI Agent embedded inside a workflow automation platform built with React, Supabase, and Gemini API.

You are NOT a chatbot. You are NOT a conversational assistant.
You are a Workflow Decision Engine responsible for interpreting user intent and mapping it to system actions.

Your job is to:
- Understand natural language instructions from the user
- Identify the correct workflow (if applicable)
- Decide the correct system action
- Return ONLY structured JSON output
- NEVER execute anything directly

You can perform ONLY the following actions:

1. run_flow — Execute a workflow when the user requests automation.
2. list_flows — Return available workflows when user asks for them.
3. get_flow_details — Return information about a specific workflow.
4. clarify — Ask a short question when the request is ambiguous.

INTENT DETECTION RULES:

▶ RUN FLOW TRIGGERS: run, execute, start, شغل, نفذ, ابدأ, شغل الأوتوميشن, نفذ الفلو, ابدأ العملية

▶ SEMANTIC MATCHING: Understand meaning, not only keywords:
- "flow 1" → first workflow
- "الأول" → first created workflow
- "الأخضر" → workflow containing green color node (#22c55e)
- "اللي فيه log" → workflow containing log node
- "الأوتوميشن تبع اللوج" → workflow with logging step

▶ LIST FLOWS: what flows exist, show workflows, عرض الفلوات, ما هي الأوتوميشنات الموجودة

▶ FLOW DETAILS: what does this flow do, تفاصيل الفلو, explain workflow, شو بيعمل هذا الفلو

▶ CLARIFICATION: request is incomplete, multiple workflows match equally, no confident mapping exists

STRICT RULES:
- NEVER behave like a chatbot
- NEVER explain reasoning
- NEVER output natural language
- NEVER execute workflows directly
- NEVER add text outside JSON
- ONLY return valid JSON

OUTPUT FORMAT (MANDATORY):

For run_flow:
{"action":"run_flow","flowName":"exact matched workflow name","flowId":"workflow id if available","confidence":0.0}

For list_flows:
{"action":"list_flows"}

For get_flow_details:
{"action":"get_flow_details","flowName":"workflow name"}

For clarify:
{"action":"clarify","question":"short and clear question to user"}

Confidence rule: Only execute if confidence >= 0.7

Return ONLY JSON. No explanations. No extra text. No markdown. No formatting outside JSON.`;

// --- Build prompt with dynamic workflow context ---

function buildPrompt(userMessage: string, automations: IAutomation[]): string {
  const workflowSummaries = automations.map((a, i) => {
    const nodeTypes = a.workflow.nodes.map(n => `${n.name} (${n.type})`).join(', ');
    const nodeColors = a.workflow.nodes
      .filter(n => n.config?.color)
      .map(n => `${n.name}: ${n.config.color}`)
      .join(', ');
    return `${i + 1}. id="${a.id}", name="${a.name}", description="${a.description || 'N/A'}", nodes=[${nodeTypes}]${nodeColors ? `, colors=[${nodeColors}]` : ''}, status=${a.workflow.isActive ? 'active' : 'inactive'}`;
  });

  return `### Available Workflows:\n${workflowSummaries.length > 0 ? workflowSummaries.join('\n') : 'No workflows available.'}\n\n### User Message:\n${userMessage}`;
}

// --- Call Gemini API with fallback models ---

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
];

async function callGeminiAPIWithModel(
  model: string,
  userPrompt: string,
  apiKey: string
): Promise<{ ok: boolean; text?: string; status?: number; retryable?: boolean }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.status === 429 || response.status === 404) {
      return { ok: false, status: response.status, retryable: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, status: response.status, text: errorText, retryable: false };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { ok: false, text: 'Empty response from model', retryable: false };
    }

    return { ok: true, text: text.trim() };
  } catch (err) {
    return { ok: false, text: String(err), retryable: false };
  }
}

async function callGeminiAPI(userPrompt: string, apiKey: string): Promise<string> {
  // Try each model in the fallback chain
  for (const model of GEMINI_MODELS) {
    const result = await callGeminiAPIWithModel(model, userPrompt, apiKey);

    if (result.ok && result.text) {
      return result.text;
    }

    // If rate-limited, try next model
    if (result.retryable) {
      continue;
    }

    // Non-retryable error, stop
    throw new Error(`Gemini API error (${result.status}): ${result.text}`);
  }

  // All models exhausted — wait and retry the first model once
  await new Promise(resolve => setTimeout(resolve, 5000));

  const retryResult = await callGeminiAPIWithModel(GEMINI_MODELS[0], userPrompt, apiKey);
  if (retryResult.ok && retryResult.text) {
    return retryResult.text;
  }

  throw new Error(
    '⏳ All Gemini models are currently rate-limited. Please wait a moment and try again.'
  );
}

// --- Parse agent response ---

function parseAgentResponse(raw: string): AgentAction {
  // Strip any markdown code fences if present
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (!parsed.action) {
      return { action: 'clarify', question: 'I could not understand the request. Can you rephrase?' };
    }

    return parsed as AgentAction;
  } catch {
    return { action: 'clarify', question: 'I received an invalid response. Can you try again?' };
  }
}

// --- Public API ---

export async function sendAgentMessage(
  userMessage: string,
  automations: IAutomation[],
  apiKey: string
): Promise<AgentAction> {
  const prompt = buildPrompt(userMessage, automations);
  const rawResponse = await callGeminiAPI(prompt, apiKey);
  return parseAgentResponse(rawResponse);
}

/**
 * Format an AgentAction into a user-friendly display message.
 */
export function formatAgentResponse(action: AgentAction, automations: IAutomation[]): string {
  switch (action.action) {
    case 'run_flow': {
      const confidence = action.confidence ?? 0;
      if (confidence < 0.7) {
        return `⚠️ I found "${action.flowName}" but my confidence is low (${Math.round(confidence * 100)}%). Should I still run it?`;
      }
      return `▶️ Running "${action.flowName}"...`;
    }

    case 'list_flows': {
      if (automations.length === 0) {
        return '📋 No workflows available. Create one first!';
      }
      const list = automations.map((a, i) => `  ${i + 1}. ${a.name}`).join('\n');
      return `📋 Available workflows:\n${list}`;
    }

    case 'get_flow_details': {
      const found = automations.find(
        a => a.name.toLowerCase() === (action.flowName ?? '').toLowerCase()
      );
      if (!found) {
        return `🔍 Workflow "${action.flowName}" not found.`;
      }
      const nodeList = found.workflow.nodes.map(n => `  • ${n.name} (${n.type})`).join('\n');
      return `🔍 **${found.name}**\n${found.description || 'No description.'}\n\nNodes:\n${nodeList}\nConnections: ${found.workflow.connections.length}`;
    }

    case 'clarify':
      return `❓ ${action.question}`;

    default:
      return '⚠️ Unknown action received.';
  }
}
