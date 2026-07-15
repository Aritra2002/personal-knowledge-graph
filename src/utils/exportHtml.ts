import { db } from '../db';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const exportToHtml = async (pageId: number, pageTitle: string = 'Graph') => {
  const notes = await db.notes.where('pageId').equals(pageId).toArray();
  const categories = await db.categories.toArray();
  
  const safeTitle = pageTitle.replace(/[^a-z0-9-]/gi, ' ').trim();
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AetherMind Export - ${safeTitle}</title>
<style>
  :root {
    --bg-color: #0f172a;
    --surface-color: #1e293b;
    --surface-hover: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent: #818cf8;
    --border-color: #334155;
  }
  * { box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
    margin: 0; 
    background: var(--bg-color); 
    color: var(--text-primary); 
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  /* Sidebar */
  .sidebar {
    width: 300px;
    background: var(--surface-color);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }
  .sidebar-header h1 {
    margin: 0 0 10px 0;
    font-size: 1.25rem;
    color: var(--accent);
  }
  .sidebar-header p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .search-container {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
  }
  .search-input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus {
    border-color: var(--accent);
  }
  .toc {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;
  }
  .toc-item {
    display: block;
    padding: 8px 20px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: background 0.2s, color 0.2s;
    cursor: pointer;
  }
  .toc-item:hover, .toc-item.active {
    background: rgba(129, 140, 248, 0.1);
    color: var(--accent);
  }
  /* Main Content */
  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 40px;
    scroll-behavior: smooth;
  }
  .notes-container {
    max-width: 800px;
    margin: 0 auto;
  }
  .note { 
    background: var(--surface-color); 
    padding: 30px; 
    border-radius: 12px; 
    margin-bottom: 30px; 
    border-left: 4px solid var(--accent);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s;
  }
  .note:target {
    animation: highlight 2s ease-out;
  }
  @keyframes highlight {
    0% { box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.4); }
    100% { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  }
  .note-title { 
    margin: 0 0 15px 0; 
    color: var(--accent);
    font-size: 1.5rem;
  }
  .note-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .tag {
    background: rgba(0,0,0,0.3);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .note-content {
    line-height: 1.6;
    font-size: 1rem;
    color: #cbd5e1;
  }
  .note-content h1, .note-content h2, .note-content h3 { color: var(--text-primary); margin-top: 1.5em; }
  .note-content a { color: #34d399; text-decoration: none; }
  .note-content a:hover { text-decoration: underline; }
  .note-content pre { 
    background: rgba(0,0,0,0.3); 
    padding: 15px; 
    border-radius: 8px; 
    overflow-x: auto; 
    border: 1px solid var(--border-color);
  }
  .note-content code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: rgba(0,0,0,0.3);
    padding: 2px 4px;
    border-radius: 4px;
  }
  .note-content pre code { background: none; padding: 0; }
  .note-content blockquote {
    border-left: 4px solid var(--border-color);
    margin: 0;
    padding-left: 15px;
    color: var(--text-secondary);
  }
  .note-content img { max-width: 100%; border-radius: 8px; }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    body { flex-direction: column; overflow: auto; }
    .sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
    .toc { max-height: 200px; }
    .main-content { padding: 20px; overflow-y: visible; }
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>${safeTitle}</h1>
      <p>Exported on ${new Date().toLocaleString()}</p>
    </div>
    <div class="search-container">
      <input type="text" id="searchInput" class="search-input" placeholder="Search notes...">
    </div>
    <div class="toc" id="toc">`;

  // Pre-generate TOC
  for (const note of notes) {
    html += `<a href="#note-${note.id}" class="toc-item" data-title="${note.title.toLowerCase()}">${note.title}</a>`;
  }

  html += `
    </div>
  </div>
  <div class="main-content" id="mainContent">
    <div class="notes-container">
`;

  for (const note of notes) {
    const categoryObj = categories.find(c => c.id === note.category);
    const color = categoryObj ? categoryObj.color : '#818cf8';
    
    // Replace [[Links]] with simple anchor tags to the IDs
    let content = note.content || '';
    content = content.replace(/\[\[(.*?)\]\]/g, (_, title) => {
      const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase().trim());
      if (targetNote) {
        return `<a href="#note-${targetNote.id}">${title}</a>`;
      }
      return title;
    });

    html += `
      <div class="note" id="note-${note.id}" style="border-left-color: ${color};" data-title="${note.title.toLowerCase()}">
        <h2 class="note-title" style="color: ${color};">${note.title}</h2>
        <div class="note-meta">
          <span class="tag" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">${categoryObj?.label || 'General'}</span>
          ${note.tags && note.tags.length > 0 ? note.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : ''}
        </div>
        <div class="note-content">${DOMPurify.sanitize(marked.parse(content) as string)}</div>
      </div>
`;
  }

  html += `
    </div>
  </div>
  <script>
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const tocItems = document.querySelectorAll('.toc-item');
    const notes = document.querySelectorAll('.note');
    const mainContent = document.getElementById('mainContent');

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      
      tocItems.forEach(item => {
        const title = item.getAttribute('data-title');
        if (title.includes(query)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
      
      notes.forEach(note => {
        const title = note.getAttribute('data-title');
        if (title.includes(query)) {
          note.style.display = 'block';
        } else {
          note.style.display = 'none';
        }
      });
    });

    // Active TOC highlighting
    const observerOptions = {
      root: mainContent,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + id) {
              item.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);

    notes.forEach(note => observer.observe(note));
  </script>
</body>
</html>`;

  // Download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileNameTitle = pageTitle.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  a.download = `AetherMind_Export_${fileNameTitle}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
