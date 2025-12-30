/**
 * server.js
 *
 * Replace your existing server.js with this file to use the Hugging Face
 * Inference API instead of OpenAI. It keeps the same /api/chat endpoint
 * (so your frontend doesn't need changes).
 *
 * Install deps:
 *   npm install express node-fetch cors dotenv
 *
 * Usage:
 *  - Create a .env with HF_TOKEN (see .env.example below)
 *  - Optionally set HF_MODEL (default: google/flan-t5-large)
 *  - npm start
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || 'google/flan-t5-large'; // change if you want another model

if (!HF_TOKEN) {
  console.warn('Warning: HF_TOKEN is not set. /api/chat will return 500 until you set HF_TOKEN in .env');
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', provider: 'huggingface', model: HF_MODEL }));

/**
 * Helper: build a single prompt string from system message + history + user message.
 * We limit history to the last N entries to avoid very long prompts.
 */
function buildPrompt({ system = 'You are a helpful assistant. Keep answers friendly and concise.', history = [], message = '' }) {
  const MAX_HISTORY_ENTRIES = 10; // keep last 10 messages to limit prompt size
  const recent = Array.isArray(history) ? history.slice(-MAX_HISTORY_ENTRIES) : [];

  const parts = [system];
  for (const h of recent) {
    const role = (h.role || '').toLowerCase();
    const content = (h.content || '').trim();
    if (!content) continue;
    if (role === 'user') parts.push(`User: ${content}`);
    else if (role === 'assistant') parts.push(`Assistant: ${content}`);
    else parts.push(`${role}: ${content}`);
  }
  parts.push(`User: ${message.trim()}`);
  parts.push('Assistant:'); // model should continue from here

  return parts.join('\n');
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'Server misconfigured: missing HF_TOKEN' });
    }

    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const prompt = buildPrompt({
      system: 'You are a helpful AI assistant embedded in a website. Be concise and friendly.',
      history,
      message
    });

    // Call Hugging Face Inference API
    const apiUrl = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

    const payload = {
      inputs: prompt,
      parameters: {
        max_new_tokens: Number(process.env.MAX_NEW_TOKENS || 200),
        temperature: Number(process.env.TEMPERATURE || 0.7),
        // you can add other parameters here (top_k, top_p, repetition_penalty, etc.)
      }
    };

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      // HF inference can sometimes be slow; you can increase timeout on your server if needed
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: 'Hugging Face API error', details: text });
    }

    const data = await resp.json();

    // Extract generated text from HF response (varies by model / pipeline)
    let reply = '';
    if (Array.isArray(data) && data.length > 0) {
      // many text-generation models return [{ generated_text: "..." }]
      if (data[0].generated_text) reply = data[0].generated_text;
      else if (typeof data[0] === 'string') reply = data[0];
      else reply = JSON.stringify(data[0]);
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else if (data.error) {
      return res.status(500).json({ error: 'Hugging Face response error', details: data.error });
    } else {
      // fallback: stringify whatever HF returned
      reply = JSON.stringify(data);
    }

    // Some HF models echo the prompt + completion. If reply contains the prompt, try to remove it.
    if (reply.startsWith(prompt)) {
      reply = reply.slice(prompt.length).trim();
    }

    // Final trim and safety
    reply = reply.trim();

    return res.json({ reply, raw: data });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (Hugging Face model: ${HF_MODEL})`);
});
