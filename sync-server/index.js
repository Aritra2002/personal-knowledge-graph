const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

const port = process.env.PORT || 4234;
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Sync server is running');
});

// Proxy route for POST requests (Chat completions)
app.post('/api/ai/proxy', async (req, res) => {
  try {
    const { url, headers, body } = req.body;
    
    // Node.js fetch can sometimes resolve localhost to IPv6 ::1, which fails if local server is IPv4 only.
    // Replace localhost with 127.0.0.1 to guarantee IPv4 connection.
    const targetUrl = url ? url.replace('localhost', '127.0.0.1') : url;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers || {},
      body: JSON.stringify(body)
    });

    const unsafeHeaders = ['content-encoding', 'content-length', 'transfer-encoding', 'connection'];
    response.headers.forEach((value, name) => {
      if (!unsafeHeaders.includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });
    res.status(response.status);
    
    if (response.body) {
      const { Readable } = require('stream');
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.send(await response.text());
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy route for GET requests (Model detection)
app.post('/api/ai/proxy/get', async (req, res) => {
  try {
    const { url, headers } = req.body;
    
    // Node.js fetch can sometimes resolve localhost to IPv6 ::1, which fails if local server is IPv4 only.
    const targetUrl = url ? url.replace('localhost', '127.0.0.1') : url;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers || {}
    });

    const unsafeHeaders = ['content-encoding', 'content-length', 'transfer-encoding', 'connection'];
    response.headers.forEach((value, name) => {
      if (!unsafeHeaders.includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });
    res.status(response.status);
    
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true });
});

server.listen(port, () => {
  console.log(`y-websocket sync & proxy server running on port ${port}`);
});
