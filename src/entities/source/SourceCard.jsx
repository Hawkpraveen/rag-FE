import React, { useEffect, useRef } from 'react';
import { Icon } from '../../shared/ui/Icon';

export function SourceCard({ source, selected = false }) {
  const card = useRef(null);
  const name = source.source.split(/[\\/]/).pop();
  useEffect(() => {
    if (selected && card.current) {
      card.current.open = true;
      card.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected]);
  return <details ref={card} className={`source-card${selected ? ' source-selected' : ''}`}>
    <summary><span className="source-id">{source.id}</span><span className="source-name">{name}<small>{source.location}</small></span><Icon name="chevron" className="expand" /></summary>
    <div className="source-content"><p>{source.text}</p><span className="source-excerpt-label"><Icon name="file" /> Original document excerpt</span></div>
  </details>;
}
