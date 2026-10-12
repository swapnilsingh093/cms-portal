import React, { useState, useEffect, useRef } from 'react';
import { menuAPI, categoryAPI, pageAPI, postAPI, videoAPI, galleryAPI } from '../../services/api';
import {
  Menu as MenuIcon, Plus, Trash2, Save, AlertCircle, Check,
  GripVertical, ChevronDown, ChevronUp, ChevronRight, Edit2, X,
  FileText, Film, Image as ImageIcon, FolderTree, Link2, Loader2,
  ArrowRight, CornerDownRight, ArrowLeft, Move
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Flatten & Nest Helpers (WordPress Menu Model)
────────────────────────────────────────────── */
const flattenItems = (nestedItems) => {
  const result = [];
  (nestedItems || []).forEach((item, parentIdx) => {
    result.push({
      ...item,
      id: item._id || item.id || `item-${Date.now()}-${Math.random()}`,
      depth: 0,
      children: undefined
    });
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach((child) => {
        result.push({
          ...child,
          id: child._id || child.id || `child-${Date.now()}-${Math.random()}`,
          depth: 1,
          children: undefined
        });
      });
    }
  });
  return result;
};

const nestItems = (flatList) => {
  const root = [];
  let currentParent = null;

  (flatList || []).forEach((item, idx) => {
    const cleanItem = {
      title: item.title,
      type: item.type || 'custom',
      url: item.url,
      target: item.target || '_self',
      refId: item.refId || null,
      order: idx,
      children: []
    };

    if (item.depth === 1 && currentParent) {
      cleanItem.order = currentParent.children.length;
      currentParent.children.push(cleanItem);
    } else {
      cleanItem.depth = 0;
      currentParent = cleanItem;
      root.push(cleanItem);
    }
  });

  return root;
};

