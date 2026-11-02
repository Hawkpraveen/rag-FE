import React, { useEffect, useState } from 'react';
import { api } from '../../shared/api/client';
import { Icon } from '../../shared/ui/Icon';

export function ChatHistorySidebar({ history, busy, onNewChat, onSelect }) {
  const [projects, setProjects] = useState([]);
  const [organization, setOrganization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [menu, setMenu] = useState(null);
  const disabled = busy || saving;

  async function refresh() {
    setLoading(true); setError('');
    try {
      const data = await api('/chat-organization');
      setProjects(data.projects); setOrganization(data.chats);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    function close(event) {
      if (event.type === 'keydown' ? event.key === 'Escape' : !event.target.closest('.history-chat-actions')) setMenu(null);
    }
    document.addEventListener('click', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', close); };
  }, []);
  async function update(id, changes) {
    setSaving(true); setError('');
    try {
      await api('/chat-organization', { conversation_id: id, ...changes });
      setOrganization(items => {
        const previous = items.find(item => item.conversation_id === id);
        return [...items.filter(item => item.conversation_id !== id), { conversation_id: id, ...previous, ...changes }];
      });
      setMenu(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function createProject(event) {
    event.preventDefault();
    if (!name.trim() || disabled) return;
    setSaving(true); setError('');
    try {
      const data = await api('/projects', { name: name.trim() });
      setProjects(items => [...items, data.project]); setName(''); setCreating(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  const metadata = new Map(organization.map(item => [item.conversation_id, item]));
  const chats = [...history.conversations].sort((a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0));
  function chatRow(chat) {
    const current = chat.conversation_id === history.conversationId;
    const meta = metadata.get(chat.conversation_id) || {};
    return <li className={`history-chat${current ? ' current' : ''}`} key={chat.conversation_id}>
      <button type="button" className="history-chat-link" disabled={disabled} aria-current={current ? 'page' : undefined} title={chat.title} onClick={() => { setMenu(null); onSelect(chat.conversation_id); }}><span>{chat.title || 'Untitled chat'}</span></button>
      <div className="history-chat-actions">
        <button type="button" className="history-more" disabled={disabled || loading || Boolean(error)} aria-label={`Options for ${chat.title || 'chat'}`} aria-expanded={menu === chat.conversation_id} onClick={() => setMenu(menu === chat.conversation_id ? null : chat.conversation_id)}>···</button>
        {menu === chat.conversation_id && <div className="history-chat-menu">
          <button type="button" disabled={disabled} onClick={() => update(chat.conversation_id, { pinned: !meta.pinned })}>{meta.pinned ? 'Unpin chat' : 'Pin chat'}</button>
          <label>Move to project<select autoFocus value={meta.project_id || ''} disabled={disabled} onChange={event => update(chat.conversation_id, { project_id: event.target.value || null })}><option value="">No project</option>{projects.map(project => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
        </div>}
      </div>
    </li>;
  }
  const pinned = chats.filter(chat => metadata.get(chat.conversation_id)?.pinned);
  const recent = chats.filter(chat => !metadata.get(chat.conversation_id)?.pinned && !metadata.get(chat.conversation_id)?.project_id);
  return <nav className="chat-history-sidebar" aria-label="Chat history">
    <button type="button" className="history-new-chat" disabled={disabled || !history.messages.length} onClick={onNewChat}><Icon name="plus" /> New chat</button>
    {error && <div className="history-organization-error" role="alert"><p>{error}</p><button type="button" className="plain-button" disabled={disabled || loading} onClick={refresh}>Retry</button></div>}
    <details className="history-section" open><summary>Pinned</summary>{pinned.length ? <ul>{pinned.map(chatRow)}</ul> : <p className="history-empty">Pin a chat using its ··· menu.</p>}</details>
    <section className="history-section history-projects" aria-labelledby="history-project-heading">
      <div className="history-section-heading"><h3 id="history-project-heading">Projects</h3><button type="button" className="history-add-project" aria-label="Create project" title="Create project" disabled={disabled || loading || Boolean(error)} onClick={() => setCreating(value => !value)}><Icon name="plus" /></button></div>
      {creating && <form className="history-project-form" onSubmit={createProject}><label htmlFor="project-name">Project name</label><input id="project-name" autoFocus value={name} maxLength={80} disabled={saving} onChange={event => setName(event.target.value)} placeholder="e.g. Research notes" /><div><button type="submit" disabled={disabled || !name.trim()}>Create</button><button type="button" disabled={saving} onClick={() => { setCreating(false); setName(''); }}>Cancel</button></div></form>}
      {projects.map(project => {
        const projectChats = chats.filter(chat => metadata.get(chat.conversation_id)?.project_id === project.id);
        return <details className="history-project" key={project.id} open={projectChats.some(chat => chat.conversation_id === history.conversationId) || undefined}><summary><Icon name="folder" /><span>{project.name}</span></summary>{projectChats.length ? <ul>{projectChats.map(chatRow)}</ul> : <p className="history-empty">Move a chat here using its ··· menu.</p>}</details>;
      })}
      {!loading && !projects.length && !creating && <p className="history-empty">Create a project to group related chats.</p>}
    </section>
    <details className="history-section" open><summary>Recent chats</summary>{recent.length ? <ul>{recent.map(chatRow)}</ul> : <p className="history-empty">{loading ? 'Loading chats…' : 'Your new chats will appear here.'}</p>}</details>
    <button type="button" className="plain-button history-reload" disabled={disabled || loading} onClick={() => { refresh(); history.retry(); }}>Reload chats</button>
  </nav>;
}
