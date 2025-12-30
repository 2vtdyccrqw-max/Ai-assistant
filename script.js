const form = document.getElementById('form');
const input = document.getElementById('input');
const messagesEl = document.getElementById('messages');

// Simple in-memory history we send to server to keep context
const history = [];

function appendMessage(text, role='assistant') {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  appendMessage(text, 'user');

  // add to local history
  history.push({ role: 'user', content: text });

  input.value = '';
  appendMessage('Thinking...', 'assistant');
  const loadingNode = messagesEl.lastElementChild;

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history })
    });
    const data = await resp.json();
    // remove "Thinking..." placeholder and replace with reply
    if (loadingNode) messagesEl.removeChild(loadingNode);
    if (data.error) {
      appendMessage('Error: ' + data.error, 'assistant');
      return;
    }
    const reply = data.reply || '[no response]';
    appendMessage(reply, 'assistant');

    // add assistant reply to history so subsequent queries have context
    history.push({ role: 'assistant', content: reply });
  } catch (err) {
    if (loadingNode) messagesEl.removeChild(loadingNode);
    appendMessage('Network error: ' + err.message, 'assistant');
  }
});
