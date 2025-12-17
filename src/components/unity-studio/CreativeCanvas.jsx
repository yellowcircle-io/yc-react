/**
 * CreativeCanvas - Visual Canvas Editor for Ad Creatives
 *
 * Platform-compliant canvas editor for creating ad images.
 * Uses HTML Canvas for rendering and export.
 *
 * Features:
 * - Platform dimension presets from platform-specs.js
 * - Safe zone overlays for Stories
 * - Layer system: background, image, text elements
 * - Drag and drop positioning
 * - Export at exact platform dimensions
 *
 * Created: December 2025
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PLATFORM_SPECS,
  SAFE_ZONES
} from './platform-specs';
import {
  Move,
  Type,
  Image as ImageIcon,
  Square,
  Trash2,
  Download,
  Copy,
  Grid,
  Shield,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  RotateCcw,
  Layers,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Palette,
  ArrowUp,
  ArrowDown,
  Clipboard,
  Hexagon,
  Star,
  Circle,
  Triangle,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

// Helper to scale dimensions to fit container
const scaleToFit = (width, height, maxWidth, maxHeight) => {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale
  };
};

// Brand colors
const BRAND_COLORS = [
  '#FBBF24', // yellowCircle yellow
  '#000000', // Black
  '#FFFFFF', // White
  '#1d4ed8', // Blue
  '#15803d', // Green
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4b5563'  // Gray
];

// Gradient presets
const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', colors: ['#f093fb', '#f5576c'] },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', colors: ['#667eea', '#764ba2'] },
  { name: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', colors: ['#11998e', '#38ef7d'] },
  { name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', colors: ['#f12711', '#f5af19'] },
  { name: 'Night', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', colors: ['#0f0c29', '#24243e'] },
  { name: 'Gold', value: 'linear-gradient(135deg, #FBBF24 0%, #f59e0b 100%)', colors: ['#FBBF24', '#f59e0b'] },
  { name: 'Slate', value: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', colors: ['#1e293b', '#475569'] },
  { name: 'Rose', value: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', colors: ['#ec4899', '#f43f5e'] },
  { name: 'Sky', value: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', colors: ['#38bdf8', '#0284c7'] },
  { name: 'Mint', value: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', colors: ['#34d399', '#059669'] }
];

// Vector shape presets (SVG paths normalized to 100x100 viewBox)
const VECTOR_PRESETS = {
  shapes: [
    { name: 'Square', icon: '⬜', path: 'M10 10 L90 10 L90 90 L10 90 Z', category: 'Basic' },
    { name: 'Rectangle', icon: '▭', path: 'M5 25 L95 25 L95 75 L5 75 Z', category: 'Basic' },
    { name: 'Circle', icon: '⚫', path: 'M50 5 A45 45 0 1 1 49.99 5 Z', category: 'Basic' },
    { name: 'Star', icon: '⭐', path: 'M50 5 L61 40 L97 40 L68 62 L79 97 L50 75 L21 97 L32 62 L3 40 L39 40 Z', category: 'Basic' },
    { name: 'Heart', icon: '❤️', path: 'M50 88 C20 55 5 35 25 20 C35 12 50 20 50 30 C50 20 65 12 75 20 C95 35 80 55 50 88 Z', category: 'Basic' },
    { name: 'Arrow Right', icon: '→', path: 'M10 50 L70 50 L70 30 L95 50 L70 70 L70 50 Z', category: 'Arrows' },
    { name: 'Arrow Up', icon: '↑', path: 'M50 5 L75 45 L60 45 L60 95 L40 95 L40 45 L25 45 Z', category: 'Arrows' },
    { name: 'Checkmark', icon: '✓', path: 'M20 55 L40 75 L80 25 L85 30 L40 85 L15 60 Z', category: 'Basic' },
    { name: 'Plus', icon: '+', path: 'M40 10 L60 10 L60 40 L90 40 L90 60 L60 60 L60 90 L40 90 L40 60 L10 60 L10 40 L40 40 Z', category: 'Basic' },
    { name: 'Circle Ring', icon: '◯', path: 'M50 5 A45 45 0 1 1 49.99 5 Z M50 20 A30 30 0 1 0 50.01 20 Z', category: 'Basic' },
    { name: 'Hexagon', icon: '⬡', path: 'M50 5 L90 27 L90 73 L50 95 L10 73 L10 27 Z', category: 'Basic' },
    { name: 'Diamond', icon: '◆', path: 'M50 5 L95 50 L50 95 L5 50 Z', category: 'Basic' },
    { name: 'Triangle', icon: '△', path: 'M50 10 L90 90 L10 90 Z', category: 'Basic' },
    { name: 'Ribbon', icon: '🎀', path: 'M10 30 L30 30 L50 10 L70 30 L90 30 L90 50 L70 50 L50 70 L30 50 L10 50 Z', category: 'Badges' },
    { name: 'Badge', icon: '🏷️', path: 'M20 10 L80 10 L80 75 L50 95 L20 75 Z', category: 'Badges' },
    { name: 'Banner', icon: '📜', path: 'M5 25 L25 25 L25 10 L75 10 L75 25 L95 25 L85 40 L95 55 L75 55 L75 90 L25 90 L25 55 L5 55 L15 40 Z', category: 'Badges' },
    { name: 'Speech Bubble', icon: '💬', path: 'M10 10 L90 10 L90 60 L40 60 L25 80 L30 60 L10 60 Z', category: 'UI' },
    { name: 'Location Pin', icon: '📍', path: 'M50 95 L30 60 A25 25 0 1 1 70 60 Z M50 30 A10 10 0 1 0 50.01 30 Z', category: 'UI' },
    { name: 'Lightning', icon: '⚡', path: 'M55 5 L20 50 L45 50 L35 95 L80 40 L52 40 Z', category: 'Effects' },
    { name: 'Burst', icon: '💥', path: 'M50 5 L55 35 L85 20 L65 45 L95 50 L65 55 L85 80 L55 65 L50 95 L45 65 L15 80 L35 55 L5 50 L35 45 L15 20 L45 35 Z', category: 'Effects' },
    { name: 'Wave', icon: '〰️', path: 'M0 50 Q25 20 50 50 T100 50 L100 100 L0 100 Z', category: 'Effects' }
  ],
  categories: ['Basic', 'Arrows', 'Badges', 'UI', 'Effects']
};

// AI vector generation prompts by category
const VECTOR_AI_CATEGORIES = [
  { id: 'icon', name: 'Icon', prompt: 'Create a simple, clean icon suitable for marketing materials' },
  { id: 'badge', name: 'Badge', prompt: 'Create a badge or seal shape for highlighting offers' },
  { id: 'decoration', name: 'Decoration', prompt: 'Create a decorative element for visual interest' },
  { id: 'arrow', name: 'Arrow/Pointer', prompt: 'Create an arrow or pointing element for CTAs' },
  { id: 'frame', name: 'Frame', prompt: 'Create a frame or border element' }
];

// Font options (expanded with Google Fonts)
const FONT_OPTIONS = [
  // Sans-serif
  { name: 'Inter', value: 'Inter, sans-serif', category: 'Sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'Sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'Sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif', category: 'Sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'Sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif', category: 'Sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif', category: 'Sans-serif' },
  { name: 'Raleway', value: 'Raleway, sans-serif', category: 'Sans-serif' },
  { name: 'Work Sans', value: '"Work Sans", sans-serif', category: 'Sans-serif' },
  // Serif
  { name: 'Playfair', value: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Merriweather', value: 'Merriweather, serif', category: 'Serif' },
  { name: 'Lora', value: 'Lora, serif', category: 'Serif' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'Serif' },
  { name: 'Times', value: '"Times New Roman", serif', category: 'Serif' },
  // Display
  { name: 'Oswald', value: 'Oswald, sans-serif', category: 'Display' },
  { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif', category: 'Display' },
  { name: 'Anton', value: 'Anton, sans-serif', category: 'Display' },
  // Mono
  { name: 'Fira Code', value: '"Fira Code", monospace', category: 'Mono' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', category: 'Mono' },
  { name: 'Consolas', value: 'Consolas, monospace', category: 'Mono' }
];

// Goal-based prebuilt templates (2025 Best Practices)
// Image URLs use Unsplash Source for dynamic placeholders
const TEMPLATE_CATEGORIES = {
  AWARENESS: { name: 'Brand Awareness', icon: '👁️', description: 'Build recognition and reach' },
  ENGAGEMENT: { name: 'Engagement', icon: '💬', description: 'Drive interaction and community' },
  CONVERSION: { name: 'Conversion', icon: '🎯', description: 'Generate leads and sales' },
  RETARGETING: { name: 'Retargeting', icon: '🔄', description: 'Re-engage past visitors' }
};

const PREBUILT_TEMPLATES = [
  // ============================================
  // AWARENESS TEMPLATES - High impact, memorable
  // ============================================
  {
    id: 'awareness-hero-image',
    name: 'Hero Image',
    category: 'AWARENESS',
    description: 'Full-bleed image with bold overlay text',
    thumbnail: '🖼️',
    bgMode: 'image',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&h=1350&fit=crop',
    elements: [
      { type: 'text', content: 'DISCOVER', x: 54, y: 100, fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#FBBF24', textAlign: 'left', width: 400 },
      { type: 'text', content: 'Your Brand Story', x: 54, y: 130, fontSize: 56, fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#FFFFFF', textAlign: 'left', width: 600 },
      { type: 'text', content: 'Crafted with purpose, built for impact', x: 54, y: 220, fontSize: 22, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: 'rgba(255,255,255,0.9)', textAlign: 'left', width: 500 }
    ]
  },
  {
    id: 'awareness-split-layout',
    name: 'Split Layout',
    category: 'AWARENESS',
    description: 'Color block with product focus',
    thumbnail: '⬛',
    bgMode: 'solid',
    backgroundColor: '#0f172a',
    elements: [
      { type: 'image', x: 540, y: 0, width: 540, height: 1350, imageSrc: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=540&h=1350&fit=crop' },
      { type: 'text', content: 'NEW', x: 54, y: 400, fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#3b82f6', textAlign: 'left', width: 200 },
      { type: 'text', content: 'Meet the Future', x: 54, y: 430, fontSize: 42, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', textAlign: 'left', width: 450 },
      { type: 'text', content: 'Innovation starts here', x: 54, y: 520, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#94a3b8', textAlign: 'left', width: 400 }
    ]
  },
  {
    id: 'awareness-bold-statement',
    name: 'Bold Statement',
    category: 'AWARENESS',
    description: 'Oversized typography for scroll-stopping',
    thumbnail: '📢',
    bgMode: 'gradient',
    backgroundGradient: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
    elements: [
      { type: 'text', content: 'THINK', x: 54, y: 350, fontSize: 120, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#FFFFFF', textAlign: 'left', width: 972 },
      { type: 'text', content: 'BIGGER.', x: 54, y: 480, fontSize: 120, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#a78bfa', textAlign: 'left', width: 972 },
      { type: 'text', content: 'Brand tagline goes here', x: 54, y: 620, fontSize: 24, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#c4b5fd', textAlign: 'left', width: 500 }
    ]
  },

  // ============================================
  // ENGAGEMENT TEMPLATES - Encourage interaction
  // ============================================
  {
    id: 'engagement-question',
    name: 'Question Hook',
    category: 'ENGAGEMENT',
    description: 'Conversation starter layout',
    thumbnail: '❓',
    bgMode: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    elements: [
      { type: 'text', content: "What's your", x: 54, y: 380, fontSize: 36, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: 'rgba(255,255,255,0.9)', textAlign: 'center', width: 972 },
      { type: 'text', content: '#1 Challenge?', x: 54, y: 440, fontSize: 64, fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#FFFFFF', textAlign: 'center', width: 972 },
      { type: 'text', content: 'Drop a 💬 in the comments', x: 54, y: 550, fontSize: 24, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#d1fae5', textAlign: 'center', width: 972 }
    ]
  },
  {
    id: 'engagement-poll-style',
    name: 'Poll Style',
    category: 'ENGAGEMENT',
    description: 'A/B choice visual',
    thumbnail: '📊',
    bgMode: 'solid',
    backgroundColor: '#18181b',
    elements: [
      { type: 'text', content: 'Which do you prefer?', x: 54, y: 120, fontSize: 32, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', textAlign: 'center', width: 972 },
      { type: 'image', x: 54, y: 200, width: 450, height: 450, imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=450&h=450&fit=crop' },
      { type: 'image', x: 576, y: 200, width: 450, height: 450, imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=450&h=450&fit=crop' },
      { type: 'button', content: 'Option A', x: 150, y: 680, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#3b82f6', paddingX: 60, paddingY: 16, borderRadius: 8 },
      { type: 'button', content: 'Option B', x: 650, y: 680, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#ec4899', paddingX: 60, paddingY: 16, borderRadius: 8 }
    ]
  },
  {
    id: 'engagement-testimonial',
    name: 'Social Proof',
    category: 'ENGAGEMENT',
    description: 'Customer quote with photo',
    thumbnail: '⭐',
    bgMode: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    elements: [
      { type: 'text', content: '⭐⭐⭐⭐⭐', x: 54, y: 300, fontSize: 36, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#fbbf24', textAlign: 'center', width: 972 },
      { type: 'text', content: '"This completely transformed how we work. I can\'t imagine going back."', x: 100, y: 380, fontSize: 32, fontFamily: '"Playfair Display", serif', fontWeight: '500', color: '#FFFFFF', textAlign: 'center', width: 880 },
      { type: 'image', x: 440, y: 550, width: 80, height: 80, imageSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', borderRadius: 40 },
      { type: 'text', content: 'Sarah Chen, Product Lead', x: 54, y: 660, fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#94a3b8', textAlign: 'center', width: 972 }
    ]
  },

  // ============================================
  // CONVERSION TEMPLATES - Drive action
  // ============================================
  {
    id: 'conversion-product-hero',
    name: 'Product Hero',
    category: 'CONVERSION',
    description: 'Product-focused with clear CTA',
    thumbnail: '🛍️',
    bgMode: 'solid',
    backgroundColor: '#fef3c7',
    elements: [
      { type: 'image', x: 240, y: 80, width: 600, height: 600, imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop' },
      { type: 'text', content: 'Premium Watch', x: 54, y: 720, fontSize: 48, fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#1f2937', textAlign: 'center', width: 972 },
      { type: 'text', content: 'Starting at $299', x: 54, y: 790, fontSize: 28, fontFamily: 'Inter, sans-serif', fontWeight: '600', color: '#92400e', textAlign: 'center', width: 972 },
      { type: 'button', content: 'Shop Now →', x: 380, y: 870, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#1f2937', paddingX: 48, paddingY: 18, borderRadius: 8 }
    ]
  },
  {
    id: 'conversion-limited-offer',
    name: 'Limited Offer',
    category: 'CONVERSION',
    description: 'Urgency-driven promotion',
    thumbnail: '⏰',
    bgMode: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    elements: [
      { type: 'text', content: '🔥 LIMITED TIME', x: 54, y: 300, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#fef2f2', textAlign: 'center', width: 972 },
      { type: 'text', content: '50% OFF', x: 54, y: 350, fontSize: 96, fontFamily: 'Inter, sans-serif', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', width: 972 },
      { type: 'text', content: 'Everything in Store', x: 54, y: 470, fontSize: 32, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#fecaca', textAlign: 'center', width: 972 },
      { type: 'text', content: 'Use code: SAVE50', x: 54, y: 540, fontSize: 24, fontFamily: '"Fira Code", monospace', fontWeight: '600', color: '#FFFFFF', textAlign: 'center', width: 972 },
      { type: 'button', content: 'Claim Offer', x: 390, y: 620, fontSize: 22, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#dc2626', backgroundColor: '#FFFFFF', paddingX: 48, paddingY: 18, borderRadius: 30 }
    ]
  },
  {
    id: 'conversion-lead-magnet',
    name: 'Lead Magnet',
    category: 'CONVERSION',
    description: 'Free resource download offer',
    thumbnail: '📥',
    bgMode: 'gradient',
    backgroundGradient: 'linear-gradient(180deg, #1e40af 0%, #3b82f6 100%)',
    elements: [
      { type: 'text', content: 'FREE GUIDE', x: 54, y: 280, fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#bfdbfe', textAlign: 'center', width: 972 },
      { type: 'text', content: '10 Steps to Scale Your Business', x: 80, y: 320, fontSize: 42, fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#FFFFFF', textAlign: 'center', width: 920 },
      { type: 'image', x: 340, y: 440, width: 400, height: 280, imageSrc: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=280&fit=crop' },
      { type: 'text', content: '📄 Instant PDF Download', x: 54, y: 760, fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#bfdbfe', textAlign: 'center', width: 972 },
      { type: 'button', content: 'Get Free Guide', x: 370, y: 820, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#1e40af', backgroundColor: '#FFFFFF', paddingX: 40, paddingY: 16, borderRadius: 8 }
    ]
  },

  // ============================================
  // RETARGETING TEMPLATES - Re-engage visitors
  // ============================================
  {
    id: 'retargeting-cart-reminder',
    name: 'Cart Reminder',
    category: 'RETARGETING',
    description: 'Abandoned cart recovery',
    thumbnail: '🛒',
    bgMode: 'solid',
    backgroundColor: '#f8fafc',
    elements: [
      { type: 'text', content: 'Forgetting something?', x: 54, y: 320, fontSize: 40, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#1f2937', textAlign: 'center', width: 972 },
      { type: 'text', content: "Your cart is waiting for you", x: 54, y: 400, fontSize: 24, fontFamily: 'Inter, sans-serif', fontWeight: '400', color: '#64748b', textAlign: 'center', width: 972 },
      { type: 'image', x: 290, y: 470, width: 500, height: 300, imageSrc: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop' },
      { type: 'text', content: '+ Free shipping on orders over $50', x: 54, y: 810, fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#059669', textAlign: 'center', width: 972 },
      { type: 'button', content: 'Complete Purchase', x: 350, y: 870, fontSize: 18, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#1f2937', paddingX: 40, paddingY: 16, borderRadius: 8 }
    ]
  },
  {
    id: 'retargeting-comeback',
    name: 'Welcome Back',
    category: 'RETARGETING',
    description: 'Personal reconnection',
    thumbnail: '👋',
    bgMode: 'gradient',
    backgroundGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    elements: [
      { type: 'text', content: "We've missed you!", x: 54, y: 380, fontSize: 48, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#FFFFFF', textAlign: 'center', width: 972 },
      { type: 'text', content: "Here's 20% off your next order", x: 54, y: 460, fontSize: 28, fontFamily: 'Inter, sans-serif', fontWeight: '500', color: '#e0e7ff', textAlign: 'center', width: 972 },
      { type: 'text', content: 'Code: WELCOME20', x: 54, y: 530, fontSize: 22, fontFamily: '"Fira Code", monospace', fontWeight: '600', color: '#FFFFFF', textAlign: 'center', width: 972 },
      { type: 'button', content: 'Shop Now', x: 420, y: 620, fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: '700', color: '#6366f1', backgroundColor: '#FFFFFF', paddingX: 48, paddingY: 18, borderRadius: 30 }
    ]
  }
];

// Default element templates
/**
 * Create canvas elements from AI-generated content
 */
