import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Pagination from '../../components/admin/Pagination';
import { videoAPI, categoryAPI } from '../../services/api';
import { useConfirm } from '../../hooks/useConfirm';
import VideoPlayerModal from '../../components/admin/VideoPlayerModal';
import { generateDateOptions } from '../../utils/adminHelper';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Film,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, published: 0, draft: 0, trash: 0 });
  const [currentTab, setCurrentTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || searchParams.get('subCategory') || '';
  const urlDate = searchParams.get('month') || searchParams.get('date') || '';
  const [dateFilter, setDateFilter] = useState(urlDate);
  const [categoryFilter, setCategoryFilter] = useState(urlCategory);
  const [categoriesList, setCategoriesList] = useState([]);
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
  const activeRequestRef = useRef(0);

  // Quick Preview State
  const [previewVideo, setPreviewVideo] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [availableDates, setAvailableDates] = useState([]);
  const dateOptions = useMemo(() => {
    return availableDates.length > 0 ? availableDates : generateDateOptions();
  }, [availableDates]);

  // Fetch video categories for filter dropdown
  useEffect(() => {
    categoryAPI.getAll({ type: 'video' }).then(res => {
      if (res?.categories) {
        setCategoriesList(res.categories);
      }
    }).catch(() => {});
  }, []);

  // Sync state if URL query params change (e.g. clicking category count link or back/forward)
  useEffect(() => {
    const currentCat = searchParams.get('category') || searchParams.get('subCategory') || '';
    const currentDate = searchParams.get('month') || searchParams.get('date') || '';
    setCategoryFilter(currentCat);
    setDateFilter(currentDate);
  }, [searchParams]);

  // Hierarchical list for WordPress-style dropdown
  const formattedCategories = useMemo(() => {
    const roots = categoriesList.filter(c => !c.parentCategory);
    const result = [];
    roots.forEach(root => {
      result.push({ _id: root._id, name: root.name });
      const children = categoriesList.filter(c =>
        c.parentCategory && (c.parentCategory._id === root._id || c.parentCategory === root._id)
      );
      children.forEach(sub => {
        result.push({ _id: sub._id, name: `— ${sub.name}` });
      });
    });
    categoriesList.forEach(c => {
      if (!result.find(r => r._id === c._id)) {
        result.push({ _id: c._id, name: c.name });
      }
    });
    return result;
  }, [categoriesList]);

  const toggleSelectAll = () => {
    if (selectedIds.length === videos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map(v => v._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDuplicateVideo = async (id) => {
    setActionLoading(true);
    try {
      const res = await videoAPI.duplicate(id);
      setMessage({ type: "success", text: res.message || "Video duplicated successfully as Draft!" });
      fetchVideos();
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
        ? `Are you sure you want to permanently delete ${selectedIds.length} selected video(s)? This action cannot be undone.`
        : `Are you sure you want to move ${selectedIds.length} selected video(s) to trash?`;

      const isConfirmed = await confirm({
        title: isPermanent ? 'Delete Permanently' : 'Move to Trash',
        message: confirmMsg,
        confirmText: isPermanent ? 'Delete' : 'Move to Trash',
      });
      if (!isConfirmed) return;

      setActionLoading(true);
      try {
        const res = await videoAPI.bulkDelete(selectedIds, isPermanent);
        setMessage({ type: 'success', text: res.message || `${selectedIds.length} video(s) processed successfully.` });
        setSelectedIds([]);
        setBulkActionTop('');
        setBulkActionBottom('');
        fetchVideos();
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Bulk delete failed' });
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'restore') {
      setActionLoading(true);
      try {
        await Promise.all(selectedIds.map(id => videoAPI.restore(id)));
        setMessage({ type: 'success', text: `${selectedIds.length} video(s) restored successfully.` });
        setSelectedIds([]);
        setBulkActionTop('');
        setBulkActionBottom('');
        fetchVideos();
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Restore failed' });
      } finally {
        setActionLoading(false);
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, search, categoryFilter, dateFilter]);

  useEffect(() => {
    fetchVideos();
  }, [currentTab, search, categoryFilter, dateFilter, currentPage, searchParams]);

  const fetchVideos = async () => {
    const reqId = ++activeRequestRef.current;
    setLoading(true);
    try {
      const authorParam = searchParams.get('author');
      const res = await videoAPI.getAll({
        status: currentTab,
        search: search || undefined,
        category: categoryFilter || undefined,
        month: dateFilter || undefined,
        author: authorParam || undefined,
        isAdmin: 'true',
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      if (activeRequestRef.current !== reqId) return;
      if (res.videos) setVideos(res.videos);
      if (res.statusCounts) setStatusCounts(res.statusCounts);
      if (res.pagination?.pages !== undefined) setTotalPages(res.pagination.pages);
      else if (res.pages !== undefined) setTotalPages(res.pages);
      if (res.pagination?.total !== undefined) setTotalItems(res.pagination.total);
      else if (res.total !== undefined) setTotalItems(res.total);
      if (res.availableDates) setAvailableDates(res.availableDates);
    } catch (err) {
      if (activeRequestRef.current !== reqId) return;
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error loading videos' });
    } finally {
      if (activeRequestRef.current === reqId) {
        setLoading(false);
      }
    }
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    const newParams = new URLSearchParams();
    if (categoryFilter) {
      newParams.set('category', categoryFilter);
    }
    if (dateFilter) {
      newParams.set('month', dateFilter);
    }
    setSearchParams(newParams);
    fetchVideos();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleTrashVideo = async (id, isPermanent = false) => {
    const confirmText = isPermanent
      ? 'Are you sure you want to permanently delete this video? This cannot be undone.'
      : 'Move this video to trash?';

    const isConfirmed = await confirm({
      title: isPermanent ? 'Delete Permanently' : 'Move to Trash',
      message: confirmText,
      confirmText: isPermanent ? 'Delete' : 'Move to Trash',
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      if (isPermanent) {
        await videoAPI.delete(id);
      } else {
        await videoAPI.update(id, { status: 'trash' });
      }
      setMessage({ type: 'success', text: isPermanent ? 'Video permanently deleted.' : 'Video moved to trash.' });
      fetchVideos();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreVideo = async (id) => {
    setActionLoading(true);
    try {
      await videoAPI.restore(id);
      setMessage({ type: 'success', text: 'Video restored to Published.' });
      fetchVideos();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPreview = (video) => {
    setPreviewVideo(video);
    setPreviewOpen(true);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <ConfirmDialog />

      {/* 1. Header Bar: Title + Add New Video */}
      <div className="wp-header-row">
        <h1>Videos</h1>
        <Link to="/admin/videos/new" className="page-title-action button button-secondary">
          <Plus size={14} /> Add New Video
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

      {/* 2. WordPress Subsubsub Views & Search Box (Row 1 - Screenshot 1) */}
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

        {/* Top Right Search Box (Exact match to Screenshot 1 "Search Video") */}
        <form className="wp-search-box" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder=""
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-submit button">
            Search Video
          </button>
        </form>
      </div>

      {/* 3. Top Tablenav (Bulk Actions + Filters on Left, Pagination on Right - Screenshot 1) */}
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

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {formattedCategories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <button
            type="button"
            className="button"
            onClick={handleApplyFilter}
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

      {/* 4. Table (Matches columns from Screenshot 1: Title, Author, Tags, Video/Category, Date) */}
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
            <Loader2 size={22} className="spin" /> Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '15px', marginBottom: '14px' }}>No videos found in this view.</p>
            <Link to="/admin/videos/new" className="button button-primary">
              <Plus size={15} /> Upload Your First Video
            </Link>
          </div>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={videos.length > 0 && selectedIds.length === videos.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ width: "54px" }}>Poster</th>
                <th>Title</th>
                <th>Author</th>
                <th>Tags</th>
                <th style={{ width: "180px", minWidth: "130px", maxWidth: "240px" }}>Categories</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((vid) => (
                <tr key={vid._id} style={{ background: selectedIds.includes(vid._id) ? "rgba(59, 130, 246, 0.05)" : undefined }}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(vid._id)}
                      onChange={() => toggleSelect(vid._id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>

                  {/* Poster / Play Overlay */}
                  <td>
                    <div
                      onClick={() => handleOpenPreview(vid)}
                      style={{
                        position: 'relative',
                        width: '50px',
                        height: '36px',
                        borderRadius: '4px',
                        background: '#090e18',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Click for Quick Preview"
                    >
                      {vid.poster || vid.thumbnail ? (
                        <img
                          src={vid.poster || vid.thumbnail}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Film size={18} color="var(--primary-color)" />
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0, 0, 0, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Play size={12} fill="#ffffff" color="#ffffff" />
                      </div>
                    </div>
                  </td>

                  {/* Title & Hover Actions */}
                  <td style={{ minWidth: '240px' }}>
                    <Link
                      to={`/admin/videos/edit/${vid._id}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'block'
                      }}
                    >
                      {vid.title}
                    </Link>

                    {/* WordPress Row Hover Actions */}
                    <div className="row-actions">
                      <Link to={`/admin/videos/edit/${vid._id}`}>
                        <Edit size={12} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicateVideo(vid._id)}
                        disabled={actionLoading}
                        style={{ background: "none", border: "none", padding: 0, color: "var(--accent-primary)", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                        title="Duplicate this video as Draft"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(vid)}
                        style={{ background: "none", border: "none", padding: 0, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "pointer", fontSize: "12px" }}
                      >
                        <Play size={12} /> Preview
                      </button>
                      {vid.status === 'trash' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestoreVideo(vid._id)}
                            style={{ color: 'var(--success)' }}
                          >
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrashVideo(vid._id, true)}
                            className="trash-action"
                          >
                            <Trash2 size={12} /> Delete Permanently
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTrashVideo(vid._id, false)}
                          className="trash-action"
                        >
                          <Trash2 size={12} /> Trash
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Author */}
                  <td style={{ color: 'var(--primary-color)', fontSize: '13px' }}>
                    {vid.uploadedBy?.name || 'admin'}
                  </td>

                  {/* Tags */}
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                    {Array.isArray(vid.tags) && vid.tags.length > 0 ? (
                      vid.tags.slice(0, 3).join(', ') + (vid.tags.length > 3 ? '...' : '')
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Video Category */}
                  <td
                    style={{
                      fontSize: '13px',
                      maxWidth: '240px',
                      minWidth: '130px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.45',
                      verticalAlign: 'middle'
                    }}
                  >
                    {(() => {
                      const cats = [];
                      const seen = new Set();
                      const add = (c) => {
                        if (c && c.name && !seen.has(c.name)) {
                          seen.add(c.name);
                          cats.push(c);
                        }
                      };

                      // Add only categories that are actually assigned to this video
                      if (vid.category && typeof vid.category === 'object') add(vid.category);
                      if (vid.subCategory && typeof vid.subCategory === 'object') add(vid.subCategory);
                      if (vid.childCategory && typeof vid.childCategory === 'object') add(vid.childCategory);
                      if (Array.isArray(vid.categories)) {
                        vid.categories.forEach((c) => {
                          if (c && typeof c === 'object') add(c);
                        });
                      }

                      if (cats.length === 0) {
                        return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                      }

                      return (
                        <span>
                          {cats.map((cat, idx) => (
                            <React.Fragment key={cat._id || idx}>
                              {idx > 0 && <span style={{ color: 'var(--text-muted)' }}>, </span>}
                              <Link
                                to={`/admin/videos?category=${cat._id}`}
                                style={{
                                  color: 'var(--accent-primary, #60a5fa)',
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {cat.name}
                              </Link>
                            </React.Fragment>
                          ))}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge badge-${vid.status}`}>
                      {vid.status}
                    </span>
                  </td>

                  {/* Date (Formatted like Screenshot 1) */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {vid.status === 'published' ? 'Published' : 'Last Modified'}
                    </div>
                    <div>
                      {new Date(vid.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })} at {new Date(vid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
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
                    checked={videos.length > 0 && selectedIds.length === videos.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Poster</th>
                <th>Title</th>
                <th>Author</th>
                <th>Tags</th>
                <th>Categories</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* 5. Bottom Tablenav (Bulk Actions on Left, Pagination on Right - Screenshot 1) */}
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

      {/* Video Quick Preview Modal */}
      <VideoPlayerModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        video={previewVideo}
      />
    </div>
  );
};

export default VideoList;
