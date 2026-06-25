# AetherMind

AetherMind is a Local-First Personal Knowledge Graph that uses CRDTs for seamless synchronization and local AI models for privacy-preserving features.

## Features

- **Local-First Architecture:** Built on top of `yjs` and `y-websocket` to ensure your data stays on your device and syncs effortlessly.
- **AI-Powered:** Integrates local AI models via `@xenova/transformers` for capabilities like Text-to-Speech, Voice Dictation, and smart organization.
- **Graph Visualization:** A rich, interactive node-based graph view of your knowledge base.
- **Responsive UI:** Fully responsive design that adapts beautifully from desktop monitors down to mobile screens.
- **Plugin Ecosystem:** Load external JavaScript plugins dynamically to extend functionality.
- **Markdown & Rich Text:** Full support for standard markdown, bidirectional linking (`[[Note Name]]`), code blocks, and lists.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Getting Started

### 1. Setup the Web Application

Navigate to the project root and install the dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

### 2. Setup the Sync Server (Optional but recommended for multi-device sync)

AetherMind comes with a dedicated `y-websocket` synchronization server located in the `sync-server` directory.

Navigate to the sync server directory:

```bash
cd sync-server
npm install
```

Start the sync server:

```bash
npm start
```
The sync server runs on port `1234` by default. 

### Configuration

You can configure AetherMind using environment variables. Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Adjust the values (like `VITE_SYNC_SERVER_URL` or `VITE_AI_GATEWAY_URL`) as needed.

## Building for Production

To create a production build of the web application:

```bash
npm run build
```

This will generate static files in the `dist` directory, which can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.
