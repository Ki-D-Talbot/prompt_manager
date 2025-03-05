// nlp.js - Natural Language Processing utilities for Prompt Manager

/**
 * NLP utilities for analyzing and categorizing prompts
 */
class PromptNLP {
  constructor() {
    // Common English stopwords
    this.stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
      'which', 'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than',
      'such', 'both', 'through', 'about', 'for', 'is', 'of', 'while', 'during',
      'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
      'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
      'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
      'should', 'now', 'been', 'being', 'have', 'has', 'had', 'did', 'does', 'do',
      'doing', 'am', 'are', 'was', 'were', 'be', 'by', 'with'
    ]);

    // Common prompt topics for categorization
    this.topicKeywords = {
      'writing': ['write', 'story', 'essay', 'blog', 'content', 'article', 'script', 'narrative', 'poem', 'poetry', 'fiction', 'author'],
      'programming': ['code', 'function', 'algorithm', 'programming', 'developer', 'software', 'app', 'application', 'debug', 'framework', 'library'],
      'education': ['learn', 'explain', 'teacher', 'student', 'course', 'curriculum', 'education', 'school', 'teach', 'lesson', 'study'],
      'business': ['business', 'marketing', 'strategy', 'company', 'enterprise', 'startup', 'product', 'service', 'customer', 'client', 'sales'],
      'research': ['research', 'analysis', 'study', 'investigate', 'examine', 'explore', 'findings', 'data', 'results', 'evidence', 'hypothesis'],
      'creative': ['creative', 'imagine', 'invent', 'design', 'artwork', 'visual', 'concept', 'innovation', 'generate', 'novel', 'original'],
      'social': ['social', 'media', 'communication', 'interact', 'community', 'network', 'engagement', 'audience', 'followers', 'platform'],
      'personal': ['personal', 'self', 'improvement', 'goal', 'habit', 'lifestyle', 'wellness', 'productivity', 'motivation'],
      'technical': ['technical', 'technology', 'engineering', 'system', 'device', 'hardware', 'software', 'mechanism', 'infrastructure']
    };

    // Sentiment word lists
    this.sentimentWords = {
      positive: ['good', 'great', 'best', 'better', 'excellent', 'amazing', 'wonderful', 'fantastic', 'positive', 'helpful', 'beneficial', 'success', 'successful', 'effective', 'efficient', 'optimal', 'improve', 'improvement', 'advantage', 'innovative', 'creative', 'engaging', 'valuable', 'useful', 'insightful', 'inspiring', 'enjoy', 'happy', 'love', 'like', 'recommend'],
      negative: ['bad', 'worst', 'worse', 'terrible', 'awful', 'horrible', 'poor', 'negative', 'difficult', 'challenging', 'problem', 'issue', 'fault', 'fail', 'failure', 'ineffective', 'inefficient', 'disadvantage', 'drawback', 'downside', 'risk', 'critical', 'criticize', 'hate', 'dislike', 'avoid', 'struggle', 'frustrating', 'annoying', 'useless', 'waste'],
      neutral: ['neutral', 'balanced', 'objective', 'impartial', 'fair', 'moderate', 'average', 'standard', 'normal', 'regular', 'ordinary', 'typical', 'common', 'general', 'basic', 'simple', 'plain', 'middle', 'medium', 'intermediate', 'conventional', 'traditional', 'usual', 'customary', 'routine', 'expected']
    };
  }

  /**
   * Extract keywords from text
   * @param {String} text - Text to analyze
   * @param {Number} limit - Maximum number of keywords to return
   * @returns {Array} - Array of keyword objects with text and score
   */
  extractKeywords(text, limit = 5) {
    if (!text) return [];

    // Normalize text
    const normalizedText = text.toLowerCase();
    
    // Tokenize (split into words)
    const words = normalizedText
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 2) // Remove short words
      .filter(word => !this.stopwords.has(word)); // Remove stopwords
    
    // Count word frequencies
    const wordFrequency = {};
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Convert to array and sort by frequency
    const sortedWords = Object.entries(wordFrequency)
      .map(([word, count]) => ({
        text: word,
        score: count
      }))
      .sort((a, b) => b.score - a.score);
    
    return sortedWords.slice(0, limit);
  }

  /**
   * Suggest tags based on prompt content
   * @param {String} text - Prompt text
   * @param {Number} limit - Maximum number of tags to suggest
   * @returns {Array} - Array of suggested tags
   */
  suggestTags(text, limit = 3) {
    if (!text) return [];
    
    const normalizedText = text.toLowerCase();
    
    // Get keywords
    const keywords = this.extractKeywords(text, 10);
    
    // Determine topics based on keywords
    const topicScores = {};
    
    // Initialize scores for all topics
    Object.keys(this.topicKeywords).forEach(topic => {
      topicScores[topic] = 0;
    });
    
    // Calculate score for each topic
    keywords.forEach(keyword => {
      Object.entries(this.topicKeywords).forEach(([topic, topicWords]) => {
        if (topicWords.includes(keyword.text)) {
          topicScores[topic] += keyword.score;
        } else {
          // Partial match - check if keyword contains or is contained by any topic word
          topicWords.forEach(topicWord => {
            if (keyword.text.includes(topicWord) || topicWord.includes(keyword.text)) {
              topicScores[topic] += keyword.score * 0.5;
            }
          });
        }
      });
    });
    
    // Convert to array and sort by score
    const sortedTopics = Object.entries(topicScores)
      .map(([topic, score]) => ({
        tag: topic,
        score: score
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return top N topics as tags
    return sortedTopics.slice(0, limit).map(item => item.tag);
  }

  /**
   * Analyze the sentiment of text
   * @param {String} text - Text to analyze
   * @returns {Object} - Sentiment analysis result
   */
  analyzeSentiment(text) {
    if (!text) {
      return { sentiment: 'neutral', score: 0 };
    }
    
    const normalizedText = text.toLowerCase();
    const words = normalizedText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    words.forEach(word => {
      if (this.sentimentWords.positive.includes(word)) {
        positiveCount++;
      } else if (this.sentimentWords.negative.includes(word)) {
        negativeCount++;
      } else if (this.sentimentWords.neutral.includes(word)) {
        neutralCount++;
      }
    });
    
    // Calculate sentiment score (-1 to 1)
    const totalSentimentWords = positiveCount + negativeCount + neutralCount;
    
    if (totalSentimentWords === 0) {
      return { sentiment: 'neutral', score: 0 };
    }
    
    const score = (positiveCount - negativeCount) / totalSentimentWords;
    
    // Determine sentiment category
    let sentiment;
    if (score > 0.1) {
      sentiment = 'positive';
    } else if (score < -0.1) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }
    
    return {
      sentiment,
      score,
      details: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };
  }

  /**
   * Find similar prompts
   * @param {Object} targetPrompt - Prompt to compare against
   * @param {Array} prompts - Array of prompts to search
   * @param {Number} limit - Maximum number of similar prompts to return
   * @returns {Array} - Array of similar prompts with similarity scores
   */
  findSimilarPrompts(targetPrompt, prompts, limit = 3) {
    if (!targetPrompt || !prompts || prompts.length === 0) {
      return [];
    }
    
    // Extract keywords from target prompt
    const targetKeywords = this.extractKeywords(
      targetPrompt.title + ' ' + targetPrompt.content, 
      20
    ).map(k => k.text);
    
    // Calculate similarity for each prompt
    const similarities = prompts
      .filter(prompt => prompt.id !== targetPrompt.id) // Exclude the target prompt
      .map(prompt => {
        // Extract keywords from comparison prompt
        const promptKeywords = this.extractKeywords(
          prompt.title + ' ' + prompt.content, 
          20
        ).map(k => k.text);
        
        // Calculate Jaccard similarity coefficient
        const intersection = new Set(
          targetKeywords.filter(keyword => promptKeywords.includes(keyword))
        );
        const union = new Set([...targetKeywords, ...promptKeywords]);
        
        const similarity = intersection.size / union.size;
        
        // Tag similarity
        const targetTags = new Set(targetPrompt.tags);
        const promptTags = new Set(prompt.tags);
        const tagIntersection = new Set(
          [...targetTags].filter(tag => promptTags.has(tag))
        );
        const tagUnion = new Set([...targetTags, ...promptTags]);
        
        const tagSimilarity = tagUnion.size > 0 ? 
          tagIntersection.size / tagUnion.size : 0;
        
        // Weighted similarity score (content 70%, tags 30%)
        const weightedSimilarity = (similarity * 0.7) + (tagSimilarity * 0.3);
        
        return {
          prompt,
          similarity: weightedSimilarity
        };
      })
      .filter(item => item.similarity > 0.1) // Only include reasonably similar prompts
      .sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, limit);
  }

  /**
   * Categorize prompt intent
   * @param {String} text - Prompt text
   * @returns {String} - Intent category
   */
  categorizeIntent(text) {
    if (!text) return 'general';
    
    const normalizedText = text.toLowerCase();
    
    // Define intent patterns
    const intentPatterns = {
      'question': [
        /\?$/,
        /^(what|how|why|when|where|who|which|can|could|would|will|is|are|was|were|do|does|did)/i
      ],
      'instruction': [
        /^(write|create|generate|develop|build|make|implement|design|explain|describe|list|enumerate|outline|summarize)/i
      ],
      'conversation': [
        /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i,
        /(let's talk|let's discuss|can we discuss|what do you think about|your thoughts on)/i
      ],
      'creative': [
        /(imagine|pretend|suppose|what if|create a story|write a poem|invent|fiction|fantasy|scenario)/i
      ],
      'analysis': [
        /(analyze|assess|evaluate|examine|investigate|review|critique|compare|contrast)/i
      ]
    };
    
    // Check each intent pattern
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          return intent;
        }
      }
    }
    
    // Default intent
    return 'general';
  }
}

// Export the PromptNLP class
export default PromptNLP;
