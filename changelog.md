# v1.15.1
- **UI Animation Overhaul**: Added fluid and bouncy CSS @keyframes (using spring-like cubic-beziers and blur filters) to all transition states globally.
- **Sidebar Transition Fix**: Corrected missing width transitions for the right-sidebar toggle event.

# v1.15.0
- **Architecture Refactoring**: Completely modularized the monolithic `SettingsModal.tsx` into clean, tabbed components (`AiSettingsTab.tsx`, `SyncSettingsTab.tsx`, `DataSettingsTab.tsx`, `PluginSettingsTab.tsx`) acting as an orchestrator. Added `React.lazy` to `GraphCanvas` to optimize the main bundle load times.
- **Security & Vulnerability Fixes**: Installed DOMPurify to mitigate Stored XSS inside `EditorPanel.tsx` Markdown preview rendering.
- **UX & Accessibility Enhancements**: Conducted a `ux-audit` and `accessibility-audit`, adding `aria-label`s to all icon-only buttons (`ColorPicker`, `ConfirmModal`, `PromptModal`, `RenamePageModal`, `ReviewModal`, `EditorPanel`) to improve screen-reader compatibility and usability.
- **SEO & Metadata**: Injected high-quality SEO meta tags, title tags, and Open Graph structured data into `index.html`.
- **Motion Performance Improvements**: Refactored `index.css` global transitions. Removed layout-thrashing `transition: all` patterns and constrained them to composite-only properties (`transform`, `opacity`) for smooth 60fps graph interactions.

# v1.14.0
- **Pre-Push Codebase Audit**: Performed a comprehensive cleanup of junk files, added `.env` tracking to `.gitignore`, and scrubbed sensitive or spammy debug logs from production utility files (`ocr.ts`, `syncManager.ts`).
- **Security & Dependencies**: Executed non-breaking updates via `npm audit fix` across both the client and `sync-server` codebases to patch nested prototype pollution vulnerabilities.
- **Documentation Setup**: Created a formal `README.md` to document the local-first architecture, ML setup, and sync server deployment instructions.

# v1.13.0
- **Polished Multi-Provider AI Integration**: Base URLs are now strictly enforced and locked to official endpoints for standard providers to prevent errors.
- **Dynamic AI Settings UI**: The 'Model Name' field is now intelligently hidden unless required (Custom or Vercel AI Gateway), making the settings menu much cleaner.
- **Consistent Dropdowns**: Styled the AI Provider dropdown to match the sleek global glassmorphic 'meta-select' design used throughout the app.
- **Vercel AI Gateway Support**: Unlocked the base URL and model name for Vercel AI Gateway to correctly support user-specific gateway endpoints.

# AetherMind Changelog

## v1.12.0
- Refactored native browser popups (alert, confirm, prompt) into advanced glassmorphic modals and toast notifications.
- Implemented Multi-Provider AI Integration (Anthropic, DeepSeek, OpenAI, Google, OpenRouter, Vercel AI Gateway) natively in the browser without requiring external proxies for compatibility.

## v1.11.0
- **Audio & Voice Capabilities**: Added cross-browser Voice-to-Text dictation using local WebAssembly models (Whisper), and Text-to-Speech (Read Aloud) functionality.
- **Plugin Ecosystem Foundation**: Exposed `window.AetherMindApi` with global hooks for UI navigation, settings, and note management. Initialized Plugin Manager.
- Fixed sidebar to consistently default to Preview Mode when opening a new node.

## v1.10.5
- Made sidebar placeholder text and empty state text unselectable (uncopyable) to improve UI feel.

## v1.10.4
- Redesigned sidebar buttons (icon buttons and tab buttons) with premium glassmorphism styling, shadows, and hover animations.

## v1.10.3
- Repositioned "Help" and "Sidebar" buttons to the top-right corner of the graph canvas.
- Fixed node color reactivity: Changes to node default colors in Settings now update immediately.
- Fixed node aura and link color logic to correctly reflect the selected node color instead of a default heatmap red.

## v1.10.0 - v1.10.2
- Core AI integration: Added "Ask AI" modal and "Auto-tagging" features (supporting OpenAI and Anthropic).
- UI/UX Refinements: Added premium dark mode styles and glassmorphism elements.

## v1.9.0
- Added Web Clipper Extension: Created Chrome extension to easily save web pages directly into AetherMind.
- Added File Uploads & OCR: Integrated image uploading with OCR text extraction.

## v1.8.0
- Added Timeline Slider & Journal Calendar: View notes chronologically and scrub through knowledge base history.
- Introduced Pages concept: Group multiple notes under specific pages (e.g., Default Graph vs other workspaces).

## v1.7.0
- Added Excalidraw Whiteboard integration: Create embedded visual whiteboards inside notes.
- Added Export to HTML functionality.

## v1.6.0
- Added Command Palette (Ctrl+K / Cmd+K) for quick navigation and commands.
- Added Global Search Bar with full-text search across all notes.

## v1.5.0
- Markdown Editor enhancements: Added Prism.js syntax highlighting.
- Added `[[Wiki Link]]` syntax to automatically create connections between nodes.

## v1.0.0 - v1.4.0
- Initial Release: Local-first personal knowledge graph using Dexie.js (IndexedDB).
- Implemented D3.js Force-Directed Graph simulation for organic note navigation.
- Basic note creation, editing, tagging, and category color customization.

