import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api/client';
import { FileAttachment } from '../library/FileAttachment';
import { Icon } from '../../shared/ui/Icon';

const suggestions = [
  { icon: 'file', title: 'Summarize', detail: 'Get the essential points', question: 'Summarize my documents' },
  { icon: 'compare', title: 'Compare', detail: 'See where documents differ', question: 'Compare the policies across my documents' },
  { icon: 'chat', title: 'Understand', detail: 'Unpack a policy or idea', question: 'What are the key policies in my documents?' },
  { icon: 'calendar', title: 'Extract', detail: 'Find dates and key numbers', question: 'What are the important dates, deadlines, and time periods in my documents?' },
];
function InlineText({ text, onCitation }) {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}><InlineText text={part.slice(2, -2)} onCitation={onCitation} /></strong>;
    if (/^\[\d+\]$/.test(part)) return <button type="button" className="citation-link" key={index} onClick={() => onCitation(Number(part.slice(1, -1)))} aria-label={`Read source ${part.slice(1, -1)}`}>{part.slice(1, -1)}</button>;
    return part;
  });
}
function AnswerText({ text, onCitation }) {
  const blocks = [];
  let list = [], paragraphs = [];
  function flushParagraphs() { if (paragraphs.length) { blocks.push(<p key={blocks.length}><InlineText text={paragraphs.join('\n')} onCitation={onCitation} /></p>); paragraphs = []; } }
  function flushList() { if (list.length) { blocks.push(<ul key={blocks.length}>{list.map((line, index) => <li key={index}><InlineText text={line} onCitation={onCitation} /></li>)}</ul>); list = []; } }
  for (const line of text.split('\n')) {
    const item = line.match(/^\s*(?:[-*+•]|\d+[.)])\s+(.+)$/);
    if (item) { flushParagraphs(); list.push(item[1]); }
    else if (!line.trim()) { flushParagraphs(); flushList(); }
    else { flushList(); paragraphs.push(line.replace(/^#{1,4}\s+/, '')); }
  }
  flushParagraphs(); flushList();
  return <div className="answer-text">{blocks}</div>;
}

export function ChatPanel({ busy, onBusy, messages, setMessages, onIndexed, onInspect, onAnswerSources, documentCount, onOpenLibrary, proposedQuestion, conversationId, onSaved }) {
  const [question, setQuestion] = useState('');
  const [modelMode, setModelMode] = useState('auto');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const conversation = useRef(null), latest = useRef(null), input = useRef(null);
  useEffect(() => {
    const container = conversation.current;
    if (container && latest.current) container.scrollTo({ top: latest.current.offsetTop - 24, behavior: 'smooth' });
  }, [messages, thinking]);
  useEffect(() => { if (!messages.length) { setError(''); setQuestion(''); } }, [messages.length]);
  useEffect(() => {
    if (!messages.length && conversation.current) conversation.current.scrollTop = 0;
  }, [messages.length]);
  useEffect(() => {
    if (!proposedQuestion) return;
    setQuestion(proposedQuestion.text);
    const frame = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [proposedQuestion]);
  useEffect(() => {
    function propose(event) { setQuestion(event.detail); input.current?.focus(); }
    window.addEventListener('folio:question', propose);
    return () => window.removeEventListener('folio:question', propose);
  }, []);
  function choose(text) { setQuestion(text); input.current?.focus(); }
  async function ask(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;
    setError(''); setThinking(true); onBusy(true);
    const answerIndex = messages.length + 1;
    const requestId = crypto.randomUUID();
    setMessages(previous => [...previous, { role: 'user', text, request_id: requestId }]); setQuestion('');
    try {
      const result = await api('/chat', { question: text, conversation_id: conversationId, request_id: requestId, model_mode: modelMode });
      setMessages(previous => [...previous, { role: 'assistant', text: result.answer, answer_type: result.answer_type, sources: result.sources || [], token_usage: result.token_usage || [], routing: result.routing }]);
      onAnswerSources(result.sources || [], answerIndex);
    } catch (err) { setError(err.message); setQuestion(text); }
    finally { onSaved(); setThinking(false); onBusy(false); requestAnimationFrame(() => input.current?.focus()); }
  }
  const composer = <div className="composer-area">
    {error && <div className="chat-error" role="alert"><strong>We couldn’t complete that question.</strong><span>{error}</span><button className="icon-button" type="button" aria-label="Dismiss error" onClick={() => setError('')}><Icon name="close" /></button></div>}
    <form className="composer" onSubmit={ask}>
      <label className="sr-only" htmlFor="question">Ask a question about your documents</label>
      <textarea ref={input} id="question" value={question} maxLength={4000} rows={3} placeholder="Ask anything about your documents…" disabled={busy} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} />
      <div className="composer-bottom"><FileAttachment compact busy={busy} onBusy={onBusy} onIndexed={onIndexed} /><button type="button" className="composer-scope" onClick={onOpenLibrary}><Icon name="folder" /> All documents{documentCount !== null && <span>{documentCount}</span>}</button><label className="model-mode"><span className="sr-only">Answer mode</span><select aria-label="Answer mode" value={modelMode} disabled={busy} onChange={event => setModelMode(event.target.value)}><option value="auto">Auto</option><option value="fast">Fast</option><option value="thorough">Thorough</option></select></label><span className="enter-hint">Enter to ask</span><button className="send-button" aria-label="Send question" disabled={busy || !question.trim()}><Icon name="arrowUp" /></button></div>
    </form>
    <p className="composer-note"><Icon name="lock" /> Answers use your indexed documents. Review citations for context.</p>
  </div>;
  return <section className={`chat-panel${messages.length ? ' has-messages' : ' is-empty'}`} aria-label="Chat with your documents">
    <div ref={conversation} className="conversation" aria-live="polite" aria-busy={thinking}>
      {!messages.length && <div className="chat-start">
        <span className="chat-start-mark"><Icon name="sparkle" /></span><h3>What would you like to explore?</h3><p>Find an answer, connect ideas, or get a clear summary of your documents.</p>
        <div className="question-list">{suggestions.map(item => <button key={item.title} onClick={() => choose(item.question)} disabled={busy}><Icon name={item.icon} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="arrow" /></button>)}</div>
      </div>}
      {messages.map((message, index) => <article ref={index === messages.length - 1 ? latest : null} className={`message ${message.role}`} key={index}>
        <div className="message-avatar" aria-hidden="true">{message.role === 'user' ? 'P' : <Icon name="sparkle" />}</div>
        <div className="message-body"><div className="message-meta"><span className="message-author">{message.role === 'user' ? 'You' : 'Folio'}</span>{message.role === 'assistant' && <span className="answer-tag">{message.answer_type === 'app_help' ? 'Folio help' : 'From your library'}</span>}</div>{message.routing && <span className="answer-model" title={message.routing.reason}>{message.routing.model}{message.routing.initial_model ? " (retried)" : ""}</span>}<AnswerText text={message.text || ''} onCitation={id => onInspect(message.sources || [], index, id)} />
          {message.sources?.length > 0 && <button className="answer-sources" onClick={() => onInspect(message.sources, index)}><Icon name="file" /><span>{new Set(message.sources.map(source => source.source)).size} documents</span><span className="source-dots">·</span><span>{message.sources.length} excerpts</span><Icon name="arrow" /></button>}
        </div>
      </article>)}
      {thinking && <div className="thinking" role="status"><span className="message-avatar"><Icon name="sparkle" /></span><div><strong>Finding the right words</strong><span>Reading your documents<span className="thinking-dots">…</span></span></div><span className="spinner" /></div>}
    </div>
    {composer}
  </section>;
}