const createElementsFromContent = (content, spec) => {
  const elements = [];
  const safeZone = SAFE_ZONES[spec?.key] || {};
  const topMargin = safeZone.top || 100;
  const leftMargin = safeZone.left || 50;
  const contentWidth = spec.width - (safeZone.left || 50) * 2;

  // Headline element
  if (content.headline) {
    elements.push({
      id: Date.now(),
      type: 'text',
      content: content.headline,
      x: leftMargin,
      y: topMargin + 80,
      fontSize: 48,
      fontFamily: 'Inter, sans-serif',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      width: contentWidth
    });
  }

  // Description/body element
  if (content.description) {
    elements.push({
      id: Date.now() + 1,
      type: 'text',
      content: content.description,
      x: leftMargin + 40,
      y: topMargin + 200,
      fontSize: 24,
      fontFamily: 'Inter, sans-serif',
      fontWeight: '400',
      color: '#94a3b8',
      textAlign: 'center',
      width: contentWidth - 80
    });
  }

  // CTA button element
  if (content.cta) {
    elements.push({
      id: Date.now() + 2,
      type: 'button',
      content: content.cta,
      x: spec.width / 2 - 100,
      y: spec.height - (safeZone.bottom || 200) - 80,
      fontSize: 18,
      fontFamily: 'Inter, sans-serif',
      fontWeight: '600',
      color: '#000000',
      backgroundColor: '#FBBF24',
      paddingX: 40,
      paddingY: 16,
      borderRadius: 8
    });
  }

  return elements;
};

const DEFAULT_ELEMENTS = {
  text: {
    type: 'text',
    content: 'Add your text here',
    x: 50,
    y: 50,
    fontSize: 32,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    width: 300
  },
  headline: {
    type: 'text',
    content: 'Headline',
    x: 50,
    y: 100,
    fontSize: 48,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: 400
  },
  subtext: {
    type: 'text',
    content: 'Supporting text goes here',
    x: 50,
    y: 200,
    fontSize: 24,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    width: 350
  },
  cta: {
    type: 'button',
    content: 'Learn More',
    x: 100,
    y: 300,
    fontSize: 18,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#FBBF24',
    paddingX: 32,
    paddingY: 14,
    borderRadius: 8
  },
  image: {
    type: 'image',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    image: null,
    content: 'Image Layer'
  },
  vector: {
    type: 'vector',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    path: 'M50 5 L61 40 L97 40 L68 62 L79 97 L50 75 L21 97 L32 62 L3 40 L39 40 Z', // Default star
    fill: '#FBBF24',
    stroke: null,
    strokeWidth: 0,
    content: 'Vector Shape'
  }
};

