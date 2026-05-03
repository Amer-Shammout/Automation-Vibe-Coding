/**
 * ChatBotView - Floating AI Agent chat panel
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IAutomation } from '../../automation/models/Automation';
import {
  sendAgentMessage,
  formatAgentResponse,
  AgentAction,
  ChatMessage,
} from '../services/AgentService';
import { v4 as uuid } from 'uuid';
import './ChatBot.css';

interface ChatBotViewProps {
  automations: IAutomation[];
  onRunFlow: (automationId: string) => void;
  onSelectAutomation: (automationId: string) => void;
}

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';

export const ChatBotView: React.FC<ChatBotViewProps> = ({
  automations,
  onRunFlow,
  onSelectAutomation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_API_KEY_STORAGE) || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleAgentAction = useCallback(
    (action: AgentAction) => {
      if (action.action === 'run_flow' && (action.confidence ?? 0) >= 0.7) {
        // Find the automation by name or id
        let target = action.flowId
          ? automations.find(a => a.id === action.flowId)
          : undefined;

        if (!target && action.flowName) {
          target = automations.find(
            a => a.name.toLowerCase() === action.flowName!.toLowerCase()
          );
        }

        if (target) {
          onSelectAutomation(target.id);
          // Slight delay to let the UI switch, then run
          setTimeout(() => onRunFlow(target!.id), 400);
        }
      }
    },
    [automations, onRunFlow, onSelectAutomation]
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const agentAction = await sendAgentMessage(trimmed, automations, apiKey);
      const displayText = formatAgentResponse(agentAction, automations);

      const agentMsg: ChatMessage = {
        id: uuid(),
        role: 'agent',
        content: displayText,
        action: agentAction,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMsg]);
      handleAgentAction(agentAction);
    } catch (error) {
      const errMsg: ChatMessage = {
        id: uuid(),
        role: 'agent',
        content: `⚠️ ${error instanceof Error ? error.message : 'Failed to reach AI agent.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, apiKey, automations, handleAgentAction]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const saveApiKey = useCallback(() => {
    if (apiKey.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey.trim());
      setShowApiKeyInput(false);
    }
  }, [apiKey]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`chatbot-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Agent"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 0 1 5 5v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2V7a5 5 0 0 1 5-5z" />
            <path d="M9 22v-4a3 3 0 0 1 6 0v4" />
            <circle cx="9.5" cy="8" r="1" fill="currentColor" />
            <circle cx="14.5" cy="8" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a5 5 0 0 1 5 5v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2V7a5 5 0 0 1 5-5z" />
                  <circle cx="9.5" cy="8" r="1" fill="currentColor" />
                  <circle cx="14.5" cy="8" r="1" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h4>AI Agent</h4>
                <span className="chatbot-status">Workflow Decision Engine</span>
              </div>
            </div>
            <button
              className="chatbot-settings-btn"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </button>
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <div className="chatbot-apikey-section">
              <label>Gemini API Key:</label>
              <div className="chatbot-apikey-row">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                />
                <button onClick={saveApiKey}>Save</button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">🤖</div>
                <p>AI Workflow Agent</p>
                <span>Ask me to run, list, or explain your automations.</span>
                <div className="chatbot-suggestions">
                  <button onClick={() => { setInput('Show all workflows'); }}>📋 List workflows</button>
                  <button onClick={() => { setInput('شغل الأوتوميشن الأول'); }}>▶️ Run first flow</button>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg-${msg.role}`}>
                <div className="chatbot-msg-bubble">
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <span className="chatbot-msg-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-msg chatbot-msg-agent">
                <div className="chatbot-msg-bubble chatbot-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI agent..."
              disabled={isLoading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
