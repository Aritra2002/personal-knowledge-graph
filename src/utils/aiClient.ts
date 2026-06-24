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
  if (!config.apiKey) {
    throw new Error('API Key is missing. Please add it in Settings.');
  }
  // If provider is not custom, baseUrl might be empty but we can fallback. However, for custom, baseUrl is required.
  if (config.provider === 'custom' && !config.baseUrl) {
    throw new Error('Base URL is missing for Custom Provider.');
  }

  // Set default URLs if empty
  let endpoint = config.baseUrl;
  if (!endpoint) {
    switch (config.provider) {
      case 'anthropic': endpoint = 'https://api.anthropic.com/v1/messages'; break;
      case 'deepseek': endpoint = 'https://api.deepseek.com/v1/chat/completions'; break;
      case 'openai': endpoint = 'https://api.openai.com/v1/chat/completions'; break;
      case 'google': endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + config.model + ':streamGenerateContent'; break;
      case 'openrouter': endpoint = 'https://openrouter.ai/api/v1/chat/completions'; break;
      default: endpoint = 'https://api.openai.com/v1/chat/completions';
    }
  } else {
    // Append paths if they just provided the origin
    if (config.provider === 'anthropic' && !endpoint.includes('/v1/messages')) endpoint = endpoint.replace(/\/?$/, '') + '/v1/messages';
    else if (config.provider !== 'google' && !endpoint.includes('/chat/completions')) endpoint = endpoint.replace(/\/?$/, '') + '/v1/chat/completions';
  }

  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let bodyPayload: any = {};

  if (config.provider === 'anthropic') {
    headers['x-api-key'] = config.apiKey;
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
    headers['x-goog-api-key'] = config.apiKey;
    bodyPayload = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }]
    };
    // Google uses query param sometimes, but header is cleaner
  } else {
    // Default OpenAI format
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'AetherMind';
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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
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
        
        // Google stream format is a JSON array of objects, or chunked JSON.
        // It's not SSE by default for REST, but let's handle basic SSE for OpenAI/Anthropic
        if (config.provider === 'google') {
           // Google REST streaming sends chunks that look like:
           // "[\n{\n  \"candidates\": [ { \"content\": { \"parts\": [{ \"text\": \"hello\" }] } } ]\n},\n..."
           // It's quite complex to parse manually without a proper parser, but we'll extract text heuristically.
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
          // SSE Parsing
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
                // Ignore parse errors for incomplete chunks
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
