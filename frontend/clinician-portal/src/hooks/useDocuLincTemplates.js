import { useState, useEffect } from 'react';
import { docuLincAPI } from '../lib/api';

/**
 * Hook for working with DocuLinc templates
 * @returns {Object} Templates data and operations
 */
export function useDocuLincTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all templates
  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await docuLincAPI.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load documentation templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load a specific template by ID
  const loadTemplate = async (templateId) => {
    if (!templateId) {
      setSelectedTemplate(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await docuLincAPI.getTemplate(templateId);
      setSelectedTemplate(data);
    } catch (err) {
      setError(err.message || `Failed to load template: ${templateId}`);
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enhance documentation using DocuLinc
  const enhanceDocumentation = async (documentData) => {
    setLoading(true);
    setError(null);
    try {
      return await docuLincAPI.enhanceDocumentation(documentData);
    } catch (err) {
      setError(err.message || 'Failed to enhance documentation');
      console.error('Error enhancing documentation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    selectedTemplate,
    loading,
    error,
    loadTemplates,
    loadTemplate,
    enhanceDocumentation,
  };
}
