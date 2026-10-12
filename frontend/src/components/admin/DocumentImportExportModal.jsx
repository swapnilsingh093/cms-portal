import React, { useState, useRef } from 'react';
import { postAPI } from '../../services/api';
import { downloadBlob } from '../../utils/adminHelper';
import {
  FileText,
  Upload,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  FileUp,
  FileDown
} from 'lucide-react';

/**
 * Universal Modal for Importing & Exporting Stories (.docx & .pages)
 * Supports Windows (Word .docx) and macOS (Apple Pages .pages).
 */
const DocumentImportExportModal = ({
  isOpen,
  onClose,
  mode = 'import', // 'import' | 'export'
  postId = null,
  postData = null, // for raw export from editor before saving
  onImportSuccess = () => {},
  autoCreate = false, // true for PostList, false for PostEditor
  categories = []
}) => {
  const [activeTab, setActiveTab] = useState(mode); // 'import' | 'export'
  const [file, setFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [importStatus, setImportStatus] = useState('published');
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);
  const [exportFormat, setExportFormat] = useState('docx'); // 'docx' | 'pages'
  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f) => {
    setError('');
    setResultData(null);
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.docx' && ext !== '.pages') {
      setError('Unsupported format. Please upload a Microsoft Word (.docx) or Apple Pages (.pages) document.');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImportSubmit = async () => {
    if (!file) {
      setError('Please select a .docx or .pages document first.');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      setProgressMsg('Uploading document and processing structure...');

      const formData = new FormData();
      formData.append('document', file);
      if (autoCreate) {
        formData.append('autoCreate', 'true');
        formData.append('status', importStatus);
        if (selectedCategory) {
          formData.append('category', selectedCategory);
        }
      }

      const res = await postAPI.importDocument(formData);

      if (res.success) {
        setResultData(res.parsedData || res.post);
        setProgressMsg('Document successfully imported with all images preserved!');
        onImportSuccess(res.parsedData || res.post);
      } else {
        throw new Error(res.message || 'Failed to import document');
      }
    } catch (err) {
      console.error('Document import failed:', err);
      setError(err.response?.data?.message || err.message || 'Error processing document');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportDownload = async (formatToExport = exportFormat) => {
    try {
      setExporting(true);
      setError('');

      let blob;
      let filename = `story-${Date.now()}.${formatToExport}`;

      if (postId) {
        blob = await postAPI.exportDocument(postId, formatToExport);
        if (postData?.slug) {
          filename = `${postData.slug}.${formatToExport}`;
        }
      } else if (postData) {
        blob = await postAPI.exportRaw({
          title: postData.title || 'Untitled Story',
          content: postData.content || '',
          featuredImage: postData.featuredImage || '',
          categoryName: postData.categoryName || 'General',
          format: formatToExport
        });
        if (postData.title) {
          const safeSlug = postData.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          filename = `${safeSlug}.${formatToExport}`;
        }
      } else {
        throw new Error('No post specified for export');
      }

      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Document export failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate document export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #111827)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '580px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Document Import & Export
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                Cross-platform support for Mac (.pages) & Windows (.docx)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'import' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: 700,
              fontSize: '13px',
              borderBottom: activeTab === 'import' ? '2px solid var(--primary-color, #6366f1)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileUp size={15} /> Import Document (.pages / .docx)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'export' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: 700,
              fontSize: '13px',
              borderBottom: activeTab === 'export' ? '2px solid var(--primary-color, #6366f1)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileDown size={15} /> Export Post (.docx / .pages)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#fca5a5',
                fontSize: '12.5px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: IMPORT */}
          {activeTab === 'import' && (
            <div>
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(99, 102, 241, 0.35)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'rgba(99, 102, 241, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '16px'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pages,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/x-iwork-pages-sffpages"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8'
                  }}
                >
                  <Upload size={22} />
                </div>

                {file ? (
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drag another file to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                      Drag & Drop your Story Document or Click to Browse
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                      Supports <strong>Apple Pages (.pages)</strong> on Mac & <strong>Microsoft Word (.docx)</strong> on Windows/Mac
                    </p>
                  </div>
                )}
              </div>

              {/* Supported info badge */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                <span>
                  All embedded photographs and layout styles (headings, paragraphs, lists) are automatically preserved and saved into the Media Library.
                </span>
              </div>

              {/* Auto-create options if in list mode */}
              {autoCreate && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Category (Optional)
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        background: '#090e18',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        padding: '0 8px'
                      }}
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      Publish Status
                    </label>
                    <select
                      value={importStatus}
                      onChange={(e) => setImportStatus(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        background: '#090e18',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        padding: '0 8px'
                      }}
                    >
                      <option value="draft">Save as Draft</option>
                      <option value="published">Publish Immediately</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Results summary (after success) */}
              {resultData && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d1bf', fontWeight: 700, fontSize: '13px' }}>
                    <CheckCircle size={15} />
                    <span>Import Successful!</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                    <strong>Title:</strong> {resultData.title}
                  </div>
                  {resultData.extractedImages?.length > 0 && (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ImageIcon size={12} /> {resultData.extractedImages.length} images extracted & linked.
                    </div>
                  )}
                </div>
              )}

              {/* Action button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="button button-neutral button-small"
                  disabled={processing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!file || processing}
                  className="button button-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {processing ? (
                    <>
                      <Loader2 size={15} className="spin" /> Processing Document...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> {autoCreate ? 'Import & Create Post' : 'Import to Editor'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT */}
          {activeTab === 'export' && (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
                Export this post with all content, headings, author details, and embedded photos packaged directly into a native document file.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {/* DOCX Choice */}
                <div
                  onClick={() => setExportFormat('docx')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: exportFormat === 'docx' ? '2px solid var(--primary-color, #6366f1)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: exportFormat === 'docx' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                    Microsoft Word (.docx)
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Universal format. Opens on Windows (MS Word) and Mac (Pages & Word).
                  </div>
                </div>

                {/* PAGES Choice */}
                <div
                  onClick={() => setExportFormat('pages')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: exportFormat === 'pages' ? '2px solid var(--primary-color, #6366f1)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: exportFormat === 'pages' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                    Apple Pages (.pages)
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Native macOS Pages format. Opens seamlessly in Apple Pages on Mac.
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="button button-neutral button-small"
                  disabled={exporting}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleExportDownload()}
                  disabled={exporting}
                  className="button button-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {exporting ? (
                    <>
                      <Loader2 size={15} className="spin" /> Generating {exportFormat.toUpperCase()}...
                    </>
                  ) : (
                    <>
                      <Download size={15} /> Download as .{exportFormat}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentImportExportModal;
