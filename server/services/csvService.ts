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
    
    const firstName = row['First Name'] || row['first name'] || row.firstName || row.first_name || '';
    const lastName = row['Last Name'] || row['last name'] || row.lastName || row.last_name || '';
    const fullName = row.name || row.Name || row.imię || row.Imię || row['Full Name'] || row['full name'] || '';
    const name = fullName || `${firstName} ${lastName}`.trim();
    
    const phone = row.phone || row.Phone || row.telefon || row.Telefon || 
                  row['Phone Number'] || row['phone number'] || row.phoneNumber || row.mobile || row.Mobile || '';
    const email = row.email || row.Email || row['Email Address'] || row['email address'] || '';

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
        if (isValidPhoneNumber(phone, 'PL')) {
          const parsed = parsePhoneNumber(phone, 'PL');
          validatedPhone = parsed.formatInternational();
        } else if (isValidPhoneNumber(phone, 'US')) {
          const parsed = parsePhoneNumber(phone, 'US');
          validatedPhone = parsed.formatInternational();
        } else if (isValidPhoneNumber(phone)) {
          const parsed = parsePhoneNumber(phone);
          validatedPhone = parsed!.formatInternational();
        } else {
          validatedPhone = phone.trim();
        }
      } catch (error) {
        validatedPhone = phone.trim();
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
