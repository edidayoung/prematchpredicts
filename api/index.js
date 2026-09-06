// Vercel serverless function for TanStack Start
export default async function handler(req, res) {
  try {
    // Dynamically import the server handler
    const serverModule = await import('../dist/server/server.js');
    const server = serverModule.default || serverModule;

    // Create Web Request from Node.js request
    const url = new URL(req.url || '/', `https://${req.headers.host}`);
    const request = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers),
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    // Call the server fetch handler
    const response = await server.fetch(request, {}, {});
    
    // Set response status
    res.status(response.status);
    
    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send body
    if (response.body) {
      const body = await response.text();
      res.send(body);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
}

