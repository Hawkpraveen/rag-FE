import React, { useState } from 'react';
import { Icon } from '../../shared/ui/Icon';
import { FileAttachment } from './FileAttachment';
import { api } from '../../shared/api/client';

const typeName = type => ({ pdf: 'PDF document', md: 'Markdown', txt: 'Text document' })[type] ?? 'Document';

export function LibraryDesk({ files, documentCount, loading, error, onRetry, busy, onBusy, onIndexed, onAsk }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [layout, setLayout] = useState('grid');
  const [path, setPath] = useState('docs');
  const [importStatus, setImportStatus] = useState(null);
  const visibleFiles = files.filter(file => file.name.toLowerCase().includes(query.toLowerCase()) && (type === 'all' || file.type === type));
  async function ingest(event) {
    event.preventDefault(); onBusy(true); setImportStatus({ text: 'Indexing documents…' });
    try {
      const result = await api('/documents/ingest', { path: path.trim() });
      setImportStatus({ text: result.indexed_documents ? `${result.indexed_documents} documents added.` : 'Your documents are up to date.' }); onIndexed();
    } catch (error) { setImportStatus({ text: error.message, error: true }); }
    finally { onBusy(false); }
  }
  return <div className="library-desk">
    <header className="library-page-header"><div><div className="library-breadcrumb"><Icon name="folder" /> Workspace / Library</div><h1>Your library<span>{documentCount}</span></h1><p>A place for your documents. A starting point for your ideas.</p></div><FileAttachment busy={busy} onBusy={onBusy} onIndexed={onIndexed} /></header>
    <section className="library-overview" aria-label="Library overview"><div className="collection-identity"><span className="collection-icon"><Icon name="folder" /></span><div><h2>All documents</h2><p>{loading ? 'Reading your library…' : `${documentCount} ${documentCount === 1 ? 'document' : 'documents'} indexed and ready for questions`}</p></div></div><button className="ask-library-button" onClick={() => onAsk()}><Icon name="chat" /> Ask this library<Icon name="arrow" /></button></section>
    <div className="library-controls"><label className="document-search"><Icon name="search" /><input aria-label="Search documents" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a document…" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" /></button>}</label><label className="type-filter"><span className="sr-only">Filter by file type</span><select value={type} onChange={event => setType(event.target.value)}><option value="all">All file types</option><option value="pdf">PDF</option><option value="md">Markdown</option><option value="txt">Text</option></select></label><div className="layout-switch" role="group" aria-label="Document layout"><button aria-label="Grid view" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}><Icon name="grid" /></button><button aria-label="List view" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><Icon name="list" /></button></div></div>
    <div className="documents-section-heading"><h2>Documents</h2><span>{query || type !== 'all' ? `${visibleFiles.length} of ${files.length}` : `${files.length} files`}</span></div>
    {error && <div className="load-error" role="alert"><p>{error}</p><button onClick={onRetry}>Try again</button></div>}
    {loading ? <div className="library-loading" role="status"><span className="spinner" /> Loading your documents</div> : <div className={`document-shelf ${layout}`}>
      {visibleFiles.map(file => <button className={`document-cover type-${file.type}`} key={file.id ?? file.name} onClick={() => onAsk(`What are the key points in the document "${file.name}"?`)} disabled={busy} aria-label={`Ask about ${file.name}`}><div className="cover-art" aria-hidden="true"><span className="cover-type">{file.type}</span><Icon name="file" /><div className="cover-lines"><i /><i /><i /></div><span className="cover-seal"><Icon name="check" /></span></div><div className="document-caption"><span className="document-title">{file.name}</span><span className="document-type">{typeName(file.type)}<span className="ready-dot" />Ready</span></div><span className="document-open"><Icon name="chat" /> Ask about this document<Icon name="arrow" /></span></button>)}
      {!query && type === 'all' && <div className="add-document-tile"><Icon name="upload" /><h3>A little more knowledge.</h3><p>Add a report, guide, or a document you keep coming back to.</p><FileAttachment busy={busy} onBusy={onBusy} onIndexed={onIndexed} /></div>}
    </div>}
    {!loading && !error && !visibleFiles.length && (query || type !== 'all') && <div className="no-documents"><Icon name="search" /><h3>No matching documents</h3><p>Try another name or file type.</p><button onClick={() => { setQuery(''); setType('all'); }}>Clear filters</button></div>}
    {!loading && !error && documentCount > 0 && !files.length && <p className="metadata-notice">Your indexed library is available for questions. Document names are temporarily unavailable.</p>}
    <section className="library-workflows"><div><h2>Put your library to work</h2><p>Start with the question, not the search.</p></div><button disabled={busy || !documentCount} onClick={() => onAsk('Summarize my documents')}><Icon name="file" /><span>Get the essentials<small>A summary across your library</small></span><Icon name="arrow" /></button><button disabled={busy || !documentCount} onClick={() => onAsk('Compare the key ideas and differences across my documents')}><Icon name="compare" /><span>Connect the ideas<small>Compare your documents</small></span><Icon name="arrow" /></button></section>
    <details className="local-import"><summary><Icon name="folder" /><span>Import from a local file or folder</span><Icon name="chevron" /></summary><form onSubmit={ingest}><label htmlFor="document-path">File or folder path</label><div><input id="document-path" value={path} onChange={event => setPath(event.target.value)} placeholder="D:\my-documents" disabled={busy} required /><button disabled={busy || !path.trim()}>Import documents<Icon name="arrow" /></button></div></form>{importStatus && <p className={importStatus.error ? 'import-status error' : 'import-status'} role={importStatus.error ? 'alert' : 'status'}>{importStatus.text}</p>}</details>
    <footer className="library-page-footer"><span><Icon name="lock" /> Your answers link back to your source material.</span><span>PDF, Markdown & text</span></footer>
  </div>;
}
