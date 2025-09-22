// Helper utilities to build cache-friendly avatar URLs
// Appends a stable version parameter so the URL stays constant until the avatar is changed

/**
 * Returns a URL with ?v=timestamp appended for cache-busting when the image changes.
 * If the src is data URL or not HTTP(S), returns it unchanged.
 * @param {string|null|undefined} src
 * @param {string|number|Date|null|undefined} updatedAt - timestamp (Date or ms) indicating last avatar change
 * @returns {string|null}
 */
export function getVersionedAvatar(src, updatedAt) {
  if (!src) return src || null;
  // Don't touch base64/data URLs or relative asset imports
  if (src.startsWith('data:')) return src;

  // Build version value
  let v = '';
  try {
    if (updatedAt) {
      const ts = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
      if (!Number.isNaN(ts)) v = String(ts);
    }
  } catch (_) {}

  if (!v) return src; // no known timestamp, keep as-is

  // Append ?v= or &v=
  const hasQuery = src.includes('?');
  return `${src}${hasQuery ? '&' : '?'}v=${encodeURIComponent(v)}`;
}

/**
 * Convenience helper to build a versioned avatar URL from a user object
 * It tries avatarUpdatedAt first, then updatedAt.
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export function getUserAvatarUrl(user) {
  if (!user) return null;
  const src = user.avatar || null;
  const updatedAt = user.avatarUpdatedAt || user.updatedAt || null;
  return getVersionedAvatar(src, updatedAt);
}
