document.getElementById('clipBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      return {
        title: document.title,
        content: document.body.innerText,
        url: window.location.href
      };
    }
  }, async (results) => {
    if (results && results[0] && results[0].result) {
      const data = results[0].result;
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Clipping...';
      
      try {
        // AetherMind local dev server runs on port 5173
        // We need a local API endpoint or deep link to accept clips
        // Since we don't have a backend, we can use a custom protocol or deep link
        // For this MVP, we copy a markdown formatted string to clipboard so user can paste it.
        const clipMarkdown = `# [${data.title}](${data.url})\n\n${data.content.substring(0, 1000)}...`;
        await navigator.clipboard.writeText(clipMarkdown);
        statusEl.textContent = 'Clipped to clipboard! Paste in AetherMind.';
      } catch (err) {
        statusEl.textContent = 'Error: ' + err.message;
      }
    }
  });
});
