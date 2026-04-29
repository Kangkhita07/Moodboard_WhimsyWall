/**
 * Utility functions for browser storage operations
 */

const STORAGE_PREFIX = 'whimsywall_';

export const storage = {
  /**
   * Set item in localStorage
   */
  setItem: (key: string, value: any): void => {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  /**
   * Get item from localStorage
   */
  getItem: <T,>(key: string, defaultValue?: T): T | null => {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      const item = localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Failed to retrieve from localStorage:', error);
      return defaultValue || null;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  /**
   * Clear all WhimsyWall items from localStorage
   */
  clear: (): void => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};
