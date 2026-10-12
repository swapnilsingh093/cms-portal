import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/admin/Pagination';
import { pageAPI } from '../../services/api';
import { useConfirm } from '../../hooks/useConfirm';
import { generateDateOptions } from '../../utils/adminHelper';
import {
  Plus,
  ExternalLink,
  Edit,
  Copy,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const PageList = () => {
  const [pages, setPages] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, published: 0, draft: 0, trash: 0 });
  const [currentTab, setCurrentTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [bulkActionTop, setBulkActionTop] = useState('');
  const [bulkActionBottom, setBulkActionBottom] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const { confirm, ConfirmDialog } = useConfirm();

  const [availableDates, setAvailableDates] = useState([]);
  const dateOptions = useMemo(() => {
    return availableDates.length > 0 ? availableDates : generateDateOptions();
  }, [availableDates]);

  const toggleSelectAll = () => {
    if (selectedIds.length === pages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pages.map(p => p._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDuplicatePage = async (id) => {
    setActionLoading(true);
    try {
      const res = await pageAPI.duplicate(id);
      setMessage({ type: "success", text: res.message || "Page duplicated successfully as Draft!" });
      fetchPages();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Duplicate failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyBulkAction = async (action) => {
    if (!action || selectedIds.length === 0) return;
    const isTrashTab = currentTab === 'trash';

    if (action === 'trash' || action === 'delete') {
      const isPermanent = action === 'delete' || isTrashTab;
      const confirmMsg = isPermanent
        ? `Are you sure you want to permanently delete ${selectedIds.length} selected page(s)? This action cannot be undone.`
        : `Are you sure you want to move ${selectedIds.length} selected page(s) to trash?`;

      const isConfirmed = await confirm({
        title: isPermanent ? 'Delete Permanently' : 'Move to Trash',
        message: confirmMsg,
        confirmText: isPermanent ? 'Delete' : 'Move to Trash',
      });
      if (!isConfirmed) return;

      setActionLoading(true);
      try {
        const res = await pageAPI.bulkDelete(selectedIds, isPermanent);
        setMessage({ type: 'success', text: res.message || `${selectedIds.length} page(s) processed successfully.` });
        setSelectedIds([]);
        setBulkActionTop('');
        setBulkActionBottom('');
        fetchPages();
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Bulk delete failed' });
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'restore') {
      setActionLoading(true);
      try {
        await Promise.all(selectedIds.map(id => pageAPI.restore(id)));
        setMessage({ type: 'success', text: `${selectedIds.length} page(s) restored successfully.` });
        setSelectedIds([]);
        setBulkActionTop('');
        setBulkActionBottom('');
        fetchPages();
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Restore failed' });
      } finally {
        setActionLoading(false);
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, search, dateFilter]);

  useEffect(() => {
    fetchPages();
  }, [currentTab, search, dateFilter, currentPage]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await pageAPI.getAll({
        status: currentTab,
        search: search || undefined,
        month: dateFilter || undefined,
        isAdmin: 'true',
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      if (res.pages) setPages(res.pages);
      if (res.statusCounts) setStatusCounts(res.statusCounts);
      if (res.totalPages !== undefined) setTotalPages(res.totalPages);
      if (res.total !== undefined) setTotalItems(res.total);
      if (res.availableDates) setAvailableDates(res.availableDates);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error loading pages' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleTrashPage = async (id, isPermanent = false) => {
    const confirmText = isPermanent
      ? 'Are you sure you want to permanently delete this page?'
      : 'Move this page to trash?';

    const isConfirmed = await confirm({
      title: isPermanent ? 'Delete Permanently' : 'Move to Trash',
      message: confirmText,
      confirmText: isPermanent ? 'Delete' : 'Move to Trash',
    });
    if (!isConfirmed) return;

    try {
      if (isPermanent) {
        await pageAPI.delete(id);
      } else {
        await pageAPI.update(id, { status: 'trash' });
      }
      setMessage({ type: 'success', text: isPermanent ? 'Page permanently deleted.' : 'Page moved to trash.' });
      fetchPages();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  const handleRestorePage = async (id) => {
    try {
      await pageAPI.restore(id);
      setMessage({ type: 'success', text: 'Page restored to Published.' });
      fetchPages();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Restore failed' });
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <ConfirmDialog />

      {/* 1. Header Bar: Title + Add New Page */}
      <div className="wp-header-row">
        <h1>Pages</h1>
        <Link to="/admin/pages/new" className="page-title-action button button-secondary">
          <Plus size={14} /> Add New Page
        </Link>
      </div>

      {/* Notifications */}
      {message.text && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--g-accent, rgba(16, 185, 129, 0.3))'}`
          }}
        >
          {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 2. WordPress Subsubsub Views & Search Box (Row 1) */}
      <div className="wp-subsubsub-search-row">
        <ul className="subsubsub-wp">
          <li>
            <button
              className={currentTab === 'all' ? 'current' : ''}
              onClick={() => setCurrentTab('all')}
            >
              All <span className="count">({statusCounts.all || 0})</span>
            </button>
            <span className="separator">|</span>
          </li>
          <li>
            <button
              className={currentTab === 'published' ? 'current' : ''}
              onClick={() => setCurrentTab('published')}
            >
              Published <span className="count">({statusCounts.published || 0})</span>
            </button>
            <span className="separator">|</span>
          </li>
          <li>
            <button
              className={currentTab === 'draft' ? 'current' : ''}
              onClick={() => setCurrentTab('draft')}
            >
              Drafts <span className="count">({statusCounts.draft || 0})</span>
            </button>
            <span className="separator">|</span>
          </li>
          <li>
            <button
              className={currentTab === 'trash' ? 'current' : ''}
              onClick={() => setCurrentTab('trash')}
            >
              Trash <span className="count">({statusCounts.trash || 0})</span>
            </button>
          </li>
        </ul>

        {/* Top Right Search Box */}
        <form className="wp-search-box" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder=""
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-submit button">
            Search Pages
          </button>
        </form>
      </div>

      {/* 3. Top Tablenav (Bulk Actions + Filters on Left, Pagination on Right) */}
      <div className="tablenav top">
        <div className="actions bulkactions">
          <select
            value={bulkActionTop}
            onChange={(e) => setBulkActionTop(e.target.value)}
          >
            <option value="">Bulk actions</option>
            {currentTab === 'trash' ? (
              <>
                <option value="restore">Restore</option>
                <option value="delete">Delete Permanently</option>
              </>
            ) : (
              <option value="trash">Move to Trash</option>
            )}
          </select>
          <button
            type="button"
            className="button"
            onClick={() => handleApplyBulkAction(bulkActionTop)}
            disabled={actionLoading || !bulkActionTop || selectedIds.length === 0}
          >
            Apply
          </button>
        </div>

        <div className="actions">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All dates</option>
            {dateOptions.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <button
            type="button"
            className="button"
            onClick={() => { setCurrentPage(1); fetchPages(); }}
          >
            Filter
          </button>
        </div>

        <div className="tablenav-pages">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* 4. Table */}
      <div className="cms-table-wrapper">
        {loading ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Loader2 size={22} className="spin" /> Loading pages...
          </div>
        ) : pages.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '15px', marginBottom: '14px' }}>No pages found in this view.</p>
            <Link to="/admin/pages/new" className="button button-primary">
              <Plus size={15} /> Create Your First Page
            </Link>
          </div>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={pages.length > 0 && selectedIds.length === pages.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Title</th>
                <th>Slug</th>
                <th>Template</th>
                <th>Order</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p._id} style={{ background: selectedIds.includes(p._id) ? "rgba(59, 130, 246, 0.05)" : undefined }}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>

                  {/* Title & Hover Actions */}
                  <td style={{ minWidth: '240px' }}>
                    <Link
                      to={`/admin/pages/edit/${p._id}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'block'
                      }}
                    >
                      {p.title}
                    </Link>

                    {/* WordPress Row Hover Actions */}
                    <div className="row-actions">
                      <Link to={`/admin/pages/edit/${p._id}`}>
                        <Edit size={12} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePage(p._id)}
                        disabled={actionLoading}
                        style={{ background: "none", border: "none", padding: 0, color: "var(--accent-primary)", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                        title="Duplicate this page as Draft"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <a
                        href={p.template === 'home' ? '/' : `/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ExternalLink size={12} /> View
                      </a>
                      {p.status === 'trash' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestorePage(p._id)}
                            style={{ color: 'var(--success)' }}
                          >
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrashPage(p._id, true)}
                            className="trash-action"
                          >
                            <Trash2 size={12} /> Delete Permanently
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTrashPage(p._id, false)}
                          className="trash-action"
                        >
                          <Trash2 size={12} /> Trash
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Slug */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    /{p.slug}
                  </td>

                  {/* Template */}
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                      {p.template || 'default'}
                    </span>
                  </td>

                  {/* Order */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {p.order || 0}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      {p.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* WordPress Table Footer */}
            <tfoot>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={pages.length > 0 && selectedIds.length === pages.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Title</th>
                <th>Slug</th>
                <th>Template</th>
                <th>Order</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* 5. Bottom Tablenav (Bulk Actions on Left, Pagination on Right) */}
      <div className="tablenav bottom">
        <div className="actions bulkactions">
          <select
            value={bulkActionBottom}
            onChange={(e) => setBulkActionBottom(e.target.value)}
          >
            <option value="">Bulk actions</option>
            {currentTab === 'trash' ? (
              <>
                <option value="restore">Restore</option>
                <option value="delete">Delete Permanently</option>
              </>
            ) : (
              <option value="trash">Move to Trash</option>
            )}
          </select>
          <button
            type="button"
            className="button"
            onClick={() => handleApplyBulkAction(bulkActionBottom)}
            disabled={actionLoading || !bulkActionBottom || selectedIds.length === 0}
          >
            Apply
          </button>
        </div>

        <div className="tablenav-pages">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>
    </div>
  );
};

export default PageList;
