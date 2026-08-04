/**
 * Extracts the YouTube Video ID from various YouTube URL formats.
 * Supported formats:
 * - https://youtu.be/xxxx
 * - https://youtube.com/watch?v=xxxx
 * - https://www.youtube.com/embed/xxxx
 * - https://youtube.com/v/xxxx
 *
 * @param url The YouTube URL
 * @returns The 11-character Video ID or null if invalid
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Clean the URL (remove surrounding whitespace)
  const cleanUrl = url.trim();

  // Regular expression to match standard YouTube video IDs
  // YouTube video IDs are 11 characters long and consist of [a-zA-Z0-9_-]
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  
  const match = cleanUrl.match(regExp);
  
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  
  // Direct ID input support (if the user just pastes the 11 char ID)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  
  return null;
}

/**
 * Validates whether a given string is a valid YouTube URL or ID.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
