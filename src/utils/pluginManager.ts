import React from 'react';

export interface Plugin {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface NodeRenderer {
  type: string;
  renderFn: (node: unknown) => React.ReactNode;
}

export interface SidebarTab {
  name: string;
  component: React.ComponentType<{ note: unknown }>;
}

export interface AetherMindApi {
  addPlugin: (url: string) => void;
  removePlugin: (id: string) => void;
  getPlugins: () => Plugin[];
  registerNodeRenderer: (type: string, renderFn: (node: unknown) => React.ReactNode) => void;
  registerSidebarTab: (name: string, component: React.ComponentType<{ note: unknown }>) => void;
  getNodeRenderers: () => Map<string, (node: unknown) => React.ReactNode>;
  getSidebarTabs: () => Map<string, React.ComponentType<{ note: unknown }>>;
  openSettings: () => void;
  openCommandPalette: () => void;
  createNote: (x?: number, y?: number) => void;
  selectNote: (id: number | null) => void;
  jumpToNote: (title: string) => void;
}

declare global {
  interface Window {
    AetherMindApi: AetherMindApi;
  }
}

const PLUGINS_STORAGE_KEY = 'aethermind-plugins';

const nodeRenderers = new Map<string, (node: unknown) => React.ReactNode>();
const sidebarTabs = new Map<string, React.ComponentType<{ note: unknown }>>();

export const getSavedPlugins = (): Plugin[] => {
  try {
    const data = localStorage.getItem(PLUGINS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.debug(e);
    return [];
  }
};

export const savePlugins = (plugins: Plugin[]) => {
  localStorage.setItem(PLUGINS_STORAGE_KEY, JSON.stringify(plugins));
};

export const loadPluginScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.body.appendChild(script);
  });
};

export const initPluginManager = () => {
  if (!window.AetherMindApi) {
    window.AetherMindApi = {
      addPlugin: () => {},
      removePlugin: () => {},
      getPlugins: getSavedPlugins,
      registerNodeRenderer: (type: string, renderFn: (node: unknown) => React.ReactNode) => {
        nodeRenderers.set(type, renderFn);
      },
      registerSidebarTab: (name: string, component: React.ComponentType<{ note: unknown }>) => {
        sidebarTabs.set(name, component);
      },
      getNodeRenderers: () => nodeRenderers,
      getSidebarTabs: () => sidebarTabs,
      openSettings: () => {},
      openCommandPalette: () => {},
      createNote: () => {},
      selectNote: () => {},
      jumpToNote: () => {},
    };
  }

  const plugins = getSavedPlugins();
  plugins.forEach(plugin => {
    if (plugin.enabled) {
      loadPluginScript(plugin.url).catch(console.error);
    }
  });
};
