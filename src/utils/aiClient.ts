export type AIProvider = 'anthropic' | 'deepseek' | 'openai' | 'google' | 'openrouter' | 'vercel' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const getAIConfig = (): AIConfig => {
  return {
    provider: (localStorage.getItem('aiProvider') as AIProvider) || 'openai',
    baseUrl: localStorage.getItem('aiBaseUrl') || '',
    apiKey: localStorage.getItem('aiApiKey') || '',
    model: localStorage.getItem('aiModel') || '',
  };
};

export const setAIConfig = (config: AIConfig) => {
  localStorage.setItem('aiProvider', config.provider);
  localStorage.setItem('aiBaseUrl', config.baseUrl);
  localStorage.setItem('aiApiKey', config.apiKey);
  localStorage.setItem('aiModel', config.model);
};

export const callAI = async (
  systemPrompt: string,
  userPrompt: string,
  onStream?: (chunk: string) => void
): Promise<string> => {
  const config = getAIConfig();
  if (!config.apiKey && config.provider !== 'custom') {
    throw new Error('API Key is missing. Please add it in Settings.');
  }
  // If provider is not custom, baseUrl might be empty but we can fallback. However, for custom, baseUrl is required.
  if (config.provider === 'custom' && !config.baseUrl) {
    throw new Error('Base URL is missing for Custom Provider.');
  }

  let isCustom = config.provider === 'custom';
  
  // Normalize the URL in case the user missed the // (e.g., http:localhost:1234)
  let endpoint = config.baseUrl;
  if (endpoint && endpoint.startsWith('http:') && !endpoint.startsWith('http://')) {
    endpoint = endpoint.replace('http:', 'http://');
  } else if (endpoint && endpoint.startsWith('https:') && !endpoint.startsWith('https://')) {
    endpoint = endpoint.replace('https:', 'https://');
  }

  if (!endpoint && !isCustom) {
    switch (config.provider) {
      case 'anthropic': endpoint = 'https://api.anthropic.com/v1/messages'; break;
      case 'deepseek': endpoint = 'https://api.deepseek.com/v1/chat/completions'; break;
      case 'openai': endpoint = 'https://api.openai.com/v1/chat/completions'; break;
      case 'google': endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + config.model + ':streamGenerateContent'; break;
      case 'openrouter': endpoint = 'https://openrouter.ai/api/v1/chat/completions'; break;
      case 'vercel': endpoint = 'https://gateway.ai.vercel.com/v1/chat/completions'; break;
      default: endpoint = 'https://api.openai.com/v1/chat/completions';
    }
  } else if (endpoint) {
    // Append paths if they just provided the origin
    if (config.provider === 'anthropic' && !endpoint.includes('/v1/messages')) endpoint = endpoint.replace(/\/?$/, '') + '/v1/messages';
    else if (config.provider === 'google' && !endpoint.includes(':streamGenerateContent') && !endpoint.includes('/chat/completions')) {
      endpoint = endpoint.replace(/\/?$/, '') + '/models/' + (config.model || 'gemini-2.5-flash') + ':streamGenerateContent';
    }
    else if (config.provider !== 'google' && !endpoint.includes('/chat/completions')) {
      if (endpoint.match(/\/v1\/?$/)) {
        endpoint = endpoint.replace(/\/?$/, '') + '/chat/completions';
      } else {
        endpoint = endpoint.replace(/\/?$/, '') + '/v1/chat/completions';
      }
    }
  }

  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let bodyPayload: any = {};

  if (config.provider === 'anthropic') {
    if (config.apiKey) headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerously-allow-browser'] = 'true';
    bodyPayload = {
      model: config.model || 'claude-3-5-sonnet-20240620',
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream: !!onStream,
      max_tokens: 1024
    };
  } else if (config.provider === 'google') {
    if (config.apiKey) headers['x-goog-api-key'] = config.apiKey;
    bodyPayload = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }]
    };
  } else {
    // Default OpenAI format
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'AetherMind';
    }
    
    if (isCustom) {
      headers['HTTP-Referer'] = 'https://github.com/RooVetGit/Roo-Code'; 
      headers['X-Title'] = 'Roo Code';
      headers['User-Agent'] = 'Roo-Code';
      headers['Originator'] = 'codex_cli_rs'; // Required by AgentRouter
    }
    bodyPayload = {
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: !!onStream,
    };
  }

  try {
    let fetchUrl = endpoint;
    let fetchHeaders = headers;
    let fetchBody = JSON.stringify(bodyPayload);

    if (isCustom) {
      // Use the proxy for custom to bypass CORS. Changed port to 4234 to avoid LM Studio collision on 1234.
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
      
      if (host.includes('github.io')) {
        throw new Error("The built-in AI Proxy backend cannot run on GitHub Pages static hosting. Please run the app locally using 'npm run dev' to use custom cloud proxy features, or deploy the sync-server to a Node.js host.");
      }

      fetchUrl = `${protocol}//${host}:4234/api/ai/proxy`;
      fetchHeaders = { 'Content-Type': 'application/json' };
      fetchBody = JSON.stringify({
        url: endpoint,
        headers,
        body: bodyPayload
      });
    }

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: fetchHeaders,
      body: fetchBody
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed (401 Unauthorized). Please ensure you have provided a valid API Key in the settings.");
      }
      const errorText = await response.text();
      throw new Error(`AI API Error (${response.status}): ${errorText}`);
    }

    if (onStream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      if (!reader) throw new Error('Response body is not readable');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        if (config.provider === 'google') {
           const textMatches = chunk.match(/"text":\s*"([^"]*)"/g);
           if (textMatches) {
             for (const match of textMatches) {
               try {
                 const text = JSON.parse('{' + match + '}').text;
                 fullContent += text;
                 onStream(fullContent);
               } catch (e) {}
             }
           }
        } else {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                
                if (config.provider === 'anthropic') {
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    fullContent += parsed.delta.text;
                    onStream(fullContent);
                  }
                } else {
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    fullContent += delta;
                    onStream(fullContent);
                  }
                }
              } catch (e) {
              }
            }
          }
        }
      }
      return fullContent;
    } else {
      const data = await response.json();
      if (config.provider === 'anthropic') return data.content?.[0]?.text || '';
      if (config.provider === 'google') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error: any) {
    console.error('AI call failed:', error);
    throw error;
  }
};

