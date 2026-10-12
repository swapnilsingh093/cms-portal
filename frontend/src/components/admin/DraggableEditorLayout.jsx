import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RotateCcw } from 'lucide-react';

// WordPress-style Sortable Item Wrapper around each MetaBox
const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    marginBottom: '20px'
  };

  // WordPress-like dotted drop placeholder preview
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          border: '2px dashed var(--primary-color, #6366f1)',
          background: 'rgba(99, 102, 241, 0.08)',
          borderRadius: '10px',
          minHeight: '80px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--primary-color, #6366f1)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: 'inset 0 0 16px rgba(99, 102, 241, 0.1)'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary-color, #6366f1)',
            opacity: 0.8
          }}
        />
        <span>Drop Meta Box Here</span>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            dragHandleProps: { ...attributes, ...listeners },
            isDragging
          })
        : children}
    </div>
  );
};

// Layout deduplication and sanitization helper
const sanitizeLayout = (rawLayout, availableIds, defaultLayout = { main: [], sidebar: [] }) => {
  const seen = new Set();
  const cleanMain = [];
  const cleanSidebar = [];

  const rawMain = Array.isArray(rawLayout?.main) ? rawLayout.main : (defaultLayout?.main || []);
  const rawSidebar = Array.isArray(rawLayout?.sidebar) ? rawLayout.sidebar : (defaultLayout?.sidebar || []);

  // Process main column
  rawMain.forEach((id) => {
    if (availableIds.includes(id) && !seen.has(id)) {
      seen.add(id);
      cleanMain.push(id);
    }
  });

  // Process sidebar column
  rawSidebar.forEach((id) => {
    if (availableIds.includes(id) && !seen.has(id)) {
      seen.add(id);
      cleanSidebar.push(id);
    }
  });

  // Place any available children not yet in layout
  availableIds.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      if (defaultLayout?.sidebar && defaultLayout.sidebar.includes(id)) {
        cleanSidebar.push(id);
      } else {
        cleanMain.push(id);
      }
    }
  });

  return { main: cleanMain, sidebar: cleanSidebar };
};

