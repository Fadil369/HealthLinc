/**
 * Input Validation and Sanitization Utilities
 * 
 * Provides comprehensive input validation to prevent injection attacks,
 * XSS, and other security vulnerabilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'uuid' | 'phone' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
  sanitize?: boolean;
}

/**
 * Validate and sanitize input according to rules
 */
export function validateInput(value: any, rules: ValidationRule): ValidationResult {
  const errors: string[] = [];
  let sanitizedValue = value;

  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  // If not required and empty, return valid
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return { isValid: true, errors: [], sanitizedValue: value };
  }

  // Type validation and sanitization
  switch (rules.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push('Must be a string');
        break;
      }
      if (rules.sanitize) {
        sanitizedValue = sanitizeString(value);
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        errors.push('Must be a valid number');
        break;
      }
      sanitizedValue = num;
      break;

    case 'email':
      if (typeof value !== 'string' || !validateEmailFormat(value)) {
        errors.push('Must be a valid email address');
        break;
      }
      sanitizedValue = value.toLowerCase().trim();
      break;

    case 'url':
      try {
        new URL(value);
        sanitizedValue = value.trim();
      } catch {
        errors.push('Must be a valid URL');
      }
      break;

    case 'uuid':
      if (!validateUUID(value)) {
        errors.push('Must be a valid UUID');
      }
      break;

    case 'phone':
      const sanitizedPhone = sanitizePhoneNumber(value);
      if (!validatePhoneNumber(sanitizedPhone)) {
        errors.push('Must be a valid phone number');
      } else {
        sanitizedValue = sanitizedPhone;
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push('Must be a valid date');
      } else {
        sanitizedValue = date.toISOString();
      }
      break;
  }

  // Length validation for strings
  if (typeof sanitizedValue === 'string') {
    if (rules.minLength && sanitizedValue.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters`);
    }
  }

  // Numeric range validation
  if (typeof sanitizedValue === 'number') {
    if (rules.min !== undefined && sanitizedValue < rules.min) {
      errors.push(`Must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && sanitizedValue > rules.max) {
      errors.push(`Must be no more than ${rules.max}`);
    }
  }

  // Pattern validation
  if (rules.pattern && typeof sanitizedValue === 'string') {
    if (!rules.pattern.test(sanitizedValue)) {
      errors.push('Invalid format');
    }
  }

  // Allowed values validation
  if (rules.allowedValues && !rules.allowedValues.includes(sanitizedValue)) {
    errors.push(`Must be one of: ${rules.allowedValues.join(', ')}`);
  }

  // Custom validation
  if (rules.customValidator && !rules.customValidator(sanitizedValue)) {
    errors.push('Invalid value');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: errors.length === 0 ? sanitizedValue : undefined
  };
}

/**
 * Validate multiple inputs using schema
 */
export function validateSchema(data: Record<string, any>, schema: Record<string, ValidationRule>): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
} {
  const errors: Record<string, string[]> = {};
  const sanitizedData: Record<string, any> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const result = validateInput(data[field], rules);
    if (!result.isValid) {
      errors[field] = result.errors;
    } else {
      sanitizedData[field] = result.sanitizedValue;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email format
 */
function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate UUID format
 */
function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize and validate phone number
 */
function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function validatePhoneNumber(phone: string): boolean {
  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate user registration data
 */
export const userRegistrationSchema: Record<string, ValidationRule> = {
  firstName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    sanitize: true,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  lastName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    sanitize: true,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  email: {
    required: true,
    type: 'email',
    maxLength: 254
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
  },
  role: {
    required: false,
    type: 'string',
    allowedValues: ['user', 'admin', 'doctor', 'nurse', 'receptionist']
  }
};

/**
 * Validate login data
 */
export const userLoginSchema: Record<string, ValidationRule> = {
  email: {
    required: true,
    type: 'email',
    maxLength: 254
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 128
  }
};

/**
 * Validate profile update data
 */
export const profileUpdateSchema: Record<string, ValidationRule> = {
  firstName: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    sanitize: true,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  lastName: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    sanitize: true,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  phone: {
    required: false,
    type: 'phone'
  }
};

/**
 * Prevent NoSQL injection by sanitizing query parameters
 */
export function sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Remove potentially dangerous operators
      sanitized[key] = value.replace(/[${}]/g, '');
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? item.replace(/[${}]/g, '') : item
      );
    }
    // Ignore objects and other complex types
  }
  
  return sanitized;
}

/**
 * Validate API endpoint parameters
 */
export function validateApiParams(params: Record<string, any>, allowedParams: string[]): {
  isValid: boolean;
  errors: string[];
  filteredParams: Record<string, any>;
} {
  const errors: string[] = [];
  const filteredParams: Record<string, any> = {};
  
  // Check for unexpected parameters
  const providedParams = Object.keys(params);
  const unexpectedParams = providedParams.filter(param => !allowedParams.includes(param));
  
  if (unexpectedParams.length > 0) {
    errors.push(`Unexpected parameters: ${unexpectedParams.join(', ')}`);
  }
  
  // Filter to only allowed parameters
  for (const param of allowedParams) {
    if (params[param] !== undefined) {
      filteredParams[param] = params[param];
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    filteredParams
  };
}