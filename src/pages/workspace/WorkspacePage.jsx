import React, { useEffect, useState } from 'react';
import { LibraryDesk } from '../../features/library/LibraryDesk';
import { ChatPanel } from '../../features/ask/ChatPanel';
import { useConversations } from '../../features/ask/useConversations';
import { SourceCard } from '../../entities/source/SourceCard';
import { api } from '../../shared/api/client';
import { FolioMark, Icon } from '../../shared/ui/Icon';
import { useTheme } from '../../shared/ui/useTheme';

export function WorkspacePage() {
  const { theme, toggleTheme } = useTheme();
  const [working, setBusy] = useState(false);
  const history = useConversations();
  const { messages, setMessages } = history;
  const busy = working || history.loading;
  const [connection, setConnection] = useState('checking');
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState('library');
  const [chatOpen, setChatOpen] = useState(true);
  const [proposedQuestion, setProposedQuestion] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState({ sources: [], index: null, selected: null });
  useEffect(() => {
    let active = true;
    async function check() {
      try { const data = await api('/health'); if (active) setConnection(data.agent === 'ok' ? 'online' : 'offline'); }
      catch { if (active) setConnection('offline'); }
    }
    check(); const timer = setInterval(check, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    api('/datasets').then(data => {
      if (active) setDataset(data.datasets?.find(item => item.datasetId === 'local-documents') ?? null);
    }).catch(error => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape') { setEvidenceOpen(false); setChatOpen(false); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  function propose(text = '') {
    setChatOpen(true); setEvidenceOpen(false);
    setProposedQuestion({ text, key: Date.now() });
  }
  function inspect(sources, index, selected = null) {
    setEvidence({ sources, index, selected }); setEvidenceOpen(true); setChatOpen(true);
  }
  function newChat() {
    history.newConversation(); setEvidence({ sources: [], index: null, selected: null });
    propose();
  }
  const files = dataset?.documents ?? [];
  const documentCount = dataset?.documentCount ?? 0;
  const showChat = chatOpen || view === 'conversation';
  return <div className="folio-app">
    <a className="skip-link" href="#main-content">Skip to workspace</a>
    <header className="folio-topbar">
      <a className="folio-brand" href="/" aria-label="Folio home"><FolioMark /><span>folio.</span></a>
      <span className="workspace-name">Personal workspace</span>
      <nav className="workspace-tabs" aria-label="Workspace views"><button className={view === 'library' ? 'current' : ''} aria-current={view === 'library' ? 'page' : undefined} onClick={() => setView('library')}><Icon name="folder" /> Library</button><button className={view === 'conversation' ? 'current' : ''} aria-current={view === 'conversation' ? 'page' : undefined} onClick={() => { setView('conversation'); setChatOpen(true); }}><Icon name="chat" /> Conversation{messages.length > 0 && <span className="tab-count">{Math.ceil(messages.length / 2)}</span>}</button></nav>
      <div className="account-status"><span className={`connection-dot ${connection}`} /><span>{connection === 'online' ? 'Connected' : connection === 'checking' ? 'Connecting' : 'Agent offline'}</span><span className="profile-avatar" title="Personal workspace">P</span></div>
    </header>
    <div className={`folio-body${view === 'conversation' ? ' conversation-view' : ''}${showChat ? ' chat-open' : ''}`}>
      <main id="main-content" className="library-main" hidden={view !== 'library'}>
        <LibraryDesk files={files} documentCount={documentCount} loading={loading} error={loadError} onRetry={() => setRevision(value => value + 1)} busy={busy} onBusy={setBusy} onIndexed={() => setRevision(value => value + 1)} onAsk={propose} />
      </main>
      {view === 'library' && !chatOpen && <button className="open-conversation" onClick={() => propose()}><Icon name="chat" /> Ask your library</button>}
      {view === 'library' && showChat && <button className="mobile-chat-backdrop" aria-label="Close conversation" onClick={() => setChatOpen(false)} />}
      <aside className="conversation-dock" aria-label="Library conversation" hidden={!showChat}>
        <div className="conversation-layout">
        <div className="chat-history-rail">        <div className="conversation-history" aria-label="Saved conversations">
          <label htmlFor="saved-conversation">Saved chats</label>
          <select id="saved-conversation" value={history.conversationId || ''} disabled={busy} onChange={event => { history.load(event.target.value); setEvidence({ sources: [], index: null, selected: null }); setEvidenceOpen(false); }}>
            {!history.conversations.some(item => item.conversation_id === history.conversationId) && <option value={history.conversationId || ''}>New conversation</option>}
            {history.conversations.map(item => <option key={item.conversation_id} value={item.conversation_id}>{item.title}</option>)}
          </select>
          <button className="plain-button" disabled={busy} onClick={history.retry}>Reload</button>
        </div>
<p className="history-caption">Your conversations stay here so you can pick up where you left off.</p></div>
        <div className="conversation-stage">
        <header className="conversation-title"><div className="conversation-title-icon"><Icon name="chat" /></div><div><h2>{view === 'conversation' ? 'Conversation' : 'Ask your library'}</h2><p>{documentCount} {documentCount === 1 ? 'document' : 'documents'} connected</p></div><div className="conversation-controls"><button className={`conversation-action${evidenceOpen ? ' selected' : ''}`} aria-expanded={evidenceOpen} aria-controls="evidence-panel" onClick={() => setEvidenceOpen(value => !value)}><Icon name="panel" /><span>Sources</span>{evidence.sources.length > 0 && <span className="source-counter">{evidence.sources.length}</span>}</button><button className="conversation-action new-chat-action" aria-label="New conversation" title="New conversation" disabled={busy || !messages.length} onClick={newChat}><Icon name="plus" /><span>New chat</span></button>{view === 'library' && <button className="icon-button" aria-label="Close conversation" onClick={() => setChatOpen(false)}><Icon name="close" /></button>}</div></header>
        {history.error && <div className="history-error" role="alert"><Icon name="chat" /><div><strong>Saved chats are unavailable</strong><span>{history.error}</span></div><button className="plain-button" disabled={busy} onClick={history.retry}>Retry</button></div>}
        {history.loading && <p className="history-loading" role="status">Loading saved conversation…</p>}
        {history.older && <button className="plain-button" disabled={busy} onClick={history.older}>Load earlier messages</button>}
        <div className="conversation-content" hidden={evidenceOpen}><ChatPanel conversationId={history.conversationId} onSaved={history.saved} proposedQuestion={proposedQuestion} documentCount={documentCount} onOpenLibrary={() => { setView('library'); setChatOpen(false); }} onIndexed={() => setRevision(value => value + 1)} busy={busy || !history.conversationId} onBusy={setBusy} messages={messages} setMessages={setMessages} onInspect={inspect} onAnswerSources={(sources, index) => setEvidence({ sources, index, selected: null })} /></div>
        <section id="evidence-panel" className="evidence-view" hidden={!evidenceOpen} aria-label="Answer sources"><div className="evidence-heading"><h3>Original passages</h3><button className="plain-button" onClick={() => setEvidenceOpen(false)}>Back to conversation</button></div>{evidence.sources.length ? <div className="evidence-list">{evidence.sources.map(source => <SourceCard key={`${evidence.index}-${source.id}`} source={source} selected={evidence.selected === source.id} />)}</div> : <div className="evidence-empty"><Icon name="file" /><h3>Your answer, with references.</h3><p>Ask a question to see the supporting passages here.</p></div>}</section>
        <footer className="conversation-footer"><Icon name="lock" /> Grounded in your documents. Check the original sources.</footer>
        </div></div>
      </aside>
    </div>
  </div>;
}
