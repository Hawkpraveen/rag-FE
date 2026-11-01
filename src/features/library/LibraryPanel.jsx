import React, { useState } from 'react';
import { FileAttachment } from './FileAttachment';
import { api } from '../../shared/api/client';
import { Icon } from '../../shared/ui/Icon';

export function LibraryPanel({ onIndexed, onBusy, busy, files = [], documentCount, onAsk }) {
  const [path, setPath] = useState('docs');
  const [status, setStatus] = useState(null);
  async function ingest(event) {
    event.preventDefault();
    setStatus({ type: 'loading', text: 'Reading and indexing your documents…' });
    onBusy(true);
    try {
      const result = await api('/documents/ingest', { path: path.trim() });
      setStatus({ type: 'success', text: result.indexed_documents
        ? `${result.indexed_documents} document${result.indexed_documents === 1 ? '' : 's'} added to your library.`
        : 'Your documents are already up to date.' });
      onIndexed(path.trim());
    } catch (error) { setStatus({ type: 'error', text: error.message }); }
    finally { onBusy(false); }
  }
  return <section className="library" aria-labelledby="library-heading">
    <div className="library-overview"><div className="library-heading"><h2 id="library-heading">Your source material</h2><span className="count-badge">{documentCount ?? files.length}</span></div><p className="library-description">Everything your next answer is built on.</p></div>
    <div className="library-upload"><span className="upload-emblem"><Icon name="upload" /></span><strong>Give your ideas a reference.</strong><p>Add a document to your workspace</p><FileAttachment busy={busy} onBusy={onBusy} onIndexed={onIndexed} /></div>
    <div className="library-list-heading"><span>Documents</span><span>{files.length ? `${files.length} recently used` : 'All indexed files'}</span></div>
    <div className="document-list">
      {files.length ? files.map(name => <div className="document-item" key={name}><span className={`file-type ${name.split('.').pop().toLowerCase()}`}><Icon name="file" /></span><div><strong title={name}>{name}</strong><span>{name.split('.').pop().toUpperCase()} document</span></div><Icon className="file-ready" name="check" /></div>)
        : <div className="library-empty"><Icon name="file" /><strong>{documentCount ? `${documentCount} indexed documents` : 'No documents yet'}</strong><p>{documentCount ? 'Ask a question to see the referenced files here.' : 'Add a document above, or import a local folder below.'}</p></div>}
    </div>
    <button className="library-summary" disabled={busy || (!documentCount && !files.length)} onClick={() => onAsk('Summarize my documents')}><Icon name="sparkle" /> Summarize my library <Icon name="arrow" /></button>
    <details className="local-import"><summary><Icon name="folder" /><span>Import a local file or folder</span><Icon name="chevron" /></summary><form onSubmit={ingest}><label htmlFor="document-path">File or folder path</label><input id="document-path" value={path} onChange={e => setPath(e.target.value)} placeholder="D:\my-documents" required disabled={busy} /><button className="index-button" disabled={busy || !path.trim()}>{status?.type === 'loading' ? 'Indexing…' : 'Import documents'}<Icon name="arrow" /></button></form></details>
    {status && <p className={`library-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}
  </section>;
}
