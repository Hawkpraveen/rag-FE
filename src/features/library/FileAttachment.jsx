import React, { useRef, useState } from 'react';
import { api } from '../../shared/api/client';
import { Icon } from '../../shared/ui/Icon';

export function FileAttachment({ busy, onBusy, onIndexed, compact = false }) {
  const input = useRef(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  async function attach(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    if (!/\.(txt|md|pdf)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024) {
      setStatus({ error: true, text: 'Choose a non-empty TXT, Markdown, or PDF up to 10 MB.' });
      return;
    }
    setStatus({ text: `Adding ${file.name} to your library…` });
    setUploading(true); onBusy(true);
    try {
      const form = new FormData(); form.append('file', file);
      const result = await api('/documents/upload', form);
      setStatus({ text: `${result.filename} is ready for questions.`, success: true });
      onIndexed?.(result.filename);
    } catch (error) { setStatus({ error: true, text: error.message }); }
    finally { setUploading(false); onBusy(false); }
  }
  return <div className={`file-attachment${compact ? ' compact' : ''}`}>
    <input ref={input} type="file" accept=".txt,.md,.pdf" hidden disabled={busy} onChange={attach} aria-label="Choose a document to attach" />
    <button type="button" className="attach-button" disabled={busy} onClick={() => input.current?.click()} aria-label="Attach a document" title="Add TXT, Markdown, or PDF up to 10 MB">
      {uploading ? <span className="spinner" /> : <Icon name={compact ? 'attach' : 'plus'} />}<span>{uploading ? 'Adding document…' : compact ? 'Attach' : 'Add documents'}</span>{!compact && !uploading && <kbd>+</kbd>}
    </button>
    {!compact && <span className="field-hint">PDF, TXT, Markdown · up to 10 MB</span>}
    {status && (!compact || status.error || uploading) && <p className={`attachment-status${status.error ? ' error' : status.success ? ' success' : ''}`} role={status.error ? 'alert' : 'status'}>{status.success && <Icon name="check" />}{status.text}</p>}
  </div>;
}
