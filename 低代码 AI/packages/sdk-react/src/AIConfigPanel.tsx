import React, { useState, useEffect, useRef } from 'react';
import { AIConfigClient } from '@ai-config/core';

export interface AIConfigPanelProps {
  platformId: string;
  configId?: string;
  getCurrentSchema: () => any;
  getSchemaVersion?: () => string;
  onPatchApplied?: (schema: any, patches: any[]) => void;
  renderPreview?: (schema: any) => React.ReactNode;
  auth?: {
    getToken: () => Promise<string> | string;
  };
  apiBaseUrl?: string;
  children?: React.ReactNode;
}

export const AIConfigPanel: React.FC<AIConfigPanelProps> = ({
  platformId,
  configId,
  getCurrentSchema,
  getSchemaVersion,
  onPatchApplied,
  apiBaseUrl = 'http://localhost:3000',
  children
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPatches, setCurrentPatches] = useState<any[]>([]);
  const clientRef = useRef<AIConfigClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initClient = async () => {
      const { AIConfigClient } = await import('@ai-config/core');
      clientRef.current = new AIConfigClient({
        baseUrl: apiBaseUrl,
        platformId
      });
      
      const schema = getCurrentSchema();
      const sid = await clientRef.current.createSession(schema);
      setSessionId(sid);
    };
    initClient();
  }, [platformId, apiBaseUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!clientRef.current || !sessionId || !inputValue.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const stream = await clientRef.current.sendMessage(inputValue, getCurrentSchema());
      const reader = stream.getReader();
      let assistantMessage: any = { role: 'assistant', content: '', events: [] };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantMessage.events.push(value);
        
        if (value.type === 'patch') {
          setCurrentPatches(value.data.patches);
        }
        
        if (value.type === 'done') {
          assistantMessage.patches = value.data.data?.patches;
        }
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPatches = async () => {
    if (!clientRef.current || !sessionId || !currentPatches.length) return;
    
    try {
      const result = await clientRef.current.applyPatch(
        currentPatches, 
        getSchemaVersion?.() || '0'
      );
      
      if (result.schema && onPatchApplied) {
        onPatchApplied(result.schema, currentPatches);
      }
      
      setCurrentPatches([]);
    } catch (error) {
      console.error('Error applying patches:', error);
    }
  };

  return (
    <div className="ai-config-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb',
        fontWeight: 600
      }}>
        AI 配置助手
      </div>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px',
        background: '#ffffff'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            marginBottom: '16px',
            padding: '12px',
            background: msg.role === 'user' ? '#eff6ff' : '#f3f4f6',
            borderRadius: '8px',
            maxWidth: '85%',
            marginLeft: msg.role === 'user' ? 'auto' : '0'
          }}>
            {msg.content}
            
            {msg.events?.map((event: any, eidx: number) => (
              <div key={eidx} style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginTop: '8px',
                padding: '4px 8px',
                background: '#ffffff',
                borderRadius: '4px'
              }}>
                {event.type}: {JSON.stringify(event.data)}
              </div>
            ))}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {currentPatches.length > 0 && (
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #e5e7eb',
          background: '#fef3c7'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>
            生成的修改 ({currentPatches.length} 条)
          </div>
          <div style={{ 
            fontSize: '12px', 
            fontFamily: 'monospace', 
            background: '#ffffff', 
            padding: '8px',
            borderRadius: '4px',
            maxHeight: '120px',
            overflowY: 'auto',
            marginBottom: '12px'
          }}>
            {JSON.stringify(currentPatches, null, 2)}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleApplyPatches}
              style={{ 
                padding: '8px 16px', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
              应用修改
            </button>
            <button 
              onClick={() => setCurrentPatches([])}
              style={{ 
                padding: '8px 16px', 
                background: '#6b7280', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
              取消
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid #e5e7eb',
        background: '#ffffff',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="描述你想要的修改..."
          style={{ 
            flex: 1, 
            padding: '10px 14px', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px',
            fontSize: '14px'
          }}
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};
