# BrainSAIT Localization & Internationalization Guide

This document describes the localization and internationalization (i18n) system implemented in the BrainSAIT healthcare dashboard application.

## Overview

BrainSAIT supports multiple languages and right-to-left (RTL) text direction. The current implementation includes:

- English (en) - Default language, left-to-right
- Arabic (ar) - Right-to-left

## Architecture

The localization system consists of the following components:

### 1. LanguageContext

The `LanguageContext` provides application-wide access to translation functions and language preferences:

```tsx
// src/contexts/LanguageContext.tsx

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

// Core functionality provided:
interface LanguageContextType {
  language: Language;       // Current language code
  direction: Direction;     // Current text direction
  setLanguage: (lang: Language) => void;  // Change language
  t: (key: string) => string;  // Translate a key
}
```

### 2. ThemeContext

The `ThemeContext` provides dark/light theme management:

```tsx
// src/contexts/ThemeContext.tsx

type Theme = 'light' | 'dark';

// Core functionality:
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

### 3. RTL Utilities

RTL-aware utilities help with directional styling:

```tsx
// src/utils/rtl.ts
const { rtl, space, isRtl } = useRtl();

// Examples:
rtl('ml-4', 'mr-4')  // Returns 'ml-4' in LTR, 'mr-4' in RTL
space('start', 'm', 4)  // Returns 'ml-4' in LTR, 'mr-4' in RTL
```

## Translation System

Translations are stored in the `LanguageContext.tsx` file as nested objects by language:

```tsx
const translations = {
  en: {
    'dashboard.title': 'Healthcare Analytics Dashboard',
    // ... more keys
  },
  ar: {
    'dashboard.title': 'لوحة تحليلات الرعاية الصحية',
    // ... more keys
  }
};
```

## Usage

### Basic Translation

```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return <h1>{t('dashboard.title')}</h1>;
}
```

### Changing Language

```tsx
const { language, setLanguage } = useLanguage();

// Toggle between English and Arabic
<button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
  Switch Language
</button>
```

### Working with RTL

```tsx
import { useRtl } from '../utils/rtl';

function MyComponent() {
  const { rtl, isRtl } = useRtl();
  
  return (
    <div className={rtl('text-left', 'text-right')}>
      {isRtl ? 'Right-to-left content' : 'Left-to-right content'}
    </div>
  );
}
```

### Theme Management

```tsx
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    </button>
  );
}
```

## Adding a New Language

To add a new language:

1. Update the `Language` type in `LanguageContext.tsx`
2. Add translations for the new language in the translations object
3. Update UI components that directly reference language codes

## RTL Considerations

- Text alignment should use the `rtl()` utility instead of hardcoding 'text-left' or 'text-right'
- Margins and paddings should use the `space()` utility for directional awareness
- Icons that indicate direction should be flipped in RTL mode
- Flex layouts should conditionally apply `flex-row-reverse` in RTL mode
- When using `space-x-` classes, include `space-x-reverse` in RTL mode

## Implemented Pages

### Dashboard

The main dashboard supports full RTL layout and Arabic translations.

### Settings

The Settings page includes language selection and UI direction options.

### RCM Optimizer

The RCM Optimizer page includes the following localization features:

- Full Arabic translations for all UI elements
- RTL support for all layouts including:
  - Header section with proper text alignment
  - Summary cards with reversed icon placement
  - Risk heatmap with proper RTL data visualization
  - Claims list with proper alignment and spacing
  - AI suggestions with proper bullet point placement
  - Action buttons with proper icon placement
- Accessible form elements with translated labels
- Dark mode support for all components

Example of RTL handling in the RCM Optimizer:

```tsx
<div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''} justify-between`}>
  <div className={isRtl ? 'text-right' : 'text-left'}>
    <p className="text-primary-100">{t('rcm.totalClaims')}</p>
    <p className="text-2xl font-bold">1,247</p>
    <p className="text-sm text-primary-200">+12% {t('rcm.fromLastMonth')}</p>
  </div>
  <TrendingUp size={32} className="text-primary-200" />
</div>
```

## Best Practices

1. Always use translation keys instead of hardcoded strings
2. Group keys logically (e.g., `dashboard.title`, `settings.theme`)
3. Use the RTL utilities for directional styling
4. Test your UI in both LTR and RTL modes
5. Consider using the same case and format for all translation keys
