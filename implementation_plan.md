# AetherMind v1.22.0 — AI Intelligence Layer

The focus of this release is transforming the graph from a passive storage medium into an active intelligence partner that helps you discover connections and input knowledge frictionlessly.

## User Review Required
> [!IMPORTANT]
> **Voice Input approach**: I am proposing we use `@xenova/transformers` with the `Xenova/whisper-tiny.en` model running entirely locally in the browser (via Web Worker) for voice transcription. This ensures 100% privacy and offline capability, adhering to the "Privacy-first, AI-native" thesis. It will add a one-time download of the small Whisper model (~80MB) to the browser cache. Do you approve this fully-local approach over the browser's built-in `SpeechRecognition` (which sends audio to Google servers)?

## Proposed Changes

---

### Epic 1: AI Connection Discovery
After writing a note, the system should passively suggest potential links to past notes.

#### [NEW] [src/components/ConnectionDiscovery.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/ConnectionDiscovery.tsx)
- A non-intrusive floating toast/card that appears at the bottom of the editor.
- Uses `semanticSearch(note.content, 3)` to find the top 3 similar existing notes.
- Pings the local LLM: *"Do any of these existing notes conceptually connect to the new note? If so, which one and why?"*
- Shows a prompt to the user: "This note might connect to [Note B]. [Reason]. [Add Link button]"
- Automatically dismissed if ignored.

#### [MODIFY] [src/components/EditorPanel.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/EditorPanel.tsx)
- Mount `<ConnectionDiscovery>` when `editMode` is exited (saving) and content has significantly changed.

---

### Epic 2: "Why Connected?" Edge Explanations
Edges in the graph shouldn't just be dumb lines. They should have semantic meaning.

#### [MODIFY] [src/db/index.ts](file:///e:/Lab/web/personal-knowledge-graph/src/db/index.ts)
- Add `explanation?: string` to the `Link` interface.
- Bump Dexie version to `6` to add `explanation` to the schema.

#### [MODIFY] [src/components/GraphCanvas.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/GraphCanvas.tsx)
- Add hover events to the D3 `path.link` elements.
- On hover, if `link.explanation` is empty, show a loading spinner in a tooltip and call the AI in the background to summarize the relationship between the two connected nodes in one sentence.
- Save the result to `link.explanation` in IndexedDB.
- Display the explanation in a stylized floating tooltip over the edge.

---

### Epic 3: Daily Discovery Digest
Surface forgotten knowledge to combat graph decay.

#### [NEW] [src/components/DiscoveryDigestModal.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/DiscoveryDigestModal.tsx)
- A modal that pops up on first launch of the day (tracks `lastDigestDate` in `localStorage`).
- **Algorithm**:
  1. Pick a random "forgotten" note (> 1 month old).
  2. Pick a recent note (< 7 days old) that shares a tag or has a high semantic similarity.
  3. Ask the AI: "Find a surprising or insightful connection between these two ideas."
  4. Present the AI's insight in the modal to spark inspiration.

#### [MODIFY] [src/App.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/App.tsx)
- Mount the `DiscoveryDigestModal` and trigger it on mount if a day has elapsed.

---

### Epic 4: Voice Input → Node (Dual Engine)
Capture thoughts at the speed of speech. Users can choose between 100% local privacy or instant cloud recognition.

#### [NEW] [src/workers/whisper.worker.ts](file:///e:/Lab/web/personal-knowledge-graph/src/workers/whisper.worker.ts)
- A Web Worker that loads `Xenova/whisper-tiny.en` via `@xenova/transformers`.
- Processes raw audio buffers into text asynchronously without blocking the main UI thread.

#### [MODIFY] [src/components/SettingsModal.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/SettingsModal.tsx)
- Add a new "Voice Engine" toggle setting:
  - **Local (Whisper)**: Highest privacy, works offline. Requires a one-time 80MB download. (Default)
  - **Cloud (Native)**: Instant start, uses browser's built-in `SpeechRecognition` (sends audio to Apple/Google).

#### [NEW] [src/components/VoiceRecorder.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/VoiceRecorder.tsx)
- Checks the user's setting preference.
- If Local: Uses `MediaRecorder` API to capture chunks of audio and sends them to the Whisper worker.
- If Cloud: Uses `window.SpeechRecognition` (or `webkitSpeechRecognition`) for instant streaming transcription.
- Once transcribed, automatically creates a new Note in the graph using the transcription as content, and calls the AI to generate a concise Title and Tags.

#### [MODIFY] [src/components/MobileNav.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/MobileNav.tsx)
- Add a prominent Microphone icon to the center of the mobile navigation bar and desktop header for quick capture.

---

### Epic 5: Graph-Aware Spaced Repetition
Make studying follow natural associative trains of thought rather than pure randomness.

#### [MODIFY] [src/components/ReviewModal.tsx](file:///e:/Lab/web/personal-knowledge-graph/src/components/ReviewModal.tsx)
- Currently, notes are sorted simply by `nextReview` date.
- **New Ordering Algorithm**: 
  1. Get all notes due for review.
  2. Pick the most overdue note as the starting point.
  3. For the next note, check if any of the starting note's `linkedNoteIds` are also due. If yes, present those next.
  4. If no linked notes are due, fall back to the next most overdue note.
- This creates "clusters" of reviews, allowing the user to review a concept and its immediate neighbors in a single flow, reinforcing the graph structure in their brain.

## Verification Plan

### Automated Tests
- Run `npm run build` and `tsc -b` to ensure no TypeScript regressions.

### Manual Verification
- Deploy to local dev server and test:
  1. Creating a new note and waiting for Connection Discovery to trigger.
  2. Hovering over an existing edge in the graph to see if the tooltip and AI call work.
  3. Clearing `localStorage` and refreshing to trigger the Daily Digest.
  4. Clicking the mic button, speaking, and confirming a new node is created.
  5. Setting a few linked notes to be "due" and verifying they appear consecutively in the Review modal.
