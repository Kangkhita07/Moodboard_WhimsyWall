/**
 * Utility functions for form validation
 */

export const validation = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate image URL
   */
  isValidImageUrl: (url: string): boolean => {
    if (!validation.isValidUrl(url)) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  },

  /**
   * Validate hex color
   */
  isValidHexColor: (color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  },

  /**
   * Validate moodboard item
   */
  isValidMoodboardItem: (item: any): boolean => {
    return (
      item.title &&
      typeof item.title === 'string' &&
      item.category &&
      ['image', 'color', 'texture', 'mood', 'other'].includes(item.category)
    );
  },
};
