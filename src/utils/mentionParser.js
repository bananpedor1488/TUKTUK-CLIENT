/**
 * Username Mention Parser
 * Handles @username mentions in messages
 */

/**
 * Parse text for @username mentions
 * @param {string} text - The text to parse
 * @returns {Array} Array of mention objects with type, content, and username
 */
export const parseMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      type: 'mention',
      content: match[0], // @username
      username: match[1], // username without @
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return mentions;
};

/**
 * Convert text with mentions to JSX elements
 * @param {string} text - The text to convert
 * @param {Function} onMentionClick - Callback for mention clicks
 * @param {string} currentUsername - Current user's username
 * @param {Object} styles - CSS modules styles object
 * @returns {Array} Array of JSX elements
 */
export const renderMentions = (text, onMentionClick, currentUsername, styles) => {
  if (!text) return text;
  
  const mentions = parseMentions(text);
  if (mentions.length === 0) return text;
  
  const elements = [];
  let lastIndex = 0;
  
  mentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.start > lastIndex) {
      elements.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, mention.start)}
        </span>
      );
    }
    
    // Add mention element
    const isOwnMention = mention.username === currentUsername;
    elements.push(
      <span
        key={`mention-${index}`}
        className={`${styles.mention} ${isOwnMention ? styles['own-mention'] : styles['other-mention']}`}
        onClick={() => onMentionClick(mention.username, isOwnMention)}
        title={isOwnMention ? 'Перейти в избранные' : `Перейти к @${mention.username}`}
      >
        {mention.content}
      </span>
    );
    
    lastIndex = mention.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-end`}>
        {text.slice(lastIndex)}
      </span>
    );
  }
  
  return elements;
};

/**
 * Check if text contains mentions
 * @param {string} text - The text to check
 * @returns {boolean} True if text contains mentions
 */
export const hasMentions = (text) => {
  if (!text) return false;
  return /@[a-zA-Z0-9_]+/.test(text);
};

/**
 * Extract all usernames from text
 * @param {string} text - The text to extract from
 * @returns {Array} Array of usernames (without @)
 */
export const extractUsernames = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const usernames = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    usernames.push(match[1]);
  }
  
  return [...new Set(usernames)]; // Remove duplicates
};

/**
 * Highlight mentions in text for display
 * @param {string} text - The text to highlight
 * @param {string} currentUsername - Current user's username
 * @returns {string} HTML string with highlighted mentions
 */
export const highlightMentions = (text, currentUsername) => {
  if (!text) return text;
  
  return text.replace(/@([a-zA-Z0-9_]+)/g, (match, username) => {
    const isOwnMention = username === currentUsername;
    const className = isOwnMention ? 'own-mention' : 'other-mention';
    return `<span class="${className}">${match}</span>`;
  });
};

export default {
  parseMentions,
  renderMentions,
  hasMentions,
  extractUsernames,
  highlightMentions
};
