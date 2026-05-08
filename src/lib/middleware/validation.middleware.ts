export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true };
}

export function validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationResult {
  const errors: Record<string, string> = {};
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = `${field} is required`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateDomainName(domain: string): { valid: boolean; error?: string } {
  if (!domain) return { valid: false, error: 'Domain name is required' };
  const domainLower = domain.toLowerCase().trim();
  if (!domainLower.includes('.')) return { valid: false, error: 'Full domain name required (e.g., example.com)' };
  const sld = domainLower.split('.')[0];
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!domainRegex.test(sld) || sld.length < 1 || sld.length > 63) {
    return { valid: false, error: 'Invalid domain name format' };
  }
  return { valid: true };
}

export function validatePagination(params: { page?: string; limit?: string }): { page: number; limit: number } {
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20')));
  return { page, limit };
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>'"]/g, '');
}
