import { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api/client';

const storageKey = 'folio.conversation';
function remember(id) { try { localStorage.setItem(storageKey, id); } catch { /* Browser storage is optional. */ } }
function remembered() { try { return localStorage.getItem(storageKey); } catch { return null; } }
function toMessages(turns) {
  return turns.flatMap(turn => [
    { role: 'user', text: turn.question, request_id: turn.request_id },
    { role: 'assistant', request_id: turn.request_id, answer_type: turn.answer_type, sources: turn.sources || [], token_usage: turn.token_usage || [], routing: turn.routing,
      text: turn.status === 'completed' ? turn.answer : turn.status === 'failed'
        ? `This question failed: ${turn.detail || 'The agent could not answer.'}`
        : 'No saved answer yet. Reload this conversation to check whether the question has finished.' },
  ]);
}

export function useConversations() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);

  async function load(id, before = null) {
    const version = ++generation.current;
    setLoading(true); setError('');
    try {
      const data = await api(`/conversation?conversation_id=${encodeURIComponent(id)}${before ? `&before=${encodeURIComponent(before)}` : ''}`);
      if (version !== generation.current) return;
      const restored = toMessages(data.turns);
      setMessages(previous => before ? [...restored, ...previous] : restored);
      setConversationId(id); remember(id); setCursor(data.next_cursor);
    } catch (err) { if (version === generation.current) setError(err.message); }
    finally { if (version === generation.current) setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api('/conversations').then(async data => {
      if (!active) return;
      setConversations(data.conversations);
      const id = remembered() || data.conversations[0]?.conversation_id;
      if (id) await load(id);
      else { const fresh = crypto.randomUUID(); setConversationId(fresh); remember(fresh); setLoading(false); }
    }).catch(err => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; generation.current += 1; };
  }, [revision]);

  function newConversation() {
    generation.current += 1;
    const id = crypto.randomUUID(); remember(id); setConversationId(id);
    setMessages([]); setCursor(null); setError(''); setLoading(false);
  }
  async function saved() {
    try { const data = await api('/conversations'); setConversations(data.conversations); }
    catch (err) { setError(err.message); }
  }
  return { messages, setMessages, conversationId, conversations, loading, error,
    load, newConversation, saved, older: cursor ? () => load(conversationId, cursor) : null,
    retry: () => setRevision(value => value + 1) };
}
