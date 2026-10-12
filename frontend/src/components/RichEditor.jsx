import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Upload } from 'lucide-react';
import MediaPickerModal from './admin/MediaPickerModal';

const RichEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const handleMediaSelect = (mediaItem) => {
    setIsMediaPickerOpen(false);
    if (!mediaItem || !mediaItem.url) return;

    let htmlToInsert = '';
    const finalUrl = mediaItem.url.startsWith('http') ? mediaItem.url : (mediaItem.url.startsWith('/') ? mediaItem.url : '/' + mediaItem.url);
    if (mediaItem.type === 'video') {
      htmlToInsert = `<video src="${finalUrl}" controls style="max-width: 100%; border-radius: 8px; margin: 18px 0;"></video><p><br></p>`;
    } else {
      htmlToInsert = `<img src="${finalUrl}" alt="${mediaItem.originalName || 'Image'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 18px 0;" /><p><br></p>`;
    }

    if (editorRef.current) {
      editorRef.current.insertContent(htmlToInsert);
    } else {
      onChange((value || '') + htmlToInsert);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Custom Add Media Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={() => setIsMediaPickerOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary-color, #3b82f6)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.8)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
        >
          <Upload size={14} /> Add Media from Library
        </button>
      </div>

      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color, #22324f)' }}>
        <Editor
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          onInit={(evt, editor) => editorRef.current = editor}
          value={value}
          onEditorChange={(content) => onChange(content)}
          init={{
            license_key: 'gpl',
            convert_urls: false,
            relative_urls: false,
            remove_script_host: true,
            height: 450,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | code help',
            content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:16px; background-color: #0c111c; color: #e2e8f0; } p { margin-bottom: 1em; } h2, h3 { color: #f8fafc; }',
            skin: 'oxide-dark',
            content_css: 'dark',
            promotion: false, // hide upgrade banner
            branding: false
          }}
        />
      </div>

      {isMediaPickerOpen && (
        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          title="Add Media to Content"
          allowedType="any"
        />
      )}
    </div>
  );
};

export default RichEditor;
