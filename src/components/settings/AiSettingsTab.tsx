import React, { useState } from 'react';
import { getAIConfig, setAIConfig, detectModels } from '../../utils/aiClient';
import type { AIConfig } from '../../utils/aiClient';
import { Dropdown } from '../ui/Dropdown';

export const AiSettingsTab: React.FC = () => {
  const [aiConfig, setLocalAIConfig] = useState<AIConfig>(() => getAIConfig());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [availableModels, setAvailableModels] = useState<{id: string; name?: string}[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleAiConfigChange = (key: keyof AIConfig, value: string) => {
    const newConfig = { ...aiConfig, [key]: value };
    setLocalAIConfig(newConfig);
    setAIConfig(newConfig);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleDetectModels = async () => {
    if (!aiConfig.baseUrl) return;
    setIsDetecting(true);
    try {
      const models = await detectModels(aiConfig.baseUrl, aiConfig.apiKey);
      setAvailableModels(models);
      if (models.length > 0 && !aiConfig.model) {
        handleAiConfigChange('model', models[0].id);
      }
    } catch (e: unknown) {
      console.error('Model detection failed:', e);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="d-flex align-items-center justify-content-between">
        <h3>AI Integration</h3>
        {saveStatus === 'saved' && <span style={{ fontSize: '0.8rem', color: 'var(--node-emerald, #34d399)' }}>Saved</span>}
      </div>
      <p className="section-desc">Configure your preferred AI provider for intelligent features.</p>
      
      <div className="d-flex flex-column gap-3 mt-3">
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Provider</label>
          <Dropdown
            value={aiConfig.provider || 'openai'}
            onChange={(val) => {
              const newProvider = val as AIConfig['provider'];
              const newConfig = { ...aiConfig, provider: newProvider };
              if (newProvider === 'anthropic') { newConfig.baseUrl = 'https://api.anthropic.com'; newConfig.model = 'claude-3-5-sonnet-20240620'; }
              else if (newProvider === 'deepseek') { newConfig.baseUrl = 'https://api.deepseek.com'; newConfig.model = 'deepseek-chat'; }
              else if (newProvider === 'openai') { newConfig.baseUrl = 'https://api.openai.com/v1'; newConfig.model = 'gpt-4o-mini'; }
              else if (newProvider === 'google') { newConfig.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/'; newConfig.model = 'gemini-2.5-flash'; }
              else if (newProvider === 'openrouter') { newConfig.baseUrl = 'https://openrouter.ai/api/v1'; newConfig.model = 'google/gemini-2.5-flash'; }
              else if (newProvider === 'vercel') { newConfig.baseUrl = ''; newConfig.model = ''; }
              else { newConfig.baseUrl = ''; newConfig.model = ''; }
              
              setLocalAIConfig(newConfig);
              setAIConfig(newConfig);
            }}
            options={[
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'deepseek', label: 'DeepSeek' },
              { value: 'openai', label: 'OpenAI' },
              { value: 'google', label: 'Google' },
              { value: 'openrouter', label: 'OpenRouter' },
              { value: 'vercel', label: 'Vercel AI Gateway' },
              { value: 'custom', label: 'Custom Provider' }
            ]}
          />
          <div className="form-text" style={{ fontSize: '0.8rem' }}>
            {aiConfig.provider === 'anthropic' && 'Direct access to Claude models, including Pro and Max'}
            {aiConfig.provider === 'deepseek' && 'DeepSeek models for reasoning and coding tasks'}
            {aiConfig.provider === 'openai' && 'GPT and Codex models with API key'}
            {aiConfig.provider === 'google' && 'Gemini models for fast, structured responses'}
            {aiConfig.provider === 'openrouter' && 'Access all supported models from one provider'}
            {aiConfig.provider === 'vercel' && 'Unified access to AI models with smart routing'}
            {aiConfig.provider === 'custom' && 'Add a custom OpenAI-compatible provider by base URL.'}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Base URL</label>
          <input
            type="text"
            className="form-control"
            value={aiConfig.baseUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAiConfigChange('baseUrl', e.target.value)}
            placeholder={
              aiConfig.provider === 'custom' ? "https://your-custom-endpoint/v1" :
              aiConfig.provider === 'vercel' ? "https://gateway.ai.vercel.com/v1/..." : ""
            }
            disabled={!['custom', 'vercel'].includes(aiConfig.provider)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>API Key</label>
          <input
            type="password"
            className="form-control"
            value={aiConfig.apiKey || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAiConfigChange('apiKey', e.target.value)}
            placeholder="Enter your API key..."
          />
        </div>

        {aiConfig.provider === 'custom' && (
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Backend Proxy URL (Optional)</label>
            <input
              type="text"
              className="form-control"
              value={aiConfig.proxyUrl || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAiConfigChange('proxyUrl', e.target.value)}
              placeholder="https://your-proxy.onrender.com (Direct connection if empty)"
            />
          </div>
        )}

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Model</label>
            {['custom', 'openrouter', 'openai', 'deepseek'].includes(aiConfig.provider) && (
              <button 
                className="btn btn-ghost btn-sm"
                onClick={handleDetectModels}
                disabled={isDetecting || !aiConfig.baseUrl}
                style={{ color: 'var(--accent-primary)', padding: '2px 8px' }}
              >
                {isDetecting ? 'Detecting...' : 'Detect Models'}
              </button>
            )}
          </div>
          
          {['custom', 'openrouter', 'openai', 'deepseek'].includes(aiConfig.provider) && availableModels.length > 0 ? (
            <Dropdown
              isSearchable={true}
              value={aiConfig.model || ''}
              onChange={(val) => handleAiConfigChange('model', val as string)}
              options={availableModels.map(m => ({ value: m.id, label: m.name || m.id }))}
            />
          ) : (
            <input
              type="text"
              className="form-control"
              value={aiConfig.model || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAiConfigChange('model', e.target.value)}
              placeholder={aiConfig.provider === 'vercel' ? 'e.g. openai:gpt-4o' : (aiConfig.provider === 'openrouter' ? 'e.g. google/gemini-2.5-flash' : 'e.g. custom-model-name')}
            />
          )}
        </div>
      </div>
    </div>
  );
};