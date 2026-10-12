import React, { useState, useEffect } from 'react';
import { postAPI, categoryAPI } from '../../services/api';
import RichEditor from '../../components/RichEditor';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  FileText
} from 'lucide-react';

const PostManager = ({ initialAction = 'list' }) => {
  const [viewMode, setViewMode] = useState(initialAction === 'new' ? 'edit' : 'list');
  const [editingPost, setEditingPost] = useState(null);

  // Status Filter Tabs
  const [currentTab, setCurrentTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, published: 0, draft: 0, trash: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Post Categories
  const [postCategories, setPostCategories] = useState([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await postAPI.getAll({
        status: currentTab,
        search
      });
      if (res.posts) setPosts(res.posts);
      if (res.statusCounts) setStatusCounts(res.statusCounts);
    } catch (err) {
      setError(err.message || 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll({ type: 'post', strict: 'false' });
      if (res.categories) setPostCategories(res.categories);
    } catch (e) {
      console.error('Error fetching post categories:', e.message);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentTab, search]);

  useEffect(() => {
    if (initialAction === 'new') {
      openAddForm();
    }
  }, [initialAction]);

  const openAddForm = () => {
    setEditingPost(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setStatus('published');
    setTags('');
    setFeaturedImageUrl('');
    setFeaturedImageFile(null);
    setError('');
    setSuccess('');
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditForm = (p) => {
    setEditingPost(p);
    setTitle(p.title || '');
    setExcerpt(p.excerpt || '');
    setContent(p.content || '');
    setSelectedCategory(p.category?._id || p.category || '');
    setSelectedSubCategory(p.subCategory?._id || p.subCategory || '');
    setStatus(p.status || 'published');
    setTags(p.tags ? p.tags.join(', ') : '');
    setFeaturedImageUrl(p.featuredImage || '');
    setFeaturedImageFile(null);
    setError('');
    setSuccess('');
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeaturedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImageFile(file);
      setFeaturedImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (submitStatus) => {
    if (!title.trim()) {
      setError('Please enter a post title');
      return;
    }
    if (!content.trim()) {
      setError('Please enter post content');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('excerpt', excerpt);
      formData.append('content', content);
      formData.append('status', submitStatus || status);
      if (selectedCategory) formData.append('category', selectedCategory);
      if (selectedSubCategory) formData.append('subCategory', selectedSubCategory);
      if (tags) formData.append('tags', tags);

      if (featuredImageFile) {
        formData.append('featuredImage', featuredImageFile);
      } else if (featuredImageUrl && !featuredImageUrl.startsWith('blob:')) {
        formData.append('featuredImage', featuredImageUrl);
      }

      if (editingPost) {
        await postAPI.update(editingPost._id, formData);
        setSuccess(`Post "${title}" updated successfully!`);
      } else {
        await postAPI.create(formData);
        setSuccess(`Post "${title}" published successfully!`);
      }

      setViewMode('list');
      fetchPosts();
    } catch (err) {
      setError(err.message || 'Error saving post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrashPost = async (id, postTitle) => {
    if (window.confirm(`Move "${postTitle}" to trash?`)) {
      try {
        await postAPI.delete(id, false);
        setSuccess('Post moved to trash.');
        fetchPosts();
      } catch (err) {
        setError(err.message || 'Error trashing post');
      }
    }
  };

  const handleRestorePost = async (id) => {
    try {
      await postAPI.restore(id);
      setSuccess('Post restored to Drafts.');
      fetchPosts();
    } catch (err) {
      setError(err.message || 'Error restoring post');
    }
  };

  const handlePermanentDelete = async (id, postTitle) => {
    if (window.confirm(`Permanently delete "${postTitle}"? This cannot be undone.`)) {
      try {
        await postAPI.delete(id, true);
        setSuccess('Post permanently deleted.');
        fetchPosts();
      } catch (err) {
        setError(err.message || 'Error deleting post');
      }
    }
  };

  const rootCats = postCategories.filter((c) => !c.parentCategory);
  const availableSubCats = selectedCategory
    ? postCategories.filter(
        (c) =>
          c.parentCategory &&
          (c.parentCategory._id === selectedCategory || c.parentCategory === selectedCategory)
      )
    : [];

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Notifications */}
      {error && (
        <div
          style={{
            background: '#fcf0f1',
            borderLeft: '4px solid #d63638',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#2c3338'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: '#edf7ed',
            borderLeft: '4px solid #007017',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#1e4620'
          }}
        >
          {success}
        </div>
      )}

      {/* ====================================================================
          MODE 1: ALL POSTS LIST TABLE
          ==================================================================== */}
      {viewMode === 'list' && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1d2327', margin: 0 }}>
                Posts
              </h1>
              <button onClick={openAddForm} className="button button-primary">
                <Plus size={14} /> Add New Post
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search Posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '5px 10px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* WordPress Subsubsub Filter Tabs */}
          <ul className="subsubsub">
            <li>
              <button
                className={currentTab === 'all' ? 'current' : ''}
                onClick={() => setCurrentTab('all')}
              >
                All <span className="count">({statusCounts.all})</span>
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'published' ? 'current' : ''}
                onClick={() => setCurrentTab('published')}
              >
                Published <span className="count">({statusCounts.published})</span>
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'draft' ? 'current' : ''}
                onClick={() => setCurrentTab('draft')}
              >
                Drafts <span className="count">({statusCounts.draft})</span>
              </button>
            </li>
            {statusCounts.trash > 0 && (
              <li>
                <button
                  className={currentTab === 'trash' ? 'current' : ''}
                  onClick={() => setCurrentTab('trash')}
                >
                  Trash <span className="count">({statusCounts.trash})</span>
                </button>
              </li>
            )}
          </ul>

          {/* Posts Table */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '4px', color: '#646970' }}>
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '4px', color: '#646970' }}>
              No posts found. <button onClick={openAddForm} className="button button-primary" style={{ marginLeft: '10px' }}>Write a Post</button>
            </div>
          ) : (
            <table className="wp-list-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Image</th>
                  <th>Title</th>
                  <th>Categories</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <div
                        style={{
                          width: '54px',
                          height: '40px',
                          borderRadius: '3px',
                          background: '#f3f4f6',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FileText size={16} color="#9ca3af" />
                        )}
                      </div>
                    </td>

                    <td>
                      <strong
                        style={{ fontSize: '14px', color: '#2271b1', cursor: 'pointer' }}
                        onClick={() => openEditForm(post)}
                      >
                        {post.title}
                      </strong>

                      <div className="row-actions">
                        {post.status !== 'trash' ? (
                          <>
                            <button onClick={() => openEditForm(post)}>Edit</button>
                            <span>|</span>
                            <button
                              onClick={() => handleTrashPost(post._id, post.title)}
                              className="trash"
                            >
                              Trash
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleRestorePost(post._id)}>
                              Restore
                            </button>
                            <span>|</span>
                            <button
                              onClick={() => handlePermanentDelete(post._id, post.title)}
                              className="trash"
                            >
                              Delete Permanently
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    <td>
                      {(() => {
                        const cats = [];
                        const seen = new Set();
                        const add = (c) => {
                          if (c && c.name && !seen.has(c.name)) {
                            seen.add(c.name);
                            cats.push(c.name);
                          }
                        };
                        if (post.category) add(post.category);
                        if (post.subCategory) add(post.subCategory);
                        if (post.childCategory) add(post.childCategory);
                        if (Array.isArray(post.categories)) {
                          post.categories.forEach(c => {
                            if (c) add(c);
                          });
                        }
                        if (cats.length === 0) return <span style={{ color: '#8c8f94' }}>—</span>;
                        return (
                          <span style={{ fontWeight: 600 }}>
                            {cats.join(', ')}
                          </span>
                        );
                      })()}
                    </td>

                    <td>{post.author?.name || 'Admin'}</td>
                    <td>{post.views || 0}</td>

                    <td>
                      <span className={`status-badge ${post.status}`}>
                        {post.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '12px', color: '#646970' }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEditForm(post)}
                        className="button button-neutral button-small"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ====================================================================
          MODE 2: 2-COLUMN CLASSIC EDITOR (Add / Edit Post)
          ==================================================================== */}
      {viewMode === 'edit' && (
        <div>
          {/* Top Bar with Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setViewMode('list')}
                className="button button-neutral"
              >
                ← Back to All Posts
              </button>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1d2327', margin: 0 }}>
                {editingPost ? `Edit Post: ${editingPost.title}` : 'Add New Post'}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                className="button button-secondary"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                disabled={submitting}
                className="button button-primary"
              >
                {submitting ? 'Publishing...' : editingPost ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </div>

          <div className="wp-editor-wrap">
            {/* LEFT MAIN COLUMN: Title, Content Editor, Excerpt */}
            <div className="wp-editor-main">
              <input
                type="text"
                className="wp-title-input"
                placeholder="Add title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* CONTENT WYSIWYG / RICH TEXT METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Post Content (Rich Text / HTML)</h3>
                </div>
                <div className="postbox-body" style={{ padding: '8px' }}>
                  <RichEditor value={content} onChange={setContent} />
                </div>
              </div>

              {/* EXCERPT METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Excerpt</h3>
                </div>
                <div className="postbox-body">
                  <textarea
                    className="form-textarea"
                    placeholder="Write an excerpt (optional short summary of the post)..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* TAGS METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Tags</h3>
                </div>
                <div className="postbox-body">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Separate tags with commas"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN: Publish, Categories, Featured Image */}
            <div className="wp-editor-sidebar">
              {/* PUBLISH METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Publish</h3>
                </div>
                <div className="postbox-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#646970' }}>Status:</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="form-select"
                        style={{ width: '130px', padding: '4px 8px' }}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="trash">Trash</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#646970' }}>Visibility:</span>
                      <strong>Public</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #dcdcde',
                      marginTop: '16px',
                      paddingTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {editingPost ? (
                      <button
                        type="button"
                        onClick={() => handleTrashPost(editingPost._id, editingPost.title)}
                        className="button-link-delete"
                      >
                        Move to Trash
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => handleSubmit(status)}
                      disabled={submitting}
                      className="button button-primary"
                    >
                      {submitting ? 'Saving...' : editingPost ? 'Update' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>

              {/* POST CATEGORIES METABOX (Independent from Videos & Galleries) */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Post Categories</h3>
                </div>
                <div className="postbox-body">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Parent Category</label>
                    <select
                      className="form-select"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubCategory('');
                      }}
                    >
                      <option value="">— Select Category —</option>
                      {rootCats.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {availableSubCats.length > 0 && (
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Subcategory</label>
                      <select
                        className="form-select"
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                      >
                        <option value="">— None (Top-Level Only) —</option>
                        {availableSubCats.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            ↳ {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* FEATURED IMAGE METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Featured Image</h3>
                </div>
                <div className="postbox-body">
                  {featuredImageUrl ? (
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '140px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid #c3c4c7',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={featuredImageUrl}
                          alt="Featured Image Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturedImageUrl('');
                            setFeaturedImageFile(null);
                          }}
                          className="button-link-delete"
                          style={{ fontSize: '12px' }}
                        >
                          Remove Featured Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '16px',
                        background: '#f9fafb',
                        border: '1px dashed #c3c4c7',
                        borderRadius: '4px',
                        textAlign: 'center',
                        color: '#646970',
                        fontSize: '12px',
                        marginBottom: '12px'
                      }}
                    >
                      If no image is uploaded, the system will automatically use the first image from your content.
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedImageChange}
                    className="form-input"
                    style={{ padding: '4px', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{confirmModal.title}</h3>
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              {confirmModal.message}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
              <button
                className="button button-neutral"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                className={`button ${confirmModal.isDanger ? 'button-danger' : 'button-primary'}`}
                onClick={confirmModal.onConfirm}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManager;
