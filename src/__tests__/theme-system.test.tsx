// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SettingsModal } from '../components/settings/SettingsModal';
import { ToastProvider } from '../components/ToastContext';

const customGlobal = globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean };
customGlobal.IS_REACT_ACT_ENVIRONMENT = true;

describe('Multi-Theme System Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('renders AppearanceSettingsTab with preset options', () => {
    const mockProps = {
      onClose: vi.fn(),
      onRefreshData: vi.fn(),
      physicsConfig: { linkDistance: 50, chargeStrength: -50 },
      onPhysicsChange: vi.fn(),
      categories: [],
      nlpClustering: false,
      onNlpClusteringChange: vi.fn(),
      activePageId: 1,
      pageTitle: 'Test Page',
      activeTheme: 'dark',
      onThemeSelect: vi.fn(),
      customThemeColors: {},
      onCustomThemeColorChange: vi.fn(),
      onCustomThemeReset: vi.fn(),
    };

    const root = createRoot(container);
    act(() => {
      root.render(
        React.createElement(
          ToastProvider,
          null,
          React.createElement(SettingsModal, mockProps)
        )
      );
    });

    // Find and click the Appearance tab button in settings modal sidebar
    const appearanceTabBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Appearance')
    );
    expect(appearanceTabBtn).toBeTruthy();

    act(() => {
      appearanceTabBtn!.click();
    });

    // Verify it displays Appearance & Theme header
    expect(container.textContent).toContain('Appearance & Theme');
    
    // Verify preset options (Dark Space, Light Clean, Sepia Warm, Midnight, Ocean Tide, Custom) are rendered
    expect(container.textContent).toContain('Dark Space');
    expect(container.textContent).toContain('Light Clean');
    expect(container.textContent).toContain('Sepia Warm');
    expect(container.textContent).toContain('Midnight');
    expect(container.textContent).toContain('Ocean Tide');
    expect(container.textContent).toContain('Custom');

    act(() => {
      root.unmount();
    });
  });

  it('triggers onThemeSelect when preset theme is clicked', () => {
    const onThemeSelectSpy = vi.fn();
    const mockProps = {
      onClose: vi.fn(),
      onRefreshData: vi.fn(),
      physicsConfig: { linkDistance: 50, chargeStrength: -50 },
      onPhysicsChange: vi.fn(),
      categories: [],
      nlpClustering: false,
      onNlpClusteringChange: vi.fn(),
      activePageId: 1,
      pageTitle: 'Test Page',
      activeTheme: 'dark',
      onThemeSelect: onThemeSelectSpy,
      customThemeColors: {},
      onCustomThemeColorChange: vi.fn(),
      onCustomThemeReset: vi.fn(),
    };

    const root = createRoot(container);
    act(() => {
      root.render(
        React.createElement(
          ToastProvider,
          null,
          React.createElement(SettingsModal, mockProps)
        )
      );
    });

    // Go to Appearance tab
    const appearanceTabBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Appearance')
    );
    act(() => {
      appearanceTabBtn!.click();
    });

    // Click "Light Clean" theme button
    const lightThemeBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Light Clean')
    );
    expect(lightThemeBtn).toBeTruthy();

    act(() => {
      lightThemeBtn!.click();
    });

    expect(onThemeSelectSpy).toHaveBeenCalledWith('light');

    act(() => {
      root.unmount();
    });
  });

  it('displays Custom Theme Builder when Custom is selected', () => {
    const mockProps = {
      onClose: vi.fn(),
      onRefreshData: vi.fn(),
      physicsConfig: { linkDistance: 50, chargeStrength: -50 },
      onPhysicsChange: vi.fn(),
      categories: [],
      nlpClustering: false,
      onNlpClusteringChange: vi.fn(),
      activePageId: 1,
      pageTitle: 'Test Page',
      activeTheme: 'custom',
      onThemeSelect: vi.fn(),
      customThemeColors: {
        bgPrimary: '#1a1a2e',
        textPrimary: '#eaeaea',
        accentPrimary: '#ff007f'
      },
      onCustomThemeColorChange: vi.fn(),
      onCustomThemeReset: vi.fn(),
    };

    const root = createRoot(container);
    act(() => {
      root.render(
        React.createElement(
          ToastProvider,
          null,
          React.createElement(SettingsModal, mockProps)
        )
      );
    });

    // Go to Appearance tab
    const appearanceTabBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Appearance')
    );
    act(() => {
      appearanceTabBtn!.click();
    });

    // Verify custom builder container and individual pickers are rendered
    expect(container.textContent).toContain('Custom Theme Builder');
    expect(container.textContent).toContain('Background Color');
    expect(container.textContent).toContain('Text Color');
    expect(container.textContent).toContain('Accent Color');

    act(() => {
      root.unmount();
    });
  });
});
