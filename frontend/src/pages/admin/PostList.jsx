import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postAPI, categoryAPI } from '../../services/api';
import Pagination from '../../components/admin/Pagination';
import { generateDateOptions } from '../../utils/adminHelper';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  FileUp,
  FileDown,
  Download
} from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import DocumentImportExportModal from '../../components/admin/DocumentImportExportModal';

const PostList = () => {
  const [posts, setPosts] = useState([]);
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
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const { confirm, ConfirmDialog } = useConfirm();
  const activeRequestRef = useRef(0);

  // Document Import & Export States
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalMode, setDocModalMode] = useState('import');
  const [activeExportPost, setActiveExportPost] = useState(null);

  const [availableDates, setAvailableDates] = useState([]);
  const dateOptions = useMemo(() => {
    return availableDates.length > 0 ? availableDates : generateDateOptions();
  }, [availableDates]);

  // Load post categories for filter dropdown
  useEffect(() => {
    categoryAPI.getAll({ type: 'post' }).then(res => {
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
    if (selectedIds.length === posts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map(p => p._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDuplicatePost = async (id) => {
    setActionLoading(true);
    try {
      const res = await postAPI.duplicate(id);
      setMessage({ type: "success", text: res.message || "Post duplicated successfully as Draft!" });
      fetchPosts();
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
        ? `Are you sure you want to permanently delete ${selectedIds.length} selected post(s)? This action cannot be undone.`
        : `Are you sure you want to move ${selectedIds.length} selected post(s) to trash?`;

      const isConfirmed = await confirm({
        title: isPermanent ? 'Delete Permanently' : 'Move to Trash',
        message: confirmMsg,
        confirmText: isPermanent ? 'Delete' : 'Move to Trash',
      });
      if (!isConfirmed) return;

      setActionLoading(true);
      try {
        const res = await postAPI.bulkDelete(selectedIds, isPermanent);
        setMessage({ type: 'success', text: res.message || `${selectedIds.length} post(s) processed successfully.` });
        setSelectedIds([]);
        setBulkActionTop('');
        setBulkActionBottom('');
        fetchPosts();
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Bulk action failed' });
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'restore') {
      setActionLoading(true);
      try {
        await Promise.all(selectedIds.map(id => postAPI.restore(id)));
        setMessage({ type: 'success', text: `${selectedIds.length} post(s) restored successfully.` });
        setSelectedIds([]);
        setBulkActionTop('');
        setBulkActionBottom('');
        fetchPosts();
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
    fetchPosts();
  }, [currentTab, search, categoryFilter, dateFilter, currentPage, searchParams]);

  const fetchPosts = async () => {
    const reqId = ++activeRequestRef.current;
    setLoading(true);
    try {
      const authorParam = searchParams.get('author');
      const res = await postAPI.getAll({
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
      if (res.posts) setPosts(res.posts);
      if (res.statusCounts) setStatusCounts(res.statusCounts);
      if (res.pages !== undefined) setTotalPages(res.pages);
      if (res.total !== undefined) setTotalItems(res.total);
      if (res.availableDates) setAvailableDates(res.availableDates);
    } catch (err) {
      if (activeRequestRef.current !== reqId) return;
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error loading posts' });
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
    fetchPosts();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleTrashPost = async (id, isPermanent = false) => {
    const confirmText = isPermanent
      ? 'Are you sure you want to permanently delete this post?'
      : 'Move this post to trash?';

    const isConfirmed = await confirm({
      title: isPermanent ? 'Delete Permanently' : 'Move to Trash',
      message: confirmText,
      confirmText: isPermanent ? 'Delete' : 'Move to Trash',
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      if (isPermanent) {
        await postAPI.delete(id);
      } else {
        await postAPI.update(id, { status: 'trash' });
      }
      setMessage({ type: 'success', text: isPermanent ? 'Post permanently deleted.' : 'Post moved to trash.' });
      fetchPosts();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestorePost = async (id) => {
    setActionLoading(true);
    try {
      await postAPI.restore(id);
      setMessage({ type: 'success', text: 'Post restored to Published.' });
      fetchPosts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <ConfirmDialog />

      {/* 1. Header Bar: Title + Add New Post + Import Document */}
      <div className="wp-header-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Posts</h1>
        <Link to="/admin/posts/new" className="page-title-action button button-secondary">
          <Plus size={14} /> Add New Post
        </Link>
        <button
          type="button"
          onClick={() => {
            setActiveExportPost(null);
            setDocModalMode('import');
            setDocModalOpen(true);
          }}
          className="button button-neutral button-small"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title="Import stories from Apple Pages (.pages) or Microsoft Word (.docx)"
        >
          <FileUp size={14} color="#818cf8" /> Import Document
        </button>
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
            Search Posts
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
            <Loader2 size={22} className="spin" /> Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '15px', marginBottom: '14px' }}>No posts found in this view.</p>
            <Link to="/admin/posts/new" className="button button-primary">
              <Plus size={15} /> Write Your First Post
            </Link>
          </div>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={posts.length > 0 && selectedIds.length === posts.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ width: "54px" }}>Image</th>
                <th>Title</th>
                <th style={{ width: "180px", minWidth: "130px", maxWidth: "240px" }}>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} style={{ background: selectedIds.includes(post._id) ? "rgba(59, 130, 246, 0.05)" : undefined }}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(post._id)}
                      onChange={() => toggleSelect(post._id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>

                  {/* Thumbnail */}
                  <td>
                    <div
                      style={{
                        width: '46px',
                        height: '34px',
                        borderRadius: '4px',
                        background: '#090e18',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageIcon size={16} color="var(--text-dim)" />
                      )}
                    </div>
                  </td>

                  {/* Title & Hover Actions */}
                  <td style={{ minWidth: '240px' }}>
                    <Link
                      to={`/admin/posts/edit/${post._id}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'block'
                      }}
                    >
                      {post.title}
                    </Link>

                    {/* WordPress Row Hover Actions */}
                    <div className="row-actions">
                      <Link to={`/admin/posts/edit/${post._id}`}>
                        <Edit size={12} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePost(post._id)}
                        disabled={actionLoading}
                        style={{ background: "none", border: "none", padding: 0, color: "var(--accent-primary)", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                        title="Duplicate this post as Draft"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveExportPost(post);
                          setDocModalMode('export');
                          setDocModalOpen(true);
                        }}
                        style={{ background: "none", border: "none", padding: 0, color: "#34d399", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                        title="Export post as .docx (Word) or .pages (Apple Pages)"
                      >
                        <Download size={12} /> Export
                      </button>
                      <a
                        href={`/post/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ExternalLink size={12} /> View
                      </a>
                      {post.status === 'trash' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestorePost(post._id)}
                            style={{ color: 'var(--success)' }}
                          >
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrashPost(post._id, true)}
                            className="trash-action"
                          >
                            <Trash2 size={12} /> Delete Permanently
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTrashPost(post._id, false)}
                          className="trash-action"
                        >
                          <Trash2 size={12} /> Trash
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Category */}
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

                      // Add only categories that are actually assigned to this post
                      if (post.category && typeof post.category === 'object') add(post.category);
                      if (post.subCategory && typeof post.subCategory === 'object') add(post.subCategory);
                      if (post.childCategory && typeof post.childCategory === 'object') add(post.childCategory);
                      if (Array.isArray(post.categories)) {
                        post.categories.forEach((c) => {
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
                                to={`/admin/posts?category=${cat._id}`}
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

                  {/* Author */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {post.author?.name || 'Admin'}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge badge-${post.status}`}>
                      {post.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
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
                    checked={posts.length > 0 && selectedIds.length === posts.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
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

      {/* Document Import & Export Modal */}
      {docModalOpen && (
        <DocumentImportExportModal
          isOpen={docModalOpen}
          onClose={() => {
            setDocModalOpen(false);
            setActiveExportPost(null);
          }}
          mode={docModalMode}
          postId={activeExportPost?._id}
          postData={activeExportPost}
          onImportSuccess={() => {
            fetchPosts();
            setMessage({ type: 'success', text: 'Document imported successfully as post!' });
          }}
          autoCreate={true}
          categories={categoriesList}
        />
      )}
    </div>
  );
};

export default PostList;
