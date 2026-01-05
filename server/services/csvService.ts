import Papa from 'papaparse';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface ClientData {
  name: string;
  phone: string;
  email: string;
}

export interface ValidationResult {
  valid: ClientData[];
  errors: Array<{ row: number; reason: string }>;
}

export function parseCSV(csvContent: string): ValidationResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const valid: ClientData[] = [];
  const errors: Array<{ row: number; reason: string }> = [];

  result.data.forEach((row, index) => {
    const rowNum = index + 2;
    
    const name = row.name || row.Name || row.imię || row.Imię || '';
    const phone = row.phone || row.Phone || row.telefon || row.Telefon || '';
    const email = row.email || row.Email || '';

    if (!name.trim()) {
      errors.push({ row: rowNum, reason: 'Missing name' });
      return;
    }

    if (!phone.trim() && !email.trim()) {
      errors.push({ row: rowNum, reason: 'Missing both phone and email' });
      return;
    }

    let validatedPhone = '';
    if (phone.trim()) {
      try {
        if (!isValidPhoneNumber(phone, 'PL')) {
          errors.push({ row: rowNum, reason: `Invalid phone number: ${phone}` });
          return;
        }
        const parsed = parsePhoneNumber(phone, 'PL');
        validatedPhone = parsed.formatInternational();
      } catch (error) {
        errors.push({ row: rowNum, reason: `Phone parsing error: ${phone}` });
        return;
      }
    }

    let validatedEmail = '';
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ row: rowNum, reason: `Invalid email: ${email}` });
        return;
      }
      validatedEmail = email.toLowerCase().trim();
    }

    valid.push({
      name: name.trim(),
      phone: validatedPhone,
      email: validatedEmail,
    });
  });

  return { valid, errors };
}
