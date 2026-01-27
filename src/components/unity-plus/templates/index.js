/**
 * UnityNOTES Templates Module
 *
 * Exports template definitions and the TemplateSelector component
 * for creating canvases from pre-defined layouts.
 *
 * Usage:
 * import { TemplateSelector, instantiateTemplate, CANVAS_TEMPLATES } from '../components/unity-plus/templates';
 *
 * @created 2026-01-24
 * @author Claude Code
 */

// Template definitions and utilities
export {
  CANVAS_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesList,
  getTemplatesByCategory,
  getTemplateById,
  instantiateTemplate,
  getTemplatePreview,
} from './canvasTemplates';

// TemplateSelector component
export { default as TemplateSelector } from './TemplateSelector';
