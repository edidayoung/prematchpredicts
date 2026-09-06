// Vercel serverless function for TanStack Start
import handler from '../dist/server/server.js';

export default async function(req, res) {
  const request = new Request(new URL(req.url, `https://${req.headers.host}`), {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
  });

  try {
    const response = await handler.fetch(request, {}, {});
    
    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Set status
    res.status(response.status);
    
    // Send body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal Server Error');
  }
}
