// search.js - Enhanced search functionality

/**
 * Search class for advanced prompt searching capabilities
 */
class PromptSearch {
  constructor() {
    this.searchHistory = [];
    this.maxHistoryLength = 10;
  }

  /**
   * Performs a search with various options
   * @param {Array} prompts - Array of prompt objects to search
   * @param {Object} options - Search options
   * @returns {Array} - Filtered and ranked prompts
   */
  search(prompts, options = {}) {
    const {
      query = '',
      tags = [],
      dateRange = null,
      fuzzyMatch = true,
      searchInContent = true,
      searchInTitle = true,
      sortBy = 'relevance', // 'relevance', 'date', 'title'
    } = options;

    // Save search to history
    this._addToHistory(query);

    // If no query and no tags, return all prompts sorted by date
    if (!query && tags.length === 0) {
      return this._sortPrompts(prompts, sortBy);
    }

    // Filter by date range if specified
    let filteredPrompts = prompts;
    if (dateRange) {
      filteredPrompts = this._filterByDateRange(filteredPrompts, dateRange);
    }

    // Filter by tags if specified
    if (tags.length > 0) {
      filteredPrompts = this._filterByTags(filteredPrompts, tags);
    }

    // If no query, return filtered results
    if (!query) {
      return this._sortPrompts(filteredPrompts, sortBy);
    }

    // Search by query
    const searchResults = filteredPrompts.map(prompt => {
      const relevanceScore = this._calculateRelevance(
        prompt, 
        query, 
        { fuzzyMatch, searchInContent, searchInTitle }
      );
      
      return {
        prompt,
        relevanceScore
      };
    }).filter(result => result.relevanceScore > 0);

    // Sort results
    const sortedResults = this._sortResults(searchResults, sortBy);
    
    // Return just the prompts
    return sortedResults.map(result => result.prompt);
  }

  /**
   * Calculates the relevance score of a prompt to a query
   * @param {Object} prompt - Prompt object
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Number} - Relevance score (0-1)
   */
  _calculateRelevance(prompt, query, options) {
    const { fuzzyMatch, searchInContent, searchInTitle } = options;
    const normalizedQuery = query.toLowerCase();
    let score = 0;
    
    // Exact title match is highest priority
    if (searchInTitle && prompt.title.toLowerCase() === normalizedQuery) {
      score += 1;
    } 
    // Title contains query
    else if (searchInTitle && prompt.title.toLowerCase().includes(normalizedQuery)) {
      score += 0.8;
    } 
    // Title fuzzy match
    else if (fuzzyMatch && searchInTitle) {
      const titleScore = this._fuzzyMatch(prompt.title, normalizedQuery);
      score += titleScore * 0.7;
    }

    // Content exact match
    if (searchInContent && prompt.content.toLowerCase() === normalizedQuery) {
      score += 0.7;
    } 
    // Content contains query
    else if (searchInContent && prompt.content.toLowerCase().includes(normalizedQuery)) {
      score += 0.6;
    } 
    // Content fuzzy match
    else if (fuzzyMatch && searchInContent) {
      const contentScore = this._fuzzyMatch(prompt.content, normalizedQuery);
      score += contentScore * 0.5;
    }

    // Tag match bonus
    if (prompt.tags.some(tag => tag.toLowerCase() === normalizedQuery)) {
      score += 0.3;
    }

    // Normalize score to 0-1
    return Math.min(1, score);
  }