const CreativeCanvas = ({
  onBack,
  onSave,
  onExport,
  isDarkTheme = false,
  initialSpec = 'instagram_feed_portrait',
  initialElements = [],
  initialContent = null  // { headline, description, cta } - for AI-generated content
}) => {
  // Canvas state
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const layerImageInputRef = useRef(null);

  // Selected platform spec
  const [selectedSpec, setSelectedSpec] = useState(initialSpec);
  const [spec, setSpec] = useState(PLATFORM_SPECS[initialSpec] || PLATFORM_SPECS.instagram_feed_portrait);

  // Canvas elements
  const [elements, setElements] = useState(() => {
    if (initialElements.length > 0) return initialElements;

    // Create elements from initialContent if provided
    if (initialContent && (initialContent.headline || initialContent.description || initialContent.cta)) {
      const currentSpec = PLATFORM_SPECS[initialSpec] || PLATFORM_SPECS.instagram_feed_portrait;
      return createElementsFromContent(initialContent, currentSpec);
    }

    return [];
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [lastAppliedContent, setLastAppliedContent] = useState(initialContent);

  // Background
  const [backgroundColor, setBackgroundColor] = useState('#1f2937');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundGradient, setBackgroundGradient] = useState(null);
  const [customColor, setCustomColor] = useState('#1f2937');
  const [bgMode, setBgMode] = useState('solid'); // 'solid' | 'gradient' | 'image'
  // Custom gradient builder
  const [customGradientStart, setCustomGradientStart] = useState('#667eea');
  const [customGradientEnd, setCustomGradientEnd] = useState('#764ba2');
  const [customGradientAngle, setCustomGradientAngle] = useState(135);

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState(null);

  // UI state
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [creativeName, setCreativeName] = useState('Untitled Creative');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('ALL'); // ALL, AWARENESS, ENGAGEMENT, CONVERSION, RETARGETING
  const [loadingImages, setLoadingImages] = useState({}); // Track which images are loading

  // Custom fonts state
  const [customFonts, setCustomFonts] = useState(() => {
    // Load custom fonts from localStorage
    try {
      const saved = localStorage.getItem('studio_custom_fonts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFontManager, setShowFontManager] = useState(false);
  const [newFontName, setNewFontName] = useState('');
  const [loadedFonts, setLoadedFonts] = useState(new Set());

  // Vector picker state
  const [showVectorPicker, setShowVectorPicker] = useState(false);
  const [vectorCategory, setVectorCategory] = useState('ALL');
  const [vectorAIPrompt, setVectorAIPrompt] = useState('');
  const [isGeneratingVector, setIsGeneratingVector] = useState(false);
  const [generatedVectorPath, setGeneratedVectorPath] = useState(null);

  // Load Google Font dynamically
  const loadGoogleFont = useCallback((fontName) => {
    if (loadedFonts.has(fontName)) return;

    const fontId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) {
      setLoadedFonts(prev => new Set([...prev, fontName]));
      return;
    }

    // Create link element
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);

    setLoadedFonts(prev => new Set([...prev, fontName]));
  }, [loadedFonts]);

  // Add custom font (Google Fonts)
  const addCustomFont = useCallback((fontName) => {
    if (!fontName.trim()) return;

    const trimmed = fontName.trim();
    const exists = customFonts.some(f => f.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    const newFont = {
      name: trimmed,
      value: `"${trimmed}", sans-serif`,
      category: 'Custom'
    };

    const updated = [...customFonts, newFont];
    setCustomFonts(updated);
    localStorage.setItem('studio_custom_fonts', JSON.stringify(updated));
    loadGoogleFont(trimmed);
    setNewFontName('');
  }, [customFonts, loadGoogleFont]);

  // Remove custom font
  const removeCustomFont = useCallback((fontName) => {
    const updated = customFonts.filter(f => f.name !== fontName);
    setCustomFonts(updated);
    localStorage.setItem('studio_custom_fonts', JSON.stringify(updated));
  }, [customFonts]);

  // Load all fonts on mount
  useEffect(() => {
    // Load default fonts
    FONT_OPTIONS.forEach(font => {
      const cleanName = font.name.replace(/['"]/g, '');
      loadGoogleFont(cleanName);
    });
    // Load custom fonts
    customFonts.forEach(font => {
      loadGoogleFont(font.name);
    });
  }, [customFonts, loadGoogleFont]);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Snap-to-grid state
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, _setGridSize] = useState(20); // 20px grid
  const [snapThreshold] = useState(10); // Snap when within 10px
  const [alignmentGuides, setAlignmentGuides] = useState({ x: null, y: null });

  // Calculate scaled dimensions for preview
  const getScaledDimensions = useCallback(() => {
    if (!containerRef.current) return { width: spec.width, height: spec.height, scale: 1 };

    const containerWidth = containerRef.current.clientWidth - 48;
    const containerHeight = containerRef.current.clientHeight - 48;
    const maxWidth = Math.min(containerWidth, 600);
    const maxHeight = Math.min(containerHeight, 800);

    return scaleToFit(spec.width, spec.height, maxWidth, maxHeight);
  }, [spec]);

  // Update spec when selection changes
  useEffect(() => {
    const newSpec = PLATFORM_SPECS[selectedSpec];
    if (newSpec) {
      setSpec(newSpec);
    }
  }, [selectedSpec]);

  // Update elements when initialContent changes (for AI-generated content)
  useEffect(() => {
    if (!initialContent) return;

    // Check if content has actually changed
    const contentChanged =
      initialContent.headline !== lastAppliedContent?.headline ||
      initialContent.description !== lastAppliedContent?.description ||
      initialContent.cta !== lastAppliedContent?.cta;

    if (contentChanged && (initialContent.headline || initialContent.description || initialContent.cta)) {
      const newElements = createElementsFromContent(initialContent, spec);
      setElements(newElements);
      setLastAppliedContent(initialContent);
      setSelectedElement(null);
    }
  }, [initialContent, spec, lastAppliedContent]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scaled = getScaledDimensions();

    // Set canvas size
    canvas.width = scaled.width * zoom;
    canvas.height = scaled.height * zoom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else if (backgroundGradient) {
      // Parse gradient and create canvas gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      // Extract colors from the gradient preset
      const preset = GRADIENT_PRESETS.find(g => g.value === backgroundGradient);
      if (preset && preset.colors) {
        preset.colors.forEach((color, i) => {
          gradient.addColorStop(i / (preset.colors.length - 1), color);
        });
      } else {
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 20 * scaled.scale * zoom;

      for (let x = gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw safe zones
    const safeZone = SAFE_ZONES[selectedSpec];
    if (showSafeZones && safeZone) {
      const isStoryFormat = selectedSpec.includes('story');
      const zoneColor = isStoryFormat ? 'rgba(239, 68, 68' : 'rgba(59, 130, 246'; // Red for story, blue for margin

      // Top safe zone
      if (safeZone.top) {
        const topHeight = (safeZone.top / spec.height) * canvas.height;
        // Fill
        ctx.fillStyle = `${zoneColor}, 0.15)`;
        ctx.fillRect(0, 0, canvas.width, topHeight);
        // Border
        ctx.strokeStyle = `${zoneColor}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(0, topHeight);
        ctx.lineTo(canvas.width, topHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label for stories
        if (isStoryFormat) {
          ctx.font = '11px Inter, sans-serif';
          ctx.fillStyle = `${zoneColor}, 0.9)`;
          ctx.textAlign = 'center';
          ctx.fillText('⚠ UI OVERLAY (Profile)', canvas.width / 2, topHeight - 8);
        }
      }

      // Bottom safe zone
      if (safeZone.bottom) {
        const bottomHeight = (safeZone.bottom / spec.height) * canvas.height;
        const bottomY = canvas.height - bottomHeight;
        // Fill
        ctx.fillStyle = `${zoneColor}, 0.15)`;
        ctx.fillRect(0, bottomY, canvas.width, bottomHeight);
        // Border
        ctx.strokeStyle = `${zoneColor}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(0, bottomY);
        ctx.lineTo(canvas.width, bottomY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label for stories
        if (isStoryFormat) {
          ctx.font = '11px Inter, sans-serif';
          ctx.fillStyle = `${zoneColor}, 0.9)`;
          ctx.textAlign = 'center';
          ctx.fillText('⚠ UI OVERLAY (CTA, Swipe)', canvas.width / 2, bottomY + 16);
        }
      }

      // Left safe zone (for feed formats)
      if (safeZone.left) {
        const leftWidth = (safeZone.left / spec.width) * canvas.width;
        const topOffset = safeZone.top ? (safeZone.top / spec.height) * canvas.height : 0;
        const bottomOffset = safeZone.bottom ? (safeZone.bottom / spec.height) * canvas.height : 0;
        // Fill (avoid overlapping corners)
        ctx.fillStyle = `${zoneColor}, 0.15)`;
        ctx.fillRect(0, topOffset, leftWidth, canvas.height - topOffset - bottomOffset);
        // Border
        ctx.strokeStyle = `${zoneColor}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(leftWidth, topOffset);
        ctx.lineTo(leftWidth, canvas.height - bottomOffset);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Right safe zone (for feed formats)
      if (safeZone.right) {
        const rightWidth = (safeZone.right / spec.width) * canvas.width;
        const rightX = canvas.width - rightWidth;
        const topOffset = safeZone.top ? (safeZone.top / spec.height) * canvas.height : 0;
        const bottomOffset = safeZone.bottom ? (safeZone.bottom / spec.height) * canvas.height : 0;
        // Fill
        ctx.fillStyle = `${zoneColor}, 0.15)`;
        ctx.fillRect(rightX, topOffset, rightWidth, canvas.height - topOffset - bottomOffset);
        // Border
        ctx.strokeStyle = `${zoneColor}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(rightX, topOffset);
        ctx.lineTo(rightX, canvas.height - bottomOffset);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw alignment guides (when dragging)
    if (isDragging && (alignmentGuides.x !== null || alignmentGuides.y !== null)) {
      ctx.strokeStyle = '#ec4899'; // Pink for alignment guides
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const scale = scaled.scale * zoom;

      if (alignmentGuides.x !== null) {
        const guideX = alignmentGuides.x * scale;
        ctx.beginPath();
        ctx.moveTo(guideX, 0);
        ctx.lineTo(guideX, canvas.height);
        ctx.stroke();
      }

      if (alignmentGuides.y !== null) {
        const guideY = alignmentGuides.y * scale;
        ctx.beginPath();
        ctx.moveTo(0, guideY);
        ctx.lineTo(canvas.width, guideY);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // Draw elements
    elements.forEach((element, index) => {
      const scale = scaled.scale * zoom;
      const x = element.x * scale;
      const y = element.y * scale;

      if (element.type === 'text') {
        ctx.font = `${element.fontWeight} ${element.fontSize * scale}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.textAlign || 'left';

        // Handle text alignment
        let textX = x;
        if (element.textAlign === 'center') {
          textX = x + (element.width * scale) / 2;
        } else if (element.textAlign === 'right') {
          textX = x + element.width * scale;
        }

        // Word wrap
        const words = element.content.split(' ');
        let line = '';
        let lineY = y + element.fontSize * scale;
        const maxWidth = element.width * scale;

        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, textX, lineY);
            line = word + ' ';
            lineY += element.fontSize * scale * 1.2;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, textX, lineY);

      } else if (element.type === 'button') {
        const paddingX = (element.paddingX || 24) * scale;
        const paddingY = (element.paddingY || 12) * scale;
        const fontSize = element.fontSize * scale;

        ctx.font = `${element.fontWeight} ${fontSize}px ${element.fontFamily}`;
        const textWidth = ctx.measureText(element.content).width;

        const buttonWidth = textWidth + paddingX * 2;
        const buttonHeight = fontSize + paddingY * 2;

        // Draw button background
        ctx.fillStyle = element.backgroundColor || '#FBBF24';
        const radius = (element.borderRadius || 8) * scale;
        ctx.beginPath();
        ctx.roundRect(x, y, buttonWidth, buttonHeight, radius);
        ctx.fill();

        // Draw button text
        ctx.fillStyle = element.color || '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(element.content, x + buttonWidth / 2, y + paddingY + fontSize * 0.85);

      } else if (element.type === 'image') {
        const width = (element.width || 200) * scale;
        const height = (element.height || 200) * scale;
        const borderRadius = (element.borderRadius || 0) * scale;

        // If we have a loaded image, draw it
        if (element.image) {
          if (borderRadius > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, borderRadius);
            ctx.clip();
            ctx.drawImage(element.image, x, y, width, height);
            ctx.restore();
          } else {
            ctx.drawImage(element.image, x, y, width, height);
          }
        }
        // If we have imageSrc but no loaded image, show placeholder and trigger load
        else if (element.imageSrc) {
          // Draw placeholder while loading
          ctx.fillStyle = '#374151';
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, width, height);
          }
          ctx.fillStyle = '#9ca3af';
          ctx.font = `400 ${14 * scale}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('Loading...', x + width / 2, y + height / 2);

          // Lazy load the image if not already loading
          if (!loadingImages[element.id]) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              setElements(prev => prev.map(el =>
                el.id === element.id ? { ...el, image: img } : el
              ));
              setLoadingImages(prev => ({ ...prev, [element.id]: false }));
            };
            img.onerror = () => {
              setLoadingImages(prev => ({ ...prev, [element.id]: false }));
            };
            setLoadingImages(prev => ({ ...prev, [element.id]: true }));
            img.src = element.imageSrc;
          }
        }
        // Fallback: draw placeholder
        else {
          ctx.fillStyle = '#374151';
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, width, height);
          }
          ctx.fillStyle = '#9ca3af';
          ctx.font = `400 ${14 * scale}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('No Image', x + width / 2, y + height / 2);
        }
      } else if (element.type === 'vector') {
        // Draw vector/SVG path element
        const width = (element.width || 100) * scale;
        const height = (element.height || 100) * scale;

        if (element.path) {
          ctx.save();

          // Translate and scale the path (paths are normalized to 100x100)
          ctx.translate(x, y);
          ctx.scale(width / 100, height / 100);

          // Parse and draw the SVG path
          const path2D = new Path2D(element.path);

          // Fill
          if (element.fill) {
            ctx.fillStyle = element.fill;
            ctx.fill(path2D);
          }

          // Stroke
          if (element.stroke && element.strokeWidth > 0) {
            ctx.strokeStyle = element.stroke;
            ctx.lineWidth = element.strokeWidth;
            ctx.stroke(path2D);
          }

          ctx.restore();
        } else {
          // Fallback placeholder
          ctx.fillStyle = '#374151';
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = '#9ca3af';
          ctx.font = `400 ${14 * scale}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('Vector', x + width / 2, y + height / 2);
        }
      }

      // Draw selection indicator
      if (selectedElement === index) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        let bounds;
        if (element.type === 'text') {
          bounds = {
            x: x - 4,
            y: y - 4,
            width: (element.width || 200) * scale + 8,
            height: element.fontSize * scale * 2 + 8
          };
        } else if (element.type === 'button') {
          const paddingX = (element.paddingX || 24) * scale;
          const paddingY = (element.paddingY || 12) * scale;
          ctx.font = `${element.fontWeight} ${element.fontSize * scale}px ${element.fontFamily}`;
          const textWidth = ctx.measureText(element.content).width;
          bounds = {
            x: x - 4,
            y: y - 4,
            width: textWidth + paddingX * 2 + 8,
            height: element.fontSize * scale + paddingY * 2 + 8
          };
        } else if (element.type === 'image') {
          bounds = {
            x: x - 4,
            y: y - 4,
            width: ((element.width || 200) * scale) + 8,
            height: ((element.height || 200) * scale) + 8
          };
        } else if (element.type === 'vector') {
          bounds = {
            x: x - 4,
            y: y - 4,
            width: ((element.width || 100) * scale) + 8,
            height: ((element.height || 100) * scale) + 8
          };
        }

        if (bounds) {
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
        ctx.setLineDash([]);
      }
    });
  }, [elements, selectedElement, backgroundColor, backgroundImage, backgroundGradient, showGrid, showSafeZones, zoom, spec, selectedSpec, getScaledDimensions, loadingImages, isDragging, alignmentGuides]);

  // Redraw on changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle canvas click to select element
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaled = getScaledDimensions();
    const scale = scaled.scale * zoom;

    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    // Find clicked element (reverse order for top layer priority)
    let found = -1;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const elWidth = el.width || 200;
      const elHeight = el.type === 'text' ? el.fontSize * 2 : (el.height || 50);

      if (clickX >= el.x && clickX <= el.x + elWidth &&
          clickY >= el.y && clickY <= el.y + elHeight) {
        found = i;
        break;
      }
    }

    setSelectedElement(found >= 0 ? found : null);
  };

  // Handle element drag
  const handleMouseDown = (e) => {
    if (selectedElement === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaled = getScaledDimensions();
    const scale = scaled.scale * zoom;

    setIsDragging(true);
    setDragStart({
      x: (e.clientX - rect.left) / scale - elements[selectedElement].x,
      y: (e.clientY - rect.top) / scale - elements[selectedElement].y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || selectedElement === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaled = getScaledDimensions();
    const scale = scaled.scale * zoom;

    let newX = Math.max(0, (e.clientX - rect.left) / scale - dragStart.x);
    let newY = Math.max(0, (e.clientY - rect.top) / scale - dragStart.y);

    // Clear alignment guides
    let guideX = null;
    let guideY = null;

    if (snapEnabled) {
      // Get safe zone for current platform
      const safeZone = SAFE_ZONES[selectedSpec] || {};
      const safeLeft = safeZone.left || 54;
      const safeRight = spec.width - (safeZone.right || 54);
      const safeTop = safeZone.top || 54;
      const safeBottom = spec.height - (safeZone.bottom || 54);
      const centerX = spec.width / 2;
      const centerY = spec.height / 2;

      // Get element dimensions for proper alignment
      const currentEl = elements[selectedElement];
      const elWidth = currentEl?.width || 200;
      const elHeight = currentEl?.height || (currentEl?.fontSize || 32);

      // Snap points to check (element left, center, right edges)
      const snapPointsX = [
        { pos: newX, type: 'left' },
        { pos: newX + elWidth / 2, type: 'center' },
        { pos: newX + elWidth, type: 'right' }
      ];

      const snapPointsY = [
        { pos: newY, type: 'top' },
        { pos: newY + elHeight / 2, type: 'middle' },
        { pos: newY + elHeight, type: 'bottom' }
      ];

      // Snap targets (safe zones, center, edges)
      const targetsX = [
        { pos: 0, name: 'edge-left' },
        { pos: safeLeft, name: 'safe-left' },
        { pos: centerX, name: 'center' },
        { pos: safeRight, name: 'safe-right' },
        { pos: spec.width, name: 'edge-right' }
      ];

      const targetsY = [
        { pos: 0, name: 'edge-top' },
        { pos: safeTop, name: 'safe-top' },
        { pos: centerY, name: 'center' },
        { pos: safeBottom, name: 'safe-bottom' },
        { pos: spec.height, name: 'edge-bottom' }
      ];

      // Find closest snap for X
      for (const point of snapPointsX) {
        for (const target of targetsX) {
          if (Math.abs(point.pos - target.pos) < snapThreshold) {
            if (point.type === 'left') {
              newX = target.pos;
            } else if (point.type === 'center') {
              newX = target.pos - elWidth / 2;
            } else if (point.type === 'right') {
              newX = target.pos - elWidth;
            }
            guideX = target.pos;
            break;
          }
        }
        if (guideX !== null) break;
      }

      // Find closest snap for Y
      for (const point of snapPointsY) {
        for (const target of targetsY) {
          if (Math.abs(point.pos - target.pos) < snapThreshold) {
            if (point.type === 'top') {
              newY = target.pos;
            } else if (point.type === 'middle') {
              newY = target.pos - elHeight / 2;
            } else if (point.type === 'bottom') {
              newY = target.pos - elHeight;
            }
            guideY = target.pos;
            break;
          }
        }
        if (guideY !== null) break;
      }

      // Snap to grid if no other snap points matched
      if (guideX === null) {
        newX = Math.round(newX / gridSize) * gridSize;
      }
      if (guideY === null) {
        newY = Math.round(newY / gridSize) * gridSize;
      }
    }

    setAlignmentGuides({ x: guideX, y: guideY });

    setElements(prev => prev.map((el, i) =>
      i === selectedElement ? { ...el, x: newX, y: newY } : el
    ));
  };

  const handleMouseUp = () => {
    setAlignmentGuides({ x: null, y: null });
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = useCallback((e) => {
    // Only zoom if Ctrl/Cmd is pressed to not interfere with scrolling
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.min(3, Math.max(0.25, z + delta)));
    }
  }, []);

  // Fit canvas to view
  const fitToView = useCallback(() => {
    const container = canvasRef.current?.parentElement;
    if (!container || !spec) return;

    const containerWidth = container.clientWidth - 48; // Account for padding
    const containerHeight = container.clientHeight - 48;

    const { width, height } = getScaledDimensions();
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;

    setZoom(Math.min(scaleX, scaleY, 1)); // Don't exceed 100%
  }, [spec, getScaledDimensions]);

  // Reset zoom to 100%
  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Add element
  const addElement = (templateKey) => {
    const template = DEFAULT_ELEMENTS[templateKey];
    if (!template) return;

    // Center the element
    const centerX = (spec.width - (template.width || 200)) / 2;
    const newElement = {
      ...template,
      x: centerX,
      y: template.y,
      id: Date.now()
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(elements.length);
  };

  // Delete selected element
  const deleteElement = () => {
    if (selectedElement === null) return;

    setElements(prev => prev.filter((_, i) => i !== selectedElement));
    setSelectedElement(null);
  };

  // Layer ordering - bring forward
  const bringForward = () => {
    if (selectedElement === null || selectedElement >= elements.length - 1) return;

    setElements(prev => {
      const newElements = [...prev];
      [newElements[selectedElement], newElements[selectedElement + 1]] =
        [newElements[selectedElement + 1], newElements[selectedElement]];
      return newElements;
    });
    setSelectedElement(selectedElement + 1);
  };

  // Layer ordering - send backward
  const sendBackward = () => {
    if (selectedElement === null || selectedElement <= 0) return;

    setElements(prev => {
      const newElements = [...prev];
      [newElements[selectedElement], newElements[selectedElement - 1]] =
        [newElements[selectedElement - 1], newElements[selectedElement]];
      return newElements;
    });
    setSelectedElement(selectedElement - 1);
  };

  // Calculate element dimensions (needed for alignment)
  const getElementDimensions = useCallback((element) => {
    if (!element) return { width: 100, height: 50 };

    if (element.type === 'text') {
      // Text elements have explicit width, calculate height from fontSize * line count
      return {
        width: element.width || 200,
        height: element.fontSize || 32
      };
    }

    if (element.type === 'button') {
      // Button width = text width + padding * 2
      // We need to measure text width using canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.font = `${element.fontWeight || '600'} ${element.fontSize || 18}px ${element.fontFamily || 'Inter, sans-serif'}`;
        const textWidth = ctx.measureText(element.content || 'Button').width;
        const paddingX = element.paddingX || 24;
        const paddingY = element.paddingY || 12;
        return {
          width: textWidth + paddingX * 2,
          height: (element.fontSize || 18) + paddingY * 2
        };
      }
      // Fallback if no canvas
      const paddingX = element.paddingX || 24;
      const paddingY = element.paddingY || 12;
      const estimatedTextWidth = (element.content || 'Button').length * (element.fontSize || 18) * 0.6;
      return {
        width: estimatedTextWidth + paddingX * 2,
        height: (element.fontSize || 18) + paddingY * 2
      };
    }

    if (element.type === 'image') {
      return {
        width: element.width || 200,
        height: element.height || 200
      };
    }

    if (element.type === 'vector') {
      return {
        width: element.width || 100,
        height: element.height || 100
      };
    }

    // Default fallback
    return { width: 100, height: 50 };
  }, []);

  // Copy element to clipboard
  const copyElement = useCallback(() => {
    if (selectedElement === null) return;
    const el = elements[selectedElement];
    // Deep clone, but skip the actual image object (can't be cloned)
    const cloned = { ...el };
    if (cloned.type === 'image') {
      cloned.imageSrc = cloned.image?.src || null;
      cloned.image = null; // Will be restored on paste
    }
    setClipboard(cloned);
  }, [selectedElement, elements]);

  // Paste element from clipboard
  const pasteElement = useCallback(() => {
    if (!clipboard) return;

    const newElement = {
      ...clipboard,
      id: Date.now(),
      x: clipboard.x + 20, // Offset so it's visible
      y: clipboard.y + 20
    };

    // Restore image if it was an image element
    if (newElement.type === 'image' && newElement.imageSrc) {
      const img = new Image();
      img.onload = () => {
        newElement.image = img;
        setElements(prev => [...prev, newElement]);
        setSelectedElement(elements.length);
      };
      img.src = newElement.imageSrc;
    } else {
      setElements(prev => [...prev, newElement]);
      setSelectedElement(elements.length);
    }
  }, [clipboard, elements.length]);

  // Paste image from system clipboard
  const pasteFromSystemClipboard = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        // Check for image types
        const imageTypes = item.types.filter(t => t.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvasWidth = spec.width;
              const canvasHeight = spec.height;
              // Scale image to fit canvas while maintaining aspect ratio
              let width = img.width;
              let height = img.height;
              const maxSize = Math.min(canvasWidth * 0.8, canvasHeight * 0.8);
              if (width > height && width > maxSize) {
                height = (height / width) * maxSize;
                width = maxSize;
              } else if (height > maxSize) {
                width = (width / height) * maxSize;
                height = maxSize;
              }

              const newElement = {
                type: 'image',
                id: Date.now(),
                x: (canvasWidth - width) / 2,
                y: (canvasHeight - height) / 2,
                width: width,
                height: height,
                image: img,
                imageSrc: e.target.result
              };

              setElements(prev => [...prev, newElement]);
              setSelectedElement(elements.length);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(blob);
          return true;
        }
      }
    } catch (err) {
      console.log('System clipboard access not available or no image:', err);
    }
    return false;
  }, [spec, elements.length]);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        copyElement();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        // Try system clipboard first for images
        const pastedFromSystem = await pasteFromSystemClipboard();
        if (!pastedFromSystem) {
          // Fall back to internal clipboard
          pasteElement();
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement !== null) {
        e.preventDefault();
        deleteElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyElement, pasteElement, pasteFromSystemClipboard, selectedElement, deleteElement]);

  // Apply prebuilt template
  const applyTemplate = (template) => {
    // Set background based on bgMode
    if (template.bgMode === 'image' && template.backgroundImageUrl) {
      // Load background image from URL
      setBgMode('image');
      setBackgroundGradient(null);
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => setBackgroundImage(bgImg);
      bgImg.onerror = () => {
        // Fallback to solid color if image fails
        setBgMode('solid');
        setBackgroundColor('#1f2937');
      };
      bgImg.src = template.backgroundImageUrl;
    } else if (template.bgMode === 'gradient' && template.backgroundGradient) {
      setBgMode('gradient');
      setBackgroundGradient(template.backgroundGradient);
      setBackgroundImage(null);
    } else if (template.bgMode === 'solid' && template.backgroundColor) {
      setBgMode('solid');
      setBackgroundColor(template.backgroundColor);
      setBackgroundGradient(null);
      setBackgroundImage(null);
    }

    // Scale elements to current canvas size
    const scaleX = spec.width / 1080; // Templates designed for 1080 width
    const scaleY = spec.height / 1350; // Templates designed for 1350 height
    const uniformScale = Math.min(scaleX, scaleY);

    const scaledElements = template.elements.map((el, i) => {
      const baseElement = {
        ...el,
        x: el.x * scaleX,
        y: el.y * scaleY,
        id: Date.now() + i
      };

      // Scale width if present
      if (el.width) {
        baseElement.width = el.width * scaleX;
      }

      // Scale height for image elements
      if (el.height) {
        baseElement.height = el.height * scaleY;
      }

      // Scale font size for text/button elements
      if (el.fontSize) {
        baseElement.fontSize = Math.round(el.fontSize * uniformScale);
      }

      // Scale border radius
      if (el.borderRadius) {
        baseElement.borderRadius = Math.round(el.borderRadius * uniformScale);
      }

      // Scale padding for buttons
      if (el.paddingX) {
        baseElement.paddingX = Math.round(el.paddingX * uniformScale);
      }
      if (el.paddingY) {
        baseElement.paddingY = Math.round(el.paddingY * uniformScale);
      }

      return baseElement;
    });

    // Clear loading images state for new elements
    setLoadingImages({});
    setElements(scaledElements);
    setSelectedElement(null);
    setShowTemplates(false);
  };

  // Add vector element from preset
  const addVectorFromPreset = useCallback((preset) => {
    const centerX = (spec.width - 100) / 2;
    const centerY = (spec.height - 100) / 2;

    const newElement = {
      type: 'vector',
      id: Date.now(),
      x: centerX,
      y: centerY,
      width: 100,
      height: 100,
      path: preset.path,
      fill: '#FBBF24',
      stroke: null,
      strokeWidth: 0,
      content: preset.name
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(elements.length);
    setShowVectorPicker(false);
  }, [spec, elements.length]);

  // Generate vector using AI
  const generateVectorWithAI = useCallback(async () => {
    if (!vectorAIPrompt.trim()) return;

    setIsGeneratingVector(true);
    setGeneratedVectorPath(null);

    try {
      const response = await fetch('https://us-central1-yellowcircle-app.cloudfunctions.net/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an SVG path generator. Create a simple, clean SVG path for: "${vectorAIPrompt}"

Requirements:
- Output ONLY the SVG path "d" attribute value, nothing else
- Path must be normalized to a 100x100 viewBox (coordinates 0-100)
- Use simple geometric shapes - lines (L), moves (M), curves (C, Q), arcs (A)
- Keep it simple and scalable (no complex details)
- End paths with Z to close them
- Example output format: M50 5 L61 40 L97 40 L68 62 L79 97 L50 75 L21 97 L32 62 L3 40 L39 40 Z

Generate the path now:`,
          contentType: 'vectorPath',
          maxTokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate vector');
      }

      const data = await response.json();
      let pathContent = (data.content || '').trim();

      // Clean up the response - extract just the path
      if (pathContent.includes('d="')) {
        const match = pathContent.match(/d="([^"]+)"/);
        if (match) pathContent = match[1];
      }

      // Remove any markdown code blocks
      pathContent = pathContent.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();

      // Validate it looks like a path (starts with M)
      if (!pathContent.startsWith('M')) {
        throw new Error('Invalid path generated');
      }

      setGeneratedVectorPath(pathContent);
    } catch (err) {
      console.error('Vector generation error:', err);
      // Fallback to a simple shape
      setGeneratedVectorPath('M50 5 L90 90 L10 90 Z'); // Triangle fallback
    } finally {
      setIsGeneratingVector(false);
    }
  }, [vectorAIPrompt]);

  // Add generated vector to canvas
  const addGeneratedVector = useCallback(() => {
    if (!generatedVectorPath) return;

    const centerX = (spec.width - 120) / 2;
    const centerY = (spec.height - 120) / 2;

    const newElement = {
      type: 'vector',
      id: Date.now(),
      x: centerX,
      y: centerY,
      width: 120,
      height: 120,
      path: generatedVectorPath,
      fill: '#FBBF24',
      stroke: null,
      strokeWidth: 0,
      content: 'AI Generated'
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(elements.length);
    setShowVectorPicker(false);
    setGeneratedVectorPath(null);
    setVectorAIPrompt('');
  }, [generatedVectorPath, spec, elements.length]);

  // Update selected element property
  const updateElement = (property, value) => {
    if (selectedElement === null) return;

    setElements(prev => prev.map((el, i) =>
      i === selectedElement ? { ...el, [property]: value } : el
    ));
  };

  // Handle background image upload
  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
    };
    img.src = URL.createObjectURL(file);
  };

  // Handle layer image upload (adds image as a draggable layer)
  const handleLayerImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      // Calculate size to fit nicely on canvas while maintaining aspect ratio
      const maxSize = Math.min(spec.width, spec.height) * 0.4;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = width * ratio;
        height = height * ratio;
      }

      // Center the image on canvas
      const centerX = (spec.width - width) / 2;
      const centerY = (spec.height - height) / 2;

      const newElement = {
        type: 'image',
        x: centerX,
        y: centerY,
        width: width,
        height: height,
        image: img,
        content: file.name || 'Image Layer',
        id: Date.now()
      };

      setElements(prev => [...prev, newElement]);
      setSelectedElement(elements.length);
    };
    img.src = URL.createObjectURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Export canvas at full resolution
  const handleExport = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = spec.width;
    exportCanvas.height = spec.height;
    const ctx = exportCanvas.getContext('2d');

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, spec.width, spec.height);
    } else if (backgroundGradient) {
      const gradient = ctx.createLinearGradient(0, 0, spec.width, spec.height);
      const preset = GRADIENT_PRESETS.find(g => g.value === backgroundGradient);
      if (preset && preset.colors) {
        preset.colors.forEach((color, i) => {
          gradient.addColorStop(i / (preset.colors.length - 1), color);
        });
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, spec.width, spec.height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, spec.width, spec.height);
    }

    // Draw elements at full resolution
    elements.forEach(element => {
      if (element.type === 'text') {
        ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.textAlign || 'left';

        let textX = element.x;
        if (element.textAlign === 'center') {
          textX = element.x + element.width / 2;
        } else if (element.textAlign === 'right') {
          textX = element.x + element.width;
        }

        const words = element.content.split(' ');
        let line = '';
        let lineY = element.y + element.fontSize;
        const maxWidth = element.width;

        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, textX, lineY);
            line = word + ' ';
            lineY += element.fontSize * 1.2;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, textX, lineY);

      } else if (element.type === 'button') {
        const paddingX = element.paddingX || 24;
        const paddingY = element.paddingY || 12;

        ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
        const textWidth = ctx.measureText(element.content).width;

        const buttonWidth = textWidth + paddingX * 2;
        const buttonHeight = element.fontSize + paddingY * 2;

        ctx.fillStyle = element.backgroundColor || '#FBBF24';
        const radius = element.borderRadius || 8;
        ctx.beginPath();
        ctx.roundRect(element.x, element.y, buttonWidth, buttonHeight, radius);
        ctx.fill();

        ctx.fillStyle = element.color || '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(element.content, element.x + buttonWidth / 2, element.y + paddingY + element.fontSize * 0.85);

      } else if (element.type === 'image' && element.image) {
        const width = element.width || 200;
        const height = element.height || 200;
        const borderRadius = element.borderRadius || 0;

        if (borderRadius > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(element.x, element.y, width, height, borderRadius);
          ctx.clip();
          ctx.drawImage(element.image, element.x, element.y, width, height);
          ctx.restore();
        } else {
          ctx.drawImage(element.image, element.x, element.y, width, height);
        }
      } else if (element.type === 'vector' && element.path) {
        const width = element.width || 100;
        const height = element.height || 100;

        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.scale(width / 100, height / 100);

        const path2D = new Path2D(element.path);

        if (element.fill) {
          ctx.fillStyle = element.fill;
          ctx.fill(path2D);
        }

        if (element.stroke && element.strokeWidth > 0) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = element.strokeWidth;
          ctx.stroke(path2D);
        }

        ctx.restore();
      }
    });

    // Download
    const link = document.createElement('a');
    link.download = `${creativeName.replace(/\s+/g, '-').toLowerCase()}-${spec.width}x${spec.height}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    if (onExport) {
      onExport({
        name: creativeName,
        spec: selectedSpec,
        width: spec.width,
        height: spec.height,
        dataUrl: exportCanvas.toDataURL('image/png')
      });
    }
  };

  // Save creative data
  const handleSave = () => {
    if (onSave) {
      onSave({
        name: creativeName,
        spec: selectedSpec,
        elements,
        backgroundColor,
        backgroundImage: backgroundImage?.src || null
      });
    }
  };

  const selectedEl = selectedElement !== null ? elements[selectedElement] : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: isDarkTheme ? '#111827' : '#f9fafb'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 24px',
        borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ← Back
          </button>

          <input
            type="text"
            value={creativeName}
            onChange={(e) => setCreativeName(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              fontSize: '14px',
              width: '200px'
            }}
          />

          {/* Platform selector */}
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <optgroup label="Instagram">
              <option value="instagram_feed_square">Feed Square (1080×1080)</option>
              <option value="instagram_feed_portrait">Feed Portrait (1080×1350)</option>
              <option value="instagram_story">Story/Reel (1080×1920)</option>
            </optgroup>
            <optgroup label="Facebook">
              <option value="facebook_feed_square">Feed Square (1080×1080)</option>
              <option value="facebook_feed_portrait">Feed Portrait (1080×1350)</option>
              <option value="facebook_story">Story (1080×1920)</option>
            </optgroup>
            <optgroup label="LinkedIn">
              <option value="linkedin_sponsored">Sponsored (1200×627)</option>
              <option value="linkedin_square">Square (1200×1200)</option>
            </optgroup>
            <optgroup label="Google Display">
              <option value="google_medium_rectangle">Medium Rectangle (300×250)</option>
              <option value="google_leaderboard">Leaderboard (728×90)</option>
              <option value="google_responsive_landscape">Responsive Landscape (1200×628)</option>
              <option value="google_responsive_square">Responsive Square (1200×1200)</option>
            </optgroup>
          </select>

          <span style={{
            fontSize: '12px',
            color: isDarkTheme ? '#6b7280' : '#9ca3af'
          }}>
            {spec.width} × {spec.height}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* View Controls Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#f3f4f6',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setShowGrid(!showGrid)}
              style={{
                padding: '6px',
                backgroundColor: showGrid ? '#FBBF24' : 'transparent',
                color: showGrid ? '#000' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Toggle Grid"
            >
              <Grid size={14} />
            </button>

            <button
              onClick={() => setShowSafeZones(!showSafeZones)}
              style={{
                padding: '4px 8px',
                backgroundColor: showSafeZones ? '#FBBF24' : 'transparent',
                color: showSafeZones ? '#000' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}
              title="Toggle Safe Zones - Red areas indicate UI overlays"
            >
              {showSafeZones ? <Shield size={12} /> : <ShieldOff size={12} />}
              <span>SAFE</span>
            </button>

            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              style={{
                padding: '4px 8px',
                backgroundColor: snapEnabled ? '#8b5cf6' : 'transparent',
                color: snapEnabled ? '#fff' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}
              title="Snap to Grid & Safe Zones"
            >
              <Grid size={12} />
              <span>SNAP</span>
            </button>
          </div>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            backgroundColor: isDarkTheme ? '#374151' : '#d1d5db'
          }} />

          {/* Zoom Controls Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '4px 6px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#f3f4f6',
            borderRadius: '8px'
          }}>
            <button
              onClick={fitToView}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                padding: '4px 6px',
                fontSize: '10px',
                fontWeight: '500',
                borderRadius: '4px'
              }}
              title="Fit to View"
            >
              Fit
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Zoom Out"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={resetZoom}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: zoom === 1 ? '#FBBF24' : (isDarkTheme ? '#d1d5db' : '#374151'),
                padding: '2px 4px',
                fontSize: '11px',
                fontWeight: '500',
                minWidth: '40px',
                textAlign: 'center'
              }}
              title="Reset to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.1))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Zoom In"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            backgroundColor: isDarkTheme ? '#374151' : '#d1d5db'
          }} />

          {/* Action Buttons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '6px 12px',
                backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                color: isDarkTheme ? '#f9fafb' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              💾 Save
            </button>

            <button
              onClick={handleExport}
              style={{
                padding: '6px 12px',
                backgroundColor: '#FBBF24',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={12} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left toolbar */}
        <div style={{
          width: '60px',
          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
          borderRight: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Templates button */}
          <button
            onClick={() => setShowTemplates(true)}
            style={{
              padding: '12px',
              backgroundColor: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Start from Template"
          >
            <Layers size={18} style={{ color: '#fff' }} />
            <span style={{ fontSize: '8px', color: '#fff', fontWeight: '600' }}>Templates</span>
          </button>

          <div style={{
            height: '1px',
            backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
            margin: '4px 0'
          }} />

          <button
            onClick={() => addElement('headline')}
            style={{
              padding: '12px',
              backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Add Headline"
          >
            <Type size={18} style={{ color: isDarkTheme ? '#d1d5db' : '#374151' }} />
            <span style={{ fontSize: '9px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>Headline</span>
          </button>

          <button
            onClick={() => addElement('subtext')}
            style={{
              padding: '12px',
              backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Add Text"
          >
            <Type size={14} style={{ color: isDarkTheme ? '#d1d5db' : '#374151' }} />
            <span style={{ fontSize: '9px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>Text</span>
          </button>

          <button
            onClick={() => addElement('cta')}
            style={{
              padding: '12px',
              backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Add CTA Button"
          >
            <Square size={18} style={{ color: isDarkTheme ? '#d1d5db' : '#374151' }} />
            <span style={{ fontSize: '9px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>CTA</span>
          </button>

          <div style={{
            height: '1px',
            backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
            margin: '8px 0'
          }} />

          {/* Layer Image Upload - adds draggable/resizable image layer */}
          <input
            type="file"
            ref={layerImageInputRef}
            accept="image/*"
            onChange={handleLayerImageUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => layerImageInputRef.current?.click()}
            style={{
              padding: '12px',
              backgroundColor: '#FBBF24',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Add Photo Layer (drag & resize)"
          >
            <Plus size={14} style={{ color: '#000', position: 'absolute', marginTop: '-2px', marginLeft: '12px' }} />
            <ImageIcon size={18} style={{ color: '#000' }} />
            <span style={{ fontSize: '9px', color: '#000', fontWeight: '600' }}>Photo</span>
          </button>

          {/* Vector/Shape button */}
          <button
            onClick={() => setShowVectorPicker(true)}
            style={{
              padding: '12px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Add Vector Shape (AI + presets)"
          >
            <Hexagon size={18} style={{ color: '#fff' }} />
            <span style={{ fontSize: '9px', color: '#fff', fontWeight: '600' }}>Vector</span>
          </button>

          <div style={{
            height: '1px',
            backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
            margin: '8px 0'
          }} />

          {/* Background Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleBackgroundUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '12px',
              backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Upload Background Image"
          >
            <ImageIcon size={18} style={{ color: isDarkTheme ? '#d1d5db' : '#374151' }} />
            <span style={{ fontSize: '9px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>BG</span>
          </button>
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkTheme ? '#0f172a' : '#e5e7eb',
            overflow: 'auto',
            padding: '24px',
            position: 'relative'
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              cursor: isDragging ? 'grabbing' : (selectedElement !== null ? 'grab' : 'pointer')
            }}
          />
        </div>

        {/* Right panel - Properties */}
        <div style={{
          width: '280px',
          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
          borderLeft: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Background settings */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Background
            </h4>

            {/* Background mode tabs */}
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '12px',
              padding: '4px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#f3f4f6',
              borderRadius: '8px'
            }}>
              {['solid', 'gradient', 'image'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setBgMode(mode)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    backgroundColor: bgMode === mode ? (isDarkTheme ? '#374151' : '#ffffff') : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: bgMode === mode
                      ? (isDarkTheme ? '#f9fafb' : '#111827')
                      : (isDarkTheme ? '#9ca3af' : '#6b7280'),
                    fontSize: '11px',
                    fontWeight: bgMode === mode ? '600' : '400',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Solid colors */}
            {bgMode === 'solid' && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {BRAND_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setBackgroundColor(color);
                        setBackgroundImage(null);
                        setBackgroundGradient(null);
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: color,
                        border: backgroundColor === color && !backgroundImage && !backgroundGradient
                          ? '3px solid #FBBF24'
                          : `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
                {/* Custom color picker */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setBackgroundColor(e.target.value);
                      setBackgroundImage(null);
                      setBackgroundGradient(null);
                    }}
                    style={{
                      width: '36px',
                      height: '28px',
                      padding: 0,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomColor(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        setBackgroundColor(val);
                        setBackgroundImage(null);
                        setBackgroundGradient(null);
                      }
                    }}
                    placeholder="#FFFFFF"
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                      color: isDarkTheme ? '#f9fafb' : '#111827',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </>
            )}

            {/* Gradient presets and custom builder */}
            {bgMode === 'gradient' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Presets */}
                <div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>Presets</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {GRADIENT_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setBackgroundGradient(preset.value);
                          setBackgroundImage(null);
                        }}
                        style={{
                          width: '36px',
                          height: '24px',
                          borderRadius: '4px',
                          background: preset.value,
                          border: backgroundGradient === preset.value
                            ? '2px solid #FBBF24'
                            : `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                          cursor: 'pointer'
                        }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Gradient Builder */}
                <div style={{
                  padding: '12px',
                  backgroundColor: isDarkTheme ? '#1f2937' : '#f9fafb',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af',
                    textTransform: 'uppercase',
                    marginBottom: '10px'
                  }}>Custom Gradient</div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        fontSize: '10px',
                        color: isDarkTheme ? '#9ca3af' : '#6b7280',
                        display: 'block',
                        marginBottom: '4px'
                      }}>Start</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={customGradientStart}
                          onChange={(e) => setCustomGradientStart(e.target.value)}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: '0',
                            border: `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={customGradientStart}
                          onChange={(e) => setCustomGradientStart(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            color: isDarkTheme ? '#d1d5db' : '#374151'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        fontSize: '10px',
                        color: isDarkTheme ? '#9ca3af' : '#6b7280',
                        display: 'block',
                        marginBottom: '4px'
                      }}>End</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={customGradientEnd}
                          onChange={(e) => setCustomGradientEnd(e.target.value)}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: '0',
                            border: `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={customGradientEnd}
                          onChange={(e) => setCustomGradientEnd(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            color: isDarkTheme ? '#d1d5db' : '#374151'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{
                      fontSize: '10px',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span>Angle</span>
                      <span style={{ fontFamily: 'monospace' }}>{customGradientAngle}°</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={customGradientAngle}
                      onChange={(e) => setCustomGradientAngle(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Preview & Apply */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '6px',
                      background: `linear-gradient(${customGradientAngle}deg, ${customGradientStart} 0%, ${customGradientEnd} 100%)`,
                      border: `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`
                    }} />
                    <button
                      onClick={() => {
                        const customGradient = `linear-gradient(${customGradientAngle}deg, ${customGradientStart} 0%, ${customGradientEnd} 100%)`;
                        setBackgroundGradient(customGradient);
                        setBackgroundImage(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FBBF24',
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Image mode */}
            {bgMode === 'image' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '12px',
                    backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                    border: `2px dashed ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                    borderRadius: '8px',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ImageIcon size={16} />
                  {backgroundImage ? 'Change Image' : 'Upload Image'}
                </button>

                {backgroundImage && (
                  <button
                    onClick={() => setBackgroundImage(null)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#dc2626',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    Remove Image
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Selected element properties */}
          {selectedEl && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  {selectedEl.type === 'image' ? 'Image' : selectedEl.type === 'button' ? 'Button' : 'Text'} Properties
                </h4>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* Layer ordering buttons */}
                  <button
                    onClick={sendBackward}
                    disabled={selectedElement <= 0}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: selectedElement <= 0
                        ? (isDarkTheme ? '#4b5563' : '#d1d5db')
                        : (isDarkTheme ? '#d1d5db' : '#374151'),
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedElement <= 0 ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Send Backward"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={bringForward}
                    disabled={selectedElement >= elements.length - 1}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: selectedElement >= elements.length - 1
                        ? (isDarkTheme ? '#4b5563' : '#d1d5db')
                        : (isDarkTheme ? '#d1d5db' : '#374151'),
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedElement >= elements.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Bring Forward"
                  >
                    <ArrowUp size={12} />
                  </button>
                  {/* Copy button */}
                  <button
                    onClick={copyElement}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Copy (⌘C)"
                  >
                    <Copy size={12} />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={deleteElement}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  Content
                </label>
                <input
                  type="text"
                  value={selectedEl.content}
                  onChange={(e) => updateElement('content', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                    color: isDarkTheme ? '#f9fafb' : '#111827',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Font size */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  Font Size: {selectedEl.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={selectedEl.fontSize}
                  onChange={(e) => updateElement('fontSize', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Font family */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  Font
                </label>
                <select
                  value={selectedEl.fontFamily}
                  onChange={(e) => updateElement('fontFamily', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                    color: isDarkTheme ? '#f9fafb' : '#111827',
                    fontSize: '13px'
                  }}
                >
                  <optgroup label="Sans-serif">
                    {FONT_OPTIONS.filter(f => f.category === 'Sans-serif').map(font => (
                      <option key={font.value} value={font.value}>{font.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Serif">
                    {FONT_OPTIONS.filter(f => f.category === 'Serif').map(font => (
                      <option key={font.value} value={font.value}>{font.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Display">
                    {FONT_OPTIONS.filter(f => f.category === 'Display').map(font => (
                      <option key={font.value} value={font.value}>{font.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Monospace">
                    {FONT_OPTIONS.filter(f => f.category === 'Mono').map(font => (
                      <option key={font.value} value={font.value}>{font.name}</option>
                    ))}
                  </optgroup>
                  {customFonts.length > 0 && (
                    <optgroup label="Custom Fonts">
                      {customFonts.map(font => (
                        <option key={font.value} value={font.value}>{font.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  onClick={() => setShowFontManager(true)}
                  style={{
                    marginTop: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                    color: isDarkTheme ? '#d1d5db' : '#4b5563',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  + Manage Custom Fonts
                </button>
              </div>

              {/* Font weight */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '6px'
                }}>
                  Weight
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { value: '300', label: 'Light' },
                    { value: '400', label: 'Regular' },
                    { value: '500', label: 'Medium' },
                    { value: '600', label: 'Semi' },
                    { value: '700', label: 'Bold' },
                    { value: '800', label: 'Extra' },
                    { value: '900', label: 'Black' }
                  ].map(w => (
                    <button
                      key={w.value}
                      onClick={() => updateElement('fontWeight', w.value)}
                      style={{
                        padding: '5px 8px',
                        fontSize: '10px',
                        fontWeight: w.value,
                        backgroundColor: selectedEl.fontWeight === w.value
                          ? '#FBBF24'
                          : (isDarkTheme ? '#374151' : '#f3f4f6'),
                        color: selectedEl.fontWeight === w.value
                          ? '#000'
                          : (isDarkTheme ? '#d1d5db' : '#374151'),
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text color */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  Text Color
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {BRAND_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateElement('color', color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: color,
                        border: selectedEl.color === color
                          ? '2px solid #FBBF24'
                          : `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
                {/* Custom text color */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={selectedEl.color || '#FFFFFF'}
                    onChange={(e) => updateElement('color', e.target.value)}
                    style={{
                      width: '28px',
                      height: '24px',
                      padding: 0,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '11px',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af',
                    fontFamily: 'monospace'
                  }}>
                    {selectedEl.color || '#FFFFFF'}
                  </span>
                </div>
              </div>

              {/* Text align (for text elements) */}
              {selectedEl.type === 'text' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Alignment
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        onClick={() => updateElement('textAlign', align)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: selectedEl.textAlign === align
                            ? '#FBBF24'
                            : (isDarkTheme ? '#374151' : '#f3f4f6'),
                          color: selectedEl.textAlign === align
                            ? '#000'
                            : (isDarkTheme ? '#d1d5db' : '#374151'),
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {align === 'left' && <AlignLeft size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'right' && <AlignRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Button background color (for buttons) */}
              {selectedEl.type === 'button' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Button Color
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {BRAND_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateElement('backgroundColor', color)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: color,
                          border: selectedEl.backgroundColor === color
                            ? '2px solid #FBBF24'
                            : `1px solid ${isDarkTheme ? '#4b5563' : '#d1d5db'}`,
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Image dimensions (for images) */}
              {selectedEl.type === 'image' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Size
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>W</span>
                      <input
                        type="number"
                        value={Math.round(selectedEl.width || 200)}
                        onChange={(e) => updateElement('width', parseInt(e.target.value) || 200)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '4px',
                          backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                          color: isDarkTheme ? '#f9fafb' : '#111827',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>H</span>
                      <input
                        type="number"
                        value={Math.round(selectedEl.height || 200)}
                        onChange={(e) => updateElement('height', parseInt(e.target.value) || 200)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '4px',
                          backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                          color: isDarkTheme ? '#f9fafb' : '#111827',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        const scale = 0.9;
                        updateElement('width', Math.round((selectedEl.width || 200) * scale));
                        setTimeout(() => updateElement('height', Math.round((selectedEl.height || 200) * scale)), 0);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        color: isDarkTheme ? '#d1d5db' : '#374151',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={12} /> 10%
                    </button>
                    <button
                      onClick={() => {
                        const scale = 1.1;
                        updateElement('width', Math.round((selectedEl.width || 200) * scale));
                        setTimeout(() => updateElement('height', Math.round((selectedEl.height || 200) * scale)), 0);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        color: isDarkTheme ? '#d1d5db' : '#374151',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={12} /> 10%
                    </button>
                  </div>
                </div>
              )}

              {/* Vector properties (for vectors) */}
              {selectedEl.type === 'vector' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Size
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>W</span>
                        <input
                          type="number"
                          value={Math.round(selectedEl.width || 100)}
                          onChange={(e) => updateElement('width', parseInt(e.target.value) || 100)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '4px',
                            backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                            color: isDarkTheme ? '#f9fafb' : '#111827',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>H</span>
                        <input
                          type="number"
                          value={Math.round(selectedEl.height || 100)}
                          onChange={(e) => updateElement('height', parseInt(e.target.value) || 100)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '4px',
                            backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                            color: isDarkTheme ? '#f9fafb' : '#111827',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          const scale = 0.9;
                          updateElement('width', Math.round((selectedEl.width || 100) * scale));
                          setTimeout(() => updateElement('height', Math.round((selectedEl.height || 100) * scale)), 0);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          color: isDarkTheme ? '#d1d5db' : '#374151',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={12} /> 10%
                      </button>
                      <button
                        onClick={() => {
                          const scale = 1.1;
                          updateElement('width', Math.round((selectedEl.width || 100) * scale));
                          setTimeout(() => updateElement('height', Math.round((selectedEl.height || 100) * scale)), 0);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          color: isDarkTheme ? '#d1d5db' : '#374151',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} /> 10%
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Fill Color
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {BRAND_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement('fill', color)}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            border: selectedEl.fill === color ? '2px solid #FBBF24' : '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedEl.fill || '#FBBF24'}
                        onChange={(e) => updateElement('fill', e.target.value)}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Custom color"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Stroke
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={selectedEl.stroke || '#000000'}
                        onChange={(e) => updateElement('stroke', e.target.value)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>Width</span>
                        <input
                          type="number"
                          value={selectedEl.strokeWidth || 0}
                          onChange={(e) => updateElement('strokeWidth', parseInt(e.target.value) || 0)}
                          min={0}
                          max={20}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '4px',
                            backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                            color: isDarkTheme ? '#f9fafb' : '#111827',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Position */}
              {/* Quick Alignment */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '6px'
                }}>
                  Align to Canvas
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {/* Horizontal alignment */}
                  <button
                    onClick={() => updateElement('x', 20)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '10px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Align Left"
                  >
                    <AlignLeft size={12} /> Left
                  </button>
                  <button
                    onClick={() => {
                      const dims = getElementDimensions(selectedEl);
                      updateElement('x', (spec.width - dims.width) / 2);
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '10px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Center Horizontally"
                  >
                    <AlignCenter size={12} /> Center
                  </button>
                  <button
                    onClick={() => {
                      const dims = getElementDimensions(selectedEl);
                      updateElement('x', spec.width - dims.width - 20);
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '10px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Align Right"
                  >
                    <AlignRight size={12} /> Right
                  </button>
                </div>
                {/* Vertical alignment */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      const safeZone = SAFE_ZONES[selectedSpec];
                      const topMargin = safeZone?.top || 20;
                      updateElement('y', topMargin);
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '10px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Align to Safe Top"
                  >
                    Top (Safe)
                  </button>
                  <button
                    onClick={() => {
                      const dims = getElementDimensions(selectedEl);
                      updateElement('y', (spec.height - dims.height) / 2);
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '10px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Center Vertically"
                  >
                    Middle
                  </button>
                  <button
                    onClick={() => {
                      const safeZone = SAFE_ZONES[selectedSpec];
                      const bottomMargin = safeZone?.bottom || 20;
                      const dims = getElementDimensions(selectedEl);
                      updateElement('y', spec.height - bottomMargin - dims.height);
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '10px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Align to Safe Bottom"
                  >
                    Bottom (Safe)
                  </button>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  Position
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>X</span>
                    <input
                      type="number"
                      value={Math.round(selectedEl.x)}
                      onChange={(e) => updateElement('x', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '4px',
                        backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                        color: isDarkTheme ? '#f9fafb' : '#111827',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '10px', color: isDarkTheme ? '#6b7280' : '#9ca3af' }}>Y</span>
                    <input
                      type="number"
                      value={Math.round(selectedEl.y)}
                      onChange={(e) => updateElement('y', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '4px',
                        backgroundColor: isDarkTheme ? '#374151' : '#f9fafb',
                        color: isDarkTheme ? '#f9fafb' : '#111827',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No selection message */}
          {!selectedEl && (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: isDarkTheme ? '#6b7280' : '#9ca3af'
            }}>
              <Layers size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', margin: 0 }}>
                Click an element to edit its properties
              </p>
            </div>
          )}

          {/* Elements list */}
          {elements.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Layers ({elements.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Display layers in reverse order (top layer = last in array = first in list) */}
                {[...elements].reverse().map((el, displayIdx) => {
                  const actualIdx = elements.length - 1 - displayIdx;
                  return (
                    <div
                      key={el.id || actualIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px',
                        backgroundColor: selectedElement === actualIdx
                          ? (isDarkTheme ? '#374151' : '#e5e7eb')
                          : 'transparent',
                        borderRadius: '6px'
                      }}
                    >
                      {/* Layer name/select button */}
                      <button
                        onClick={() => setSelectedElement(actualIdx)}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'left'
                        }}
                      >
                        {el.type === 'text' && <Type size={14} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                        {el.type === 'button' && <Square size={14} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                        {el.type === 'image' && <ImageIcon size={14} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                        {el.type === 'vector' && <Hexagon size={14} style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }} />}
                        <span style={{
                          fontSize: '12px',
                          color: isDarkTheme ? '#d1d5db' : '#374151',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {el.content?.substring(0, 15) || 'Element'}
                        </span>
                      </button>

                      {/* Inline layer actions - Up = bring forward (increase index), Down = send back (decrease index) */}
                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedElement(actualIdx); bringForward(); }}
                          disabled={actualIdx >= elements.length - 1}
                          style={{
                            padding: '3px',
                            backgroundColor: 'transparent',
                            color: actualIdx >= elements.length - 1 ? (isDarkTheme ? '#4b5563' : '#d1d5db') : (isDarkTheme ? '#9ca3af' : '#6b7280'),
                            border: 'none',
                            borderRadius: '3px',
                            cursor: actualIdx >= elements.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Bring Forward"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedElement(actualIdx); sendBackward(); }}
                          disabled={actualIdx <= 0}
                          style={{
                            padding: '3px',
                            backgroundColor: 'transparent',
                            color: actualIdx <= 0 ? (isDarkTheme ? '#4b5563' : '#d1d5db') : (isDarkTheme ? '#9ca3af' : '#6b7280'),
                            border: 'none',
                            borderRadius: '3px',
                            cursor: actualIdx <= 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Send Back"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElement(actualIdx);
                            deleteElement();
                          }}
                          style={{
                            padding: '3px',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal - Goal-Based Categories */}
      {showTemplates && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowTemplates(false)}
        >
          <div
            style={{
              backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
              borderRadius: '20px',
              padding: '0',
              maxWidth: '950px',
              width: '95%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 16px',
              borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: isDarkTheme ? '#f9fafb' : '#111827',
                    margin: 0
                  }}>
                    Choose a Template
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    margin: '4px 0 0 0'
                  }}>
                    Goal-optimized templates with images and best practices
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Category Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px'
              }}>
                <button
                  onClick={() => setTemplateCategory('ALL')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    backgroundColor: templateCategory === 'ALL'
                      ? '#FBBF24'
                      : (isDarkTheme ? '#374151' : '#f3f4f6'),
                    color: templateCategory === 'ALL'
                      ? '#000000'
                      : (isDarkTheme ? '#d1d5db' : '#4b5563'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  All Templates
                </button>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setTemplateCategory(key)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      backgroundColor: templateCategory === key
                        ? '#FBBF24'
                        : (isDarkTheme ? '#374151' : '#f3f4f6'),
                      color: templateCategory === key
                        ? '#000000'
                        : (isDarkTheme ? '#d1d5db' : '#4b5563'),
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px'
              }}>
                {PREBUILT_TEMPLATES
                  .filter(t => templateCategory === 'ALL' || t.category === templateCategory)
                  .map(template => {
                    const categoryInfo = TEMPLATE_CATEGORIES[template.category];
                    return (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        style={{
                          padding: '0',
                          background: 'transparent',
                          border: `2px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = '#FBBF24';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(251, 191, 36, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = isDarkTheme ? '#374151' : '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Preview Area */}
                        <div style={{
                          height: '140px',
                          background: template.bgMode === 'image' && template.backgroundImageUrl
                            ? `url(${template.backgroundImageUrl.replace('w=1080&h=1350', 'w=440&h=280')}) center/cover`
                            : template.backgroundGradient || template.backgroundColor || '#1f2937',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {/* Template thumbnail overlay */}
                          <span style={{
                            fontSize: '48px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                          }}>
                            {template.thumbnail}
                          </span>

                          {/* Category badge */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#FFFFFF',
                            backdropFilter: 'blur(4px)'
                          }}>
                            {categoryInfo?.icon}
                          </div>
                        </div>

                        {/* Info Area */}
                        <div style={{
                          padding: '12px',
                          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isDarkTheme ? '#f9fafb' : '#111827',
                            marginBottom: '4px'
                          }}>
                            {template.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: isDarkTheme ? '#9ca3af' : '#6b7280',
                            lineHeight: '1.4'
                          }}>
                            {template.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Empty state */}
              {PREBUILT_TEMPLATES.filter(t => templateCategory === 'ALL' || t.category === templateCategory).length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280'
                }}>
                  No templates in this category yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Font Manager Modal */}
      {showFontManager && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowFontManager(false)}
        >
          <div
            style={{
              backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                margin: 0
              }}>
                Custom Fonts
              </h3>
              <button
                onClick={() => setShowFontManager(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <p style={{
              fontSize: '13px',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '16px'
            }}>
              Add fonts from Google Fonts by entering the font name exactly as it appears on fonts.google.com
            </p>

            {/* Add font form */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                placeholder="e.g., Roboto Slab, Archivo Black..."
                value={newFontName}
                onChange={(e) => setNewFontName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomFont(newFontName)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={() => addCustomFont(newFontName)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#FBBF24',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add Font
              </button>
            </div>

            {/* Popular fonts suggestion */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                marginBottom: '8px'
              }}>
                Popular Fonts (click to add)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Roboto Slab', 'Archivo Black', 'Space Grotesk', 'DM Sans', 'Outfit', 'Manrope', 'Sora', 'Source Sans Pro'].map(font => (
                  <button
                    key={font}
                    onClick={() => addCustomFont(font)}
                    disabled={customFonts.some(f => f.name === font)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      backgroundColor: customFonts.some(f => f.name === font)
                        ? (isDarkTheme ? '#1f2937' : '#e5e7eb')
                        : (isDarkTheme ? '#374151' : '#f3f4f6'),
                      color: customFonts.some(f => f.name === font)
                        ? (isDarkTheme ? '#6b7280' : '#9ca3af')
                        : (isDarkTheme ? '#d1d5db' : '#4b5563'),
                      border: 'none',
                      borderRadius: '6px',
                      cursor: customFonts.some(f => f.name === font) ? 'default' : 'pointer',
                      opacity: customFonts.some(f => f.name === font) ? 0.5 : 1
                    }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Added fonts list */}
            {customFonts.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '8px'
                }}>
                  Your Custom Fonts ({customFonts.length})
                </label>
                <div style={{
                  border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {customFonts.map((font, index) => (
                    <div
                      key={font.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderBottom: index < customFonts.length - 1
                          ? `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
                          : 'none',
                        backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff'
                      }}
                    >
                      <span style={{
                        fontFamily: font.value,
                        fontSize: '14px',
                        color: isDarkTheme ? '#f9fafb' : '#111827'
                      }}>
                        {font.name}
                      </span>
                      <button
                        onClick={() => removeCustomFont(font.name)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                          color: isDarkTheme ? '#ef4444' : '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customFonts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '30px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#f9fafb',
                borderRadius: '8px',
                color: isDarkTheme ? '#6b7280' : '#9ca3af'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔤</div>
                <div style={{ fontSize: '13px' }}>No custom fonts added yet</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vector Picker Modal */}
      {showVectorPicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            setShowVectorPicker(false);
            setGeneratedVectorPath(null);
            setVectorAIPrompt('');
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '700px',
              maxHeight: '85vh',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: isDarkTheme ? '#f9fafb' : '#111827'
                }}>
                  <Hexagon size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                  Add Vector Shape
                </h2>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280'
                }}>
                  Choose from presets or generate with AI
                </p>
              </div>
              <button
                onClick={() => {
                  setShowVectorPicker(false);
                  setGeneratedVectorPath(null);
                  setVectorAIPrompt('');
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* AI Generation Section */}
              <div style={{
                padding: '16px',
                backgroundColor: isDarkTheme ? '#0f172a' : '#f0f9ff',
                borderRadius: '12px',
                marginBottom: '20px',
                border: `1px solid ${isDarkTheme ? '#1e3a5f' : '#bae6fd'}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <Sparkles size={18} style={{ color: '#3b82f6' }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#60a5fa' : '#2563eb'
                  }}>
                    AI Vector Generator
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={vectorAIPrompt}
                    onChange={(e) => setVectorAIPrompt(e.target.value)}
                    placeholder="Describe the shape (e.g., 'arrow pointing right', 'shield badge', 'wave pattern')"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '14px',
                      backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDarkTheme ? '#374151' : '#d1d5db'}`,
                      borderRadius: '8px',
                      color: isDarkTheme ? '#f9fafb' : '#111827',
                      outline: 'none'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && generateVectorWithAI()}
                  />
                  <button
                    onClick={generateVectorWithAI}
                    disabled={isGeneratingVector || !vectorAIPrompt.trim()}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: isGeneratingVector ? '#6b7280' : '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isGeneratingVector || !vectorAIPrompt.trim() ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: !vectorAIPrompt.trim() ? 0.5 : 1
                    }}
                  >
                    {isGeneratingVector ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate
                      </>
                    )}
                  </button>
                </div>

                {/* Generated Preview */}
                {generatedVectorPath && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="60" height="60" viewBox="0 0 100 100">
                        <path d={generatedVectorPath} fill="#FBBF24" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isDarkTheme ? '#f9fafb' : '#111827',
                        marginBottom: '4px'
                      }}>
                        AI Generated Shape
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: isDarkTheme ? '#9ca3af' : '#6b7280'
                      }}>
                        Click "Add to Canvas" to use this shape
                      </div>
                    </div>
                    <button
                      onClick={addGeneratedVector}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#FBBF24',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Add to Canvas
                    </button>
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setVectorCategory('ALL')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: vectorCategory === 'ALL'
                      ? '#3b82f6'
                      : (isDarkTheme ? '#374151' : '#f3f4f6'),
                    color: vectorCategory === 'ALL'
                      ? '#fff'
                      : (isDarkTheme ? '#d1d5db' : '#4b5563'),
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {VECTOR_PRESETS.categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setVectorCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: vectorCategory === cat
                        ? '#3b82f6'
                        : (isDarkTheme ? '#374151' : '#f3f4f6'),
                      color: vectorCategory === cat
                        ? '#fff'
                        : (isDarkTheme ? '#d1d5db' : '#4b5563'),
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Shape Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                {VECTOR_PRESETS.shapes
                  .filter(shape => vectorCategory === 'ALL' || shape.category === vectorCategory)
                  .map((shape) => (
                    <button
                      key={shape.name}
                      onClick={() => addVectorFromPreset(shape)}
                      style={{
                        padding: '16px',
                        backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="40" height="40" viewBox="0 0 100 100">
                          <path d={shape.path} fill={isDarkTheme ? '#FBBF24' : '#f59e0b'} />
                        </svg>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: isDarkTheme ? '#d1d5db' : '#4b5563'
                      }}>
                        {shape.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for loader animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CreativeCanvas;
