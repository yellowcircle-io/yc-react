/**
 * useImageAnalysis - AI-powered image analysis hook
 *
 * Uses OpenAI Vision API to analyze images and extract:
 * - Description of the image content
 * - Detected objects and elements
 * - Suggested tags/categories
 * - Text content (OCR)
 * - Mood/atmosphere
 *
 * Usage:
 *   const { analyzeImage, isAnalyzing, error } = useImageAnalysis();
 *   const result = await analyzeImage(imageUrl, 'describe');
 */

import { useState, useCallback } from 'react';
import openaiAdapter from '../adapters/llm/openai';

// Analysis prompts for different use cases
const ANALYSIS_PROMPTS = {
  // General description
  describe: `Analyze this image and provide a concise description. Include:
- Main subject or focus
- Setting/environment
- Notable details
- Overall mood or atmosphere

Keep the description to 2-3 sentences.`,

  // Detailed analysis with tags
  detailed: `Analyze this image thoroughly and respond with JSON:
{
  "description": "A 2-3 sentence description of the image",
  "subjects": ["list of main subjects/objects"],
  "tags": ["relevant tags for categorization"],
  "colors": ["dominant colors"],
  "mood": "overall mood/atmosphere",
  "textContent": "any text visible in the image or null",
  "location": "inferred location/setting or null"
}`,

  // Extract tags only
  tags: `Look at this image and suggest relevant tags for categorization.
Return a JSON array of 5-10 tags: ["tag1", "tag2", ...]
Include tags for: subject, style, mood, colors, objects.`,

  // OCR - extract text
  ocr: `Extract all visible text from this image.
If there is text, return it exactly as shown.
If there is no text, respond with "No text detected."`,

  // Location/travel context
  travel: `Analyze this image for travel/location context. Respond with JSON:
{
  "location": "Best guess of location (city, country, or landmark)",
  "locationType": "nature|urban|indoor|landmark|beach|mountain|other",
  "description": "Brief description of the scene",
  "suggestedCaption": "A short, engaging caption for this photo"
}`,

  // Creative/artistic analysis
  creative: `Analyze this image from an artistic perspective. Respond with JSON:
{
  "style": "Photography style (portrait, landscape, street, etc.)",
  "composition": "Notes on composition and framing",
  "lighting": "Lighting characteristics",
  "mood": "Emotional tone",
  "artDirection": "Suggestions for how this could be used in design/marketing"
}`,
};

/**
 * Custom hook for AI image analysis
 */
export function useImageAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  /**
   * Analyze an image
   * @param {string} imageUrl - URL or base64 data URL of the image
   * @param {string} analysisType - Type of analysis: 'describe', 'detailed', 'tags', 'ocr', 'travel', 'creative'
   * @param {object} options - { apiKey?, customPrompt? }
   * @returns {Promise<object|string>} Analysis result
   */
  const analyzeImage = useCallback(async (imageUrl, analysisType = 'describe', options = {}) => {
    if (!imageUrl) {
      setError('No image URL provided');
      return null;
    }

    // Check if OpenAI is configured
    if (!openaiAdapter.isConfigured() && !options.apiKey) {
      setError('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env or provide apiKey option.');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = options.customPrompt || ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS.describe;

      // Determine if we expect JSON response
      const expectsJSON = ['detailed', 'tags', 'travel', 'creative'].includes(analysisType) && !options.customPrompt;

      let result;
      if (expectsJSON) {
        result = await openaiAdapter.analyzeImageJSON(imageUrl, prompt, {
          apiKey: options.apiKey,
          model: options.model || 'gpt-4o-mini',
          detail: options.detail || 'auto',
        });
      } else {
        result = await openaiAdapter.analyzeImage(imageUrl, prompt, {
          apiKey: options.apiKey,
          model: options.model || 'gpt-4o-mini',
          detail: options.detail || 'auto',
        });
      }

      setLastResult(result);
      return result;
    } catch (err) {
      console.error('Image analysis error:', err);
      setError(err.message || 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Quick analysis - just get a description
   */
  const getDescription = useCallback(async (imageUrl, options = {}) => {
    return analyzeImage(imageUrl, 'describe', options);
  }, [analyzeImage]);

  /**
   * Get suggested tags for an image
   */
  const getTags = useCallback(async (imageUrl, options = {}) => {
    const result = await analyzeImage(imageUrl, 'tags', options);
    return Array.isArray(result) ? result : [];
  }, [analyzeImage]);

  /**
   * Extract text from an image (OCR)
   */
  const extractText = useCallback(async (imageUrl, options = {}) => {
    const result = await analyzeImage(imageUrl, 'ocr', options);
    return result === 'No text detected.' ? null : result;
  }, [analyzeImage]);

  /**
   * Get travel/location context
   */
  const getTravelContext = useCallback(async (imageUrl, options = {}) => {
    return analyzeImage(imageUrl, 'travel', options);
  }, [analyzeImage]);

  /**
   * Get detailed analysis with all metadata
   */
  const getDetailedAnalysis = useCallback(async (imageUrl, options = {}) => {
    return analyzeImage(imageUrl, 'detailed', options);
  }, [analyzeImage]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Core function
    analyzeImage,

    // Convenience methods
    getDescription,
    getTags,
    extractText,
    getTravelContext,
    getDetailedAnalysis,

    // State
    isAnalyzing,
    error,
    lastResult,
    clearError,

    // Config check
    isConfigured: openaiAdapter.isConfigured(),
  };
}

// Export analysis types for reference
export const ANALYSIS_TYPES = Object.keys(ANALYSIS_PROMPTS);

export default useImageAnalysis;
