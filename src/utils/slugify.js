// src/util/slugify.js
export function slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      // First, remove markdown link syntax like [text](url) before slugifying
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars (keeps letters, numbers, underscore, hyphen)
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  }
  
  // Helper to extract text content from React nodes (needed for h2 slugs)
  // This is a simplified version; complex nested elements might need a more robust solution.
  // Kept it here for collocation with slugify if preferred, or move to BlogBody.
  export function getNodeText(node) {
      if (typeof node === 'string') {
          return node;
      }
      if (typeof node === 'number') {
          return String(node);
      }
      if (Array.isArray(node)) {
          return node.map(getNodeText).join('');
      }
      if (typeof node === 'object' && node !== null && node.props && node.props.children) {
          // Check if props exist before accessing children
          return getNodeText(node.props.children);
      }
      return '';
  }