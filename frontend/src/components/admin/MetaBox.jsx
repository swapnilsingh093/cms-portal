import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

const MetaBox = ({
  id,
  title,
  icon,
  defaultExpanded = true,
  children,
  dragHandleProps,
  actions,
  className = '',
  style = {}
}) => {
  const [expanded, setExpanded] = useState(() => {
    if (id) {
      try {
        const saved = localStorage.getItem(`wp-metabox-open-${id}`);
        if (saved !== null) return saved === 'true';
      } catch (e) {}
    }
    return defaultExpanded;
  });

  const toggleExpand = (e) => {
    e.stopPropagation();
    const next = !expanded;
    setExpanded(next);
    if (id) {
      try {
        localStorage.setItem(`wp-metabox-open-${id}`, String(next));
      } catch (e) {}
    }
  };

  return (
    <div
      className={`postbox ${className}`}
      style={{
        background: 'var(--bg-card, #121829)',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...style
      }}
    >
      <div
        className="postbox-header"
        {...dragHandleProps}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.025)',
          borderBottom: expanded ? '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' : 'none',
          cursor: dragHandleProps ? 'grab' : 'default',
          userSelect: 'none',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              opacity: 0.7,
              flexShrink: 0
            }}
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
          <div
            onClick={toggleExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--text-primary, #f8fafc)',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {actions}
          <button
            type="button"
            onClick={toggleExpand}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            title={expanded ? 'Collapse box' : 'Expand box'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="postbox-inside"
          style={{
            padding: '18px 16px',
            animation: 'fadeIn 0.18s ease-in'
          }}
        >
          {children}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MetaBox;
