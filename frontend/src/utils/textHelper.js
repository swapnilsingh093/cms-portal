/**
 * Strips HTML tags and decodes common HTML entities, converting rich-text HTML
 * into clean, plain-text strings suitable for excerpts, cards, titles, and previews.
 *
 * @param {string} html - Raw HTML string or plain text
 * @returns {string} - Clean text with zero HTML tags
 */
export const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return '';

  return html
    // Replace breaks and block closures with spaces to avoid adjacent words merging
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|td|blockquote|section|article)>/gi, ' ')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    // Normalize multiple spaces into single space
    .replace(/\s+/g, ' ')
    .trim();
};
