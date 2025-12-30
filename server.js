const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple health check
app.get('/api/health', (req, res) => res.json({status: 'ok'}));

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY in server environment' });
  }
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Build messages with optional history for context
  const messages = [
    { role: 'system', content: 'You are a helpful AI assistant embedded in a website. Keep answers friendly and concise.' },
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';

    return res.json({ reply, raw: data });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Failed to contact AI provider', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
