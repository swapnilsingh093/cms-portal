import React from 'react';
import { X, ExternalLink, Film, CheckCircle } from 'lucide-react';

const VideoPlayerModal = ({ isOpen, onClose, video }) => {
  if (!isOpen || !video) return null;

  const videoSrc = video.videoUrl || (video.videoFile ? `/uploads/videos/${video.videoFile}` : '');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '820px', background: '#0d1322' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ background: '#111827' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Film size={18} color="var(--g-accent, #3b82f6)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Quick Preview: {video.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', background: '#090e18' }}>
          {videoSrc ? (
            <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000000', display: 'flex', justifyContent: 'center' }}>
              <video
                src={videoSrc}
                controls
                playsInline
                poster={video.poster || video.thumbnail}
                style={{ width: '100%', maxHeight: '480px', display: 'block' }}
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Film size={48} style={{ opacity: 0.3, marginBottom: '14px' }} />
              <p>No playable video source found for this video.</p>
            </div>
          )}

          {/* Video Metadata Summary */}
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: '#111827',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Slug: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{video.slug || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Category: </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {video.category?.name || 'Uncategorized'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Status: </span>
              <span className={`badge badge-${video.status}`}>{video.status}</span>
            </div>
            {video.views !== undefined && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Views: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{video.views}</strong>
              </div>
            )}
            {video.slug && (
              <div style={{ marginLeft: 'auto' }}>
                <a
                  href={`/video/${video.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--primary-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  <ExternalLink size={13} /> Open Public Page
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ background: '#111827', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="button button-neutral button-small">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