/* ──────────────────────────────────────────────
   Draggable WordPress-Like Menu Item Row
────────────────────────────────────────────── */
const DraggableMenuItem = ({
  item,
  idx,
  total,
  parentTitle,
  canIndent,
  canOutdent,
  onMove,
  onIndent,
  onOutdent,
  onRemove,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editUrl, setEditUrl] = useState(item.url);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onEdit(idx, { title: editTitle, url: editUrl });
    setEditing(false);
  };

  const isChild = item.depth === 1;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
      style={{
        marginLeft: isChild ? '36px' : '0px',
        background: isChild ? 'var(--g-accent, rgba(99, 102, 241, 0.05))' : 'var(--bg-surface)',
        border: isChild
          ? '1px solid var(--g-accent, rgba(99, 102, 241, 0.3))'
          : '1px solid var(--border-color)',
        borderLeft: isChild ? '4px solid var(--primary-color)' : '1px solid var(--border-color)',
        borderRadius: 8,
        marginBottom: 8,
        transition: 'all 0.15s ease',
        boxShadow: isChild ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10 }}>
        {/* Drag Handle & Reorder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            title="Drag to reorder"
            style={{ cursor: 'grab', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
          >
            <GripVertical size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={() => onMove(idx, -1)}
              disabled={idx === 0}
              style={{
                background: 'none',
                border: 'none',
                color: idx === 0 ? 'var(--text-dim)' : 'var(--accent-primary)',
                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                padding: 1
              }}
              title="Move Up"
            >
              <ChevronUp size={13} />
            </button>
            <button
              type="button"
              onClick={() => onMove(idx, 1)}
              disabled={idx === total - 1}
              style={{
                background: 'none',
                border: 'none',
                color: idx === total - 1 ? 'var(--text-dim)' : 'var(--accent-primary)',
                cursor: idx === total - 1 ? 'not-allowed' : 'pointer',
                padding: 1
              }}
              title="Move Down"
            >
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {/* Type Icon */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {item.type === 'post' ? (
            <FileText size={13} color="#60a5fa" />
          ) : item.type === 'video' ? (
            <Film size={13} color="#a78bfa" />
          ) : item.type === 'gallery' ? (
            <ImageIcon size={13} color="#34d399" />
          ) : item.type === 'page' ? (
            <FileText size={13} color="#fbbf24" />
          ) : item.type === 'category' ? (
            <FolderTree size={13} color="#f87171" />
          ) : (
            <Link2 size={13} color="var(--text-dim)" />
          )}
        </div>

        {/* Label & Hierarchy Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Navigation Label"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  flex: 1
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}
                title="Save"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              {isChild && (
                <CornerDownRight size={13} style={{ color: 'var(--primary-color)' }} />
              )}
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {item.title}
              </span>
              {isChild ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#818cf8',
                    background: 'var(--g-accent, rgba(99, 102, 241, 0.15))',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}
                >
                  sub item {parentTitle ? `of ${parentTitle}` : ''}
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {item.type}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '180px'
                }}
              >
                · {item.url}
              </span>
            </div>
          )}
        </div>

        {/* Hierarchy Indent / Outdent Controls (WordPress Style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {canIndent && !isChild && (
            <button
              type="button"
              onClick={() => onIndent(idx)}
              style={{
                fontSize: '11.5px',
                padding: '4px 8px',
                background: 'var(--g-accent, rgba(99, 102, 241, 0.1))',
                border: '1px solid var(--g-accent, rgba(99, 102, 241, 0.3))',
                color: 'var(--primary-color)',
                borderRadius: 5,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600
              }}
              title="Indent to make this a sub-item of the item above"
            >
              <CornerDownRight size={12} /> Make Child
            </button>
          )}

          {isChild && (
            <button
              type="button"
              onClick={() => onOutdent(idx)}
              style={{
                fontSize: '11.5px',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: 5,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600
              }}
              title="Outdent to move back to top level parent"
            >
              <ArrowLeft size={12} /> Outdent
            </button>
          )}

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            title="Edit Title / URL"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title="Expand Details"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            title="Remove Item"
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '12px 16px',
            fontSize: '0.84rem',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>
              Target URL
            </label>
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: '12.5px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <button
              type="button"
              onClick={handleSave}
              className="button button-primary button-small"
            >
              Update URL
            </button>
            <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
              Type: <strong>{item.type}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────
   Add Items Panel (Checkboxes)
────────────────────────────────────────────── */
const AddItemPanel = ({ title, icon: Icon, color, items, labelKey, type, urlBuilder, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');

  const filtered = (items || []).filter((i) =>
    (i[labelKey] || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = (check) => {
    const next = {};
    if (check) {
      filtered.forEach((i) => {
        next[i._id || i.id] = true;
      });
    }
    setSelected(next);
  };

  const handleAdd = () => {
    const toAdd = items
      .filter((i) => selected[i._id || i.id])
      .map((i) => ({
        title: i[labelKey],
        type,
        refId: i._id || i.id,
        url: urlBuilder(i),
        children: []
      }));
    if (toAdd.length > 0) {
      onAdd(toAdd);
      setSelected({});
      setOpen(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden'
      }}
    >
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '12px 16px',
          fontWeight: 600,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: open ? 'rgba(255,255,255,0.03)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} color={color} />
          <span>{title}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            ({items?.length || 0})
          </span>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>

      {open && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border-color)' }}>
          {items?.length > 5 && (
            <input
              type="text"
              placeholder={`Search ${title}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                marginBottom: 8
              }}
            />
          )}

          {filtered.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', padding: '8px 0' }}>
              No items available.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  marginBottom: 6
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                >
                  Clear
                </button>
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtered.map((item) => {
                  const id = item._id || item.id;
                  return (
                    <label
                      key={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.83rem',
                        cursor: 'pointer',
                        padding: '3px 0'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected[id]}
                        onChange={(e) => setSelected({ ...selected, [id]: e.target.checked })}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item[labelKey]}
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={selectedCount === 0}
                style={{
                  marginTop: 10,
                  width: '100%',
                  background: selectedCount > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                  color: selectedCount > 0 ? '#fff' : 'var(--text-dim)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Add to Menu {selectedCount > 0 ? `(${selectedCount})` : ''}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────
   Main MenuManager Component
────────────────────────────────────────────── */
const MenuManager = () => {
  const [menus, setMenus] = useState([]);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [flatItems, setFlatItems] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // New menu form
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuLocation, setNewMenuLocation] = useState('header');
  const [creatingMenu, setCreatingMenu] = useState(false);

  // Custom URL
  const [customUrl, setCustomUrl] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes, pageRes, postRes, vidRes, galRes] = await Promise.all([
        menuAPI.getAll(),
        categoryAPI.getAll(),
        pageAPI.getAll({ status: 'published' }),
        postAPI.getAll({ status: 'published', limit: 50 }),
        videoAPI.getAll({ status: 'published', limit: 50 }),
        galleryAPI.getAll({ status: 'published', limit: 50 })
      ]);
      if (menuRes.menus) {
        setMenus(menuRes.menus);
        if (menuRes.menus.length > 0) {
          const selected = menuRes.menus[0];
          setCurrentMenu(selected);
          setFlatItems(flattenItems(selected.items));
        }
      }
      if (catRes.categories) setCategories(catRes.categories);
      if (pageRes.pages) setPages(pageRes.pages);
      if (postRes.posts) setPosts(postRes.posts);
      if (vidRes.videos) setVideos(vidRes.videos);
      if (galRes.galleries) setGalleries(galRes.galleries);
    } catch (err) {
      showMsg('error', 'Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectMenu = (menu) => {
    setCurrentMenu(menu);
    setFlatItems(flattenItems(menu.items));
  };

  // Add items to current menu
  const addItems = (newItems) => {
    if (!currentMenu) return;
    const toAdd = newItems.map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
      depth: 0
    }));
    setFlatItems((prev) => [...prev, ...toAdd]);
  };

  // Add custom URL
  const addCustomUrl = (e) => {
    e.preventDefault();
    if (!customLabel || !customUrl) return;
    addItems([
      {
        title: customLabel,
        type: 'custom',
        url: customUrl.startsWith('/') || customUrl.startsWith('http') ? customUrl : '/' + customUrl
      }
    ]);
    setCustomUrl('');
    setCustomLabel('');
  };

  // Move item up / down
  const moveItem = (idx, dir) => {
    const list = [...flatItems];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    // If moving to top, it cannot be a child
    if (targetIdx === 0 && list[0].depth === 1) {
      list[0].depth = 0;
    }
    setFlatItems(list);
  };

  // Indent (Make Child of item above it)
  const handleIndent = (idx) => {
    if (idx <= 0) return;
    const list = [...flatItems];
    list[idx] = { ...list[idx], depth: 1 };
    setFlatItems(list);
  };

  // Outdent (Promote back to parent root)
  const handleOutdent = (idx) => {
    const list = [...flatItems];
    list[idx] = { ...list[idx], depth: 0 };
    setFlatItems(list);
  };

  // Remove item
  const removeItem = (idx) => {
    const list = [...flatItems];
    list.splice(idx, 1);
    // If first item became child, reset depth
    if (list.length > 0 && list[0].depth === 1) {
      list[0].depth = 0;
    }
    setFlatItems(list);
  };

  // Edit item title / URL
  const editItem = (idx, updates) => {
    const list = [...flatItems];
    list[idx] = { ...list[idx], ...updates };
    setFlatItems(list);
  };

  // Drag & drop handlers
  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    const list = [...flatItems];
    const [moved] = list.splice(draggedIdx, 1);
    list.splice(dropIdx, 0, moved);
    if (dropIdx === 0 && list[0].depth === 1) {
      list[0].depth = 0;
    }
    setFlatItems(list);
    setDraggedIdx(null);
  };

  // Save menu to backend
  const handleSave = async () => {
    if (!currentMenu) return;
    setSaving(true);
    try {
      const nested = nestItems(flatItems);
      await menuAPI.update(currentMenu._id, {
        title: currentMenu.title,
        location: currentMenu.location,
        items: nested
      });
      showMsg('success', `Menu "${currentMenu.title}" saved successfully with hierarchy!`);
      const menuRes = await menuAPI.getAll();
      if (menuRes.menus) {
        setMenus(menuRes.menus);
        const updated = menuRes.menus.find((m) => m._id === currentMenu._id);
        if (updated) {
          setCurrentMenu(updated);
          setFlatItems(flattenItems(updated.items));
        }
      }
    } catch (err) {
      showMsg('error', 'Error saving menu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Create new menu
  const handleCreateMenu = async (e) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;
    setCreatingMenu(true);
    try {
      const res = await menuAPI.create({ title: newMenuName, location: newMenuLocation, items: [] });
      showMsg('success', `Menu "${newMenuName}" created!`);
      setNewMenuName('');
      await fetchData();
      if (res.menu) {
        setCurrentMenu(res.menu);
        setFlatItems([]);
      }
    } catch (err) {
      showMsg('error', 'Error creating menu: ' + err.message);
    } finally {
      setCreatingMenu(false);
    }
  };

  // Find parent title for an item if it is at depth 1
  const getParentTitle = (idx) => {
    if (idx === 0) return '';
    for (let i = idx - 1; i >= 0; i--) {
      if (flatItems[i].depth === 0) {
        return flatItems[i].title;
      }
    }
    return '';
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-color)',
    borderRadius: 7,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.85rem'
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MenuIcon size={24} color="var(--primary-color)" /> Menus & Navigation Hierarchy
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Manage desktop submenus, parent-child dropdowns, and mobile drawers with WordPress-style hierarchy.
          </p>
        </div>

        {currentMenu && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--primary-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {saving ? 'Saving Hierarchy...' : 'Save Menu'}
          </button>
        )}
      </div>

      {/* Notifications */}
      {message.text && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            color: message.type === 'error' ? '#ef4444' : '#22c55e',
            fontSize: '0.88rem'
          }}
        >
          {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="spin" color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
          <div>Loading navigation menus...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* ═══ LEFT COLUMN: Select/Create Menu & Add Items ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Select Existing Menu */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
              <label style={labelStyle}>Select Menu to Edit</label>
              <select
                value={currentMenu?._id || ''}
                onChange={(e) => {
                  const m = menus.find((x) => x._id === e.target.value);
                  if (m) handleSelectMenu(m);
                }}
                style={inputStyle}
              >
                {menus.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Create New Menu */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Create New Menu
              </div>
              <form onSubmit={handleCreateMenu}>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Menu Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Navigation"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Display Location</label>
                  <select
                    value={newMenuLocation}
                    onChange={(e) => setNewMenuLocation(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="header">Header Navigation</option>
                    <option value="footer">Footer Links</option>
                    <option value="sidebar">Sidebar Menu</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingMenu}
                  style={{
                    width: '100%',
                    background: 'var(--primary-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    padding: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {creatingMenu ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  Create Menu
                </button>
              </form>
            </div>

            {/* Add Items Panels */}
            {currentMenu && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Add Menu Items
                </div>

                {/* Pages */}
                <AddItemPanel
                  title="Pages"
                  icon={FileText}
                  color="#fbbf24"
                  items={pages}
                  labelKey="title"
                  type="page"
                  urlBuilder={(p) => `/${p.slug}`}
                  onAdd={addItems}
                />

                {/* Categories */}
                <AddItemPanel
                  title="Categories"
                  icon={FolderTree}
                  color="#f87171"
                  items={categories}
                  labelKey="name"
                  type="category"
                  urlBuilder={(c) => `/category/${c.slug}`}
                  onAdd={addItems}
                />

                {/* Posts / Stories */}
                <AddItemPanel
                  title="Posts / Stories"
                  icon={FileText}
                  color="#60a5fa"
                  items={posts}
                  labelKey="title"
                  type="post"
                  urlBuilder={(p) => `/post/${p.slug}`}
                  onAdd={addItems}
                />

                {/* Videos */}
                <AddItemPanel
                  title="Videos"
                  icon={Film}
                  color="#a78bfa"
                  items={videos}
                  labelKey="title"
                  type="video"
                  urlBuilder={(v) => `/video/${v.slug}`}
                  onAdd={addItems}
                />

                {/* Galleries */}
                <AddItemPanel
                  title="Galleries"
                  icon={ImageIcon}
                  color="#34d399"
                  items={galleries}
                  labelKey="title"
                  type="gallery"
                  urlBuilder={(g) => `/gallery/${g.slug}`}
                  onAdd={addItems}
                />

                {/* Custom URL */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <Link2 size={14} color="var(--text-dim)" /> Custom Link
                  </div>
                  <form onSubmit={addCustomUrl} style={{ padding: 12 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={labelStyle}>URL</label>
                      <input
                        type="text"
                        placeholder="https://... or /about"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Navigation Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Contact Us"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: '0.82rem'
                      }}
                    >
                      <Plus size={13} /> Add to Menu
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN: WordPress-Style Menu Hierarchy ═══ */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 20 }}>
            {!currentMenu ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <MenuIcon size={40} style={{ marginBottom: 12 }} />
                <p>Create or select a menu on the left to get started.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {currentMenu.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Location: <strong style={{ color: 'var(--primary-color)' }}>{currentMenu.location}</strong> ·{' '}
                      {flatItems.length} total items
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    💡 Click <strong>Make Child</strong> to nest under item above, or drag to reorder.
                  </div>
                </div>

                {flatItems.length === 0 ? (
                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: 8,
                      padding: '48px 20px',
                      textAlign: 'center',
                      color: 'var(--text-dim)'
                    }}
                  >
                    <Plus size={32} style={{ marginBottom: 10 }} />
                    <p style={{ margin: 0 }}>Add pages, categories, or links from the left panel to build your navigation.</p>
                  </div>
                ) : (
                  <div>
                    {flatItems.map((item, idx) => {
                      const canIndent = idx > 0 && flatItems[idx - 1].depth === 0;
                      const canOutdent = item.depth === 1;
                      const parentTitle = item.depth === 1 ? getParentTitle(idx) : '';

                      return (
                        <DraggableMenuItem
                          key={item.id || idx}
                          item={item}
                          idx={idx}
                          total={flatItems.length}
                          parentTitle={parentTitle}
                          canIndent={canIndent}
                          canOutdent={canOutdent}
                          onMove={moveItem}
                          onIndent={handleIndent}
                          onOutdent={handleOutdent}
                          onRemove={removeItem}
                          onEdit={editItem}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Save button at bottom */}
                {flatItems.length > 0 && (
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      Hierarchy will be reflected on the website header & mobile drawer.
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--primary-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                      {saving ? 'Saving Hierarchy...' : 'Save Menu'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