  /**
   * Simple fuzzy matching algorithm
   * @param {String} text - Text to match against
   * @param {String} query - Query to match
   * @returns {Number} - Match score (0-1)
   */
  _fuzzyMatch(text, query) {
    if (!query) return 0;
    
    text = text.toLowerCase();
    query = query.toLowerCase();
    
    // If exact match, return highest score
    if (text === query) return 1;
    
    // If contains as substring, return high score
    if (text.includes(query)) return 0.9;
    
    // Calculate Levenshtein distance for fuzzy matching
    const distance = this._levenshteinDistance(text, query);
    const maxLength = Math.max(text.length, query.length);
    
    // Convert distance to similarity score (0-1)
    const similarity = 1 - (distance / maxLength);
    
    // Only return score if it's above threshold
    return similarity > 0.5 ? similarity : 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {String} str1 - First string
   * @param {String} str2 - Second string
   * @returns {Number} - Levenshtein distance
   */
  _levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Filter prompts by date range
   * @param {Array} prompts - Array of prompts
   * @param {Object} dateRange - Object with start and end dates
   * @returns {Array} - Filtered prompts
   */
  _filterByDateRange(prompts, dateRange) {
    const { start, end } = dateRange;
    return prompts.filter(prompt => {
      const promptDate = new Date(prompt.createdAt);
      return (!start || promptDate >= start) && (!end || promptDate <= end);
    });
  }

  /**
   * Filter prompts by tags
   * @param {Array} prompts - Array of prompts
   * @param {Array} tags - Array of tags to filter by
   * @returns {Array} - Filtered prompts
   */
  _filterByTags(prompts, tags) {
    return prompts.filter(prompt => 
      tags.every(tag => prompt.tags.includes(tag))
    );
  }

  /**
   * Sort search results based on specified criteria
   * @param {Array} results - Array of search results with relevance scores
   * @param {String} sortBy - Sorting criteria
   * @returns {Array} - Sorted results
   */
  _sortResults(results, sortBy) {
    switch(sortBy) {
      case 'date':
        return results.sort((a, b) => 
          new Date(b.prompt.updatedAt) - new Date(a.prompt.updatedAt)
        );
      case 'title':
        return results.sort((a, b) => 
          a.prompt.title.localeCompare(b.prompt.title)
        );
      case 'relevance':
      default:
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  /**
   * Sort prompts based on specified criteria
   * @param {Array} prompts - Array of prompts
   * @param {String} sortBy - Sorting criteria
   * @returns {Array} - Sorted prompts
   */
  _sortPrompts(prompts, sortBy) {
    switch(sortBy) {
      case 'date':
        return [...prompts].sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      case 'title':
        return [...prompts].sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      default:
        return prompts;
    }
  }

  /**
   * Add a query to search history
   * @param {String} query - Search query
   */
  _addToHistory(query) {
    if (!query || query.trim() === '') return;
    
    // Remove duplicate if exists
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // Add new query at the beginning
    this.searchHistory.unshift(query);
    
    // Limit history length
    if (this.searchHistory.length > this.maxHistoryLength) {
      this.searchHistory.pop();
    }
    
    // Save to storage
    chrome.storage.local.set({ searchHistory: this.searchHistory });
  }

  /**
   * Load search history from storage
   * @returns {Promise} - Promise that resolves with search history
   */
  loadHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get('searchHistory', (data) => {
        this.searchHistory = data.searchHistory || [];
        resolve(this.searchHistory);
      });
    });
  }

  /**
   * Clear search history
   */
  clearHistory() {
    this.searchHistory = [];
    chrome.storage.local.remove('searchHistory');
  }

  /**
   * Get search suggestions based on current input
   * @param {String} input - Current search input
   * @param {Array} prompts - All prompts for additional suggestions
   * @returns {Array} - Suggestions
   */
  getSuggestions(input, prompts) {
    if (!input || input.trim() === '') {
      return this.searchHistory.slice(0, 5);
    }

    const normalizedInput = input.toLowerCase();
    const suggestions = [];
    
    // First add matching items from history
    this.searchHistory.forEach(item => {
      if (item.toLowerCase().includes(normalizedInput) && 
          !suggestions.includes(item)) {
        suggestions.push(item);
      }
    });
    
    // Then add unique tags that match
    if (prompts) {
      const allTags = new Set();
      prompts.forEach(prompt => {
        prompt.tags.forEach(tag => allTags.add(tag));
      });
      
      [...allTags].forEach(tag => {
        if (tag.toLowerCase().includes(normalizedInput) && 
            !suggestions.includes(tag)) {
          suggestions.push(tag);
        }
      });
    }
    
    return suggestions.slice(0, 5);
  }
}

// Export the PromptSearch class
export default PromptSearch;