export async function detectModels(baseUrl: string, apiKey?: string): Promise<{ id: string; name?: string }[]> {
  try {
    let base = baseUrl.replace(/\/+$/, "");
    if (base && base.startsWith('http:') && !base.startsWith('http://')) base = base.replace('http:', 'http://');
    else if (base && base.startsWith('https:') && !base.startsWith('https://')) base = base.replace('https:', 'https://');
    
    // Strip common suffixes so we can append /models correctly
    base = base.replace(/\/chat\/completions$/, '');
    base = base.replace(/\/v1$/, '');

    const modelsUrl = `${base}/v1/models`;
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    
    // Spoof headers for custom provider (e.g. AgentRouter)
    headers['HTTP-Referer'] = 'https://github.com/RooVetGit/Roo-Code'; 
    headers['X-Title'] = 'Roo Code';
    headers['User-Agent'] = 'Roo-Code';
    headers['Originator'] = 'codex_cli_rs'; // Required by AgentRouter

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    if (host.includes('github.io')) {
      throw new Error("The built-in AI Proxy backend cannot run on GitHub Pages static hosting. Please run the app locally using 'npm run dev' to use custom cloud proxy features, or deploy the sync-server to a Node.js host.");
    }

    const response = await fetch(`${protocol}//${host}:4234/api/ai/proxy/get`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: modelsUrl, headers })
    });

    if (response.status === 404) {
      // Many proxy providers don't implement /v1/models
      return [];
    }
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed (401 Unauthorized). Please ensure you have provided a valid API Key in the settings.");
      }
      const err = await response.json().catch(() => null);
      throw new Error(`AI API Error (${response.status}): ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

