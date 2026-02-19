/**
 * Phone Number Formatter
 * Converts various phone formats to +972 format for WhatsApp integration
 */

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // If starts with 0 (Israeli format), replace with +972
  if (digits.startsWith('0')) {
    return '+972' + digits.slice(1);
  }

  // If starts with 972 (without +), add +
  if (digits.startsWith('972')) {
    return '+' + digits;
  }

  // If already has +972, return as-is
  if (phone.startsWith('+972')) {
    return phone;
  }

  // Default: assume Israeli number and add +972
  return '+972' + digits;
};

/**
 * Examples:
 * "052-925-0237" → "+972529250237"
 * "0529250237" → "+972529250237"
 * "052 925 0237" → "+972529250237"
 * "9729250237" → "+9729250237"
 * "+9729250237" → "+9729250237"
 * "+972-52-925-0237" → "+972529250237"
 */

export const isValidPhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  // Valid if 9-10 digits (Israeli format) or 11-12 digits (with country code)
  return digits.length >= 9 && digits.length <= 12;
};

export const displayPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Format for display: +972-52-925-0237
  const formatted = formatPhoneNumber(phone);
  if (formatted.startsWith('+972')) {
    const rest = formatted.slice(4); // Remove +972
    if (rest.length === 9) {
      return `+972-${rest.slice(0, 2)}-${rest.slice(2, 5)}-${rest.slice(5)}`;
    }
  }

  return formatted;
};