// Droppable Column (Main or Sidebar)
const DroppableColumn = ({ id, items, itemsMap, emptyMessage = 'Drag meta boxes here' }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '260px',
        borderRadius: '10px',
        padding: items.length === 0 ? '24px 16px' : '0px',
        background: isOver
          ? 'rgba(99, 102, 241, 0.05)'
          : items.length === 0
          ? 'rgba(255, 255, 255, 0.02)'
          : 'transparent',
        border: items.length === 0
          ? '2px dashed var(--border-color, rgba(255, 255, 255, 0.15))'
          : isOver
          ? '2px dashed var(--primary-color, #6366f1)'
          : 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
      }}
    >
      <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
        {items.map((itemId) => {
          const child = itemsMap[itemId];
          if (!child) return null;
          return (
            <SortableItem key={itemId} id={itemId}>
              {child}
            </SortableItem>
          );
        })}
      </SortableContext>

      {items.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '140px',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <GripVertical size={22} style={{ opacity: 0.4, marginBottom: '6px' }} />
          <span>{emptyMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function DraggableEditorLayout({
  layoutKey,
  defaultLayout = { main: [], sidebar: [] },
  children,
  mainTopContent,
  sidebarTopContent,
  sidebarWidth = '280px'
}) {
  // Extract all valid children that have an `id` prop
  const itemsMap = useMemo(() => {
    const map = {};
    React.Children.forEach(children, (child) => {
      if (child && child.props && child.props.id) {
        map[child.props.id] = child;
      }
    });
    return map;
  }, [children]);

  const availableIds = useMemo(() => Object.keys(itemsMap), [itemsMap]);

  // Read saved layout from localStorage with strict deduplication
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(layoutKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.main) && Array.isArray(parsed.sidebar)) {
          return sanitizeLayout(parsed, Object.keys(itemsMap), defaultLayout);
        }
      }
    } catch (e) {
      console.warn('Failed to parse layout from localStorage', e);
    }
    return defaultLayout;
  });

  // Reconcile available child IDs with layout strictly deduplicated
  useEffect(() => {
    if (availableIds.length === 0) return;

    setLayout((prev) => {
      const sanitized = sanitizeLayout(prev, availableIds, defaultLayout);

      const isSame =
        (prev.main || []).length === sanitized.main.length &&
        (prev.sidebar || []).length === sanitized.sidebar.length &&
        (prev.main || []).every((id, idx) => id === sanitized.main[idx]) &&
        (prev.sidebar || []).every((id, idx) => id === sanitized.sidebar[idx]);

      if (isSame) return prev;

      try {
        localStorage.setItem(layoutKey, JSON.stringify(sanitized));
      } catch (e) {}
      return sanitized;
    });
  }, [availableIds, layoutKey, defaultLayout]);

  // Listen for layout updates across editors/tabs
  useEffect(() => {
    const handleLayoutUpdate = (e) => {
      if (e?.detail?.layoutKey === layoutKey && e.detail.layout && e.detail.source !== 'local') {
        const sanitized = sanitizeLayout(e.detail.layout, availableIds, defaultLayout);
        setLayout(sanitized);
      }
    };
    const handleStorageChange = (e) => {
      if (e.key === layoutKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed.main) && Array.isArray(parsed.sidebar)) {
            const sanitized = sanitizeLayout(parsed, availableIds, defaultLayout);
            setLayout(sanitized);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('cms-layout-changed', handleLayoutUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('cms-layout-changed', handleLayoutUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [layoutKey, availableIds, defaultLayout]);

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // 5px threshold to differentiate between click and drag
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const findContainer = (id) => {
    if (id === 'main' || id === 'sidebar') return id;
    if ((layout.main || []).includes(id)) return 'main';
    if ((layout.sidebar || []).includes(id)) return 'sidebar';
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLayout((prev) => {
      const activeItems = (prev[activeContainer] || []).filter((i) => i !== activeId);
      const overItems = (prev[overContainer] || []).filter((i) => i !== activeId);

      let newIndex = overItems.length;
      if (overId !== 'main' && overId !== 'sidebar') {
        const overIndex = overItems.indexOf(overId);
        if (overIndex >= 0) {
          const isBelowOverItem =
            over &&
            active.rect?.current?.translated &&
            over.rect &&
            active.rect.current.translated.top > over.rect.top + (over.rect.height || 0) / 2;
          newIndex = isBelowOverItem ? overIndex + 1 : overIndex;
        }
      }

      newIndex = Math.max(0, Math.min(newIndex, overItems.length));

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeId,
          ...overItems.slice(newIndex)
        ]
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    setLayout((prev) => {
      let nextLayout = prev;
      if (activeContainer === overContainer) {
        const currentItems = prev[activeContainer] || [];
        const activeIndex = currentItems.indexOf(activeId);
        const overIndex = currentItems.indexOf(overId);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          nextLayout = {
            ...prev,
            [activeContainer]: arrayMove(currentItems, activeIndex, overIndex)
          };
        }
      }

      const sanitized = sanitizeLayout(nextLayout, availableIds, defaultLayout);
      try {
        localStorage.setItem(layoutKey, JSON.stringify(sanitized));
        window.dispatchEvent(
          new CustomEvent('cms-layout-changed', {
            detail: { layoutKey, layout: sanitized, source: 'local' }
          })
        );
      } catch (e) {}

      return sanitized;
    });
  };

  const handleResetLayout = () => {
    const sanitized = sanitizeLayout(defaultLayout, availableIds, defaultLayout);
    setLayout(sanitized);
    try {
      localStorage.setItem(layoutKey, JSON.stringify(sanitized));
      window.dispatchEvent(
        new CustomEvent('cms-layout-changed', {
          detail: { layoutKey, layout: sanitized, source: 'local' }
        })
      );
    } catch (e) {}
  };

  // Determine active item title for DragOverlay preview
  const activeTitle = useMemo(() => {
    if (!activeId || !itemsMap[activeId]) return activeId;
    const child = itemsMap[activeId];
    return child.props?.title || activeId;
  }, [activeId, itemsMap]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Top Bar with Layout Options */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '14px'
        }}
      >
        <button
          type="button"
          onClick={handleResetLayout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-muted, #94a3b8)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'color 0.15s ease'
          }}
          title="Reset meta box positions to default"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary, #f8fafc)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #94a3b8)')}
        >
          <RotateCcw size={12} />
          <span>Reset Layout</span>
        </button>
      </div>

      <div
        className="wp-editor-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, 1fr) ${sidebarWidth}`,
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {mainTopContent}
          <DroppableColumn
            id="main"
            items={layout.main}
            itemsMap={itemsMap}
            emptyMessage="Drag main meta boxes here"
          />
        </div>

        {/* Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {sidebarTopContent}
          <DroppableColumn
            id="sidebar"
            items={layout.sidebar}
            itemsMap={itemsMap}
            emptyMessage="Drag sidebar meta boxes here"
          />
        </div>
      </div>

      {/* Lightweight drag preview */}
      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div
            style={{
              background: 'var(--bg-card, #121829)',
              border: '2px solid var(--primary-color, #6366f1)',
              borderRadius: '8px',
              padding: '12px 18px',
              color: 'var(--text-primary, #f8fafc)',
              fontWeight: 600,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 14px 35px rgba(0, 0, 0, 0.65)',
              cursor: 'grabbing',
              opacity: 0.95,
              zIndex: 999999
            }}
          >
            <GripVertical size={16} color="var(--primary-color, #6366f1)" />
            <span>{typeof activeTitle === 'string' ? activeTitle : activeId}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
