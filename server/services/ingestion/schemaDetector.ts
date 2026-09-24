/**
 * AI Lead Intelligence — Schema Detector
 * Dynamically maps varied, messy column headers across industries to Core Identity Fields.
 * Preserves all unmapped domain-specific columns into custom_attributes.
 * Neutralizes formula injection on text fields.
 */

export interface MappedRow {
  name: string;
  phone: string;
  email: string;
  location: string;
  source: string;
  inquiry_text: string;
  custom_attributes: Record<string, any>;
  raw_source: Record<string, any>;
}

export function sanitizeFormulaString(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // Neutralize CSV/Excel formula injection (leading =, +, -, @, tab, CR)
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

const NAME_ALIASES = [
  'name', 'full name', 'fullname', 'customer name', 'lead name', 'client name',
  'candidate', 'student', 'applicant', 'contact name', 'person', 'prospect',
  'parent name', 'user name', 'buyer name'
];

const PHONE_ALIASES = [
  'phone', 'mobile', 'telephone', 'contact number', 'contact', 'contact no',
  'whatsapp', 'cell', 'tel', 'phone number', 'ph', 'mobile number', 'phone_number',
  'cell phone', 'mob'
];

const EMAIL_ALIASES = [
  'email', 'email address', 'e-mail', 'mail', 'email_address', 'mail id',
  'email id', 'contact email'
];

const LOCATION_ALIASES = [
  'city', 'location', 'address', 'region', 'state', 'country', 'place',
  'area', 'residence', 'current location'
];

const INQUIRY_ALIASES = [
  'conversation', 'message', 'chat', 'inquiry', 'notes', 'interaction',
  'transcript', 'remarks', 'query', 'user query', 'comments', 'requirement',
  'details', 'description', 'feedback', 'goal', 'reason', 'background'
];

const SOURCE_ALIASES = [
  'source', 'lead source', 'channel', 'utm_source', 'campaign', 'medium',
  'referrer', 'platform', 'origin'
];

function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function findMatchingKey(headers: string[], aliases: string[]): string | null {
  for (const alias of aliases) {
    const exact = headers.find(h => normalizeHeaderKey(h) === alias);
    if (exact) return exact;
  }
  for (const alias of aliases) {
    const partial = headers.find(h => normalizeHeaderKey(h).includes(alias));
    if (partial) return partial;
  }
  return null;
}

export function detectSchemaAndMapRows(
  rows: Record<string, any>[]
): {
  detectedColumns: {
    nameCol: string | null;
    phoneCol: string | null;
    emailCol: string | null;
    locationCol: string | null;
    inquiryCol: string | null;
    sourceCol: string | null;
    unmappedCols: string[];
  };
  mappedRows: MappedRow[];
} {
  if (rows.length === 0) {
    return {
      detectedColumns: {
        nameCol: null,
        phoneCol: null,
        emailCol: null,
        locationCol: null,
        inquiryCol: null,
        sourceCol: null,
        unmappedCols: [],
      },
      mappedRows: [],
    };
  }

  const sampleRow = rows[0];
  const allHeaders = Object.keys(sampleRow);

  const nameCol = findMatchingKey(allHeaders, NAME_ALIASES);
  const phoneCol = findMatchingKey(allHeaders, PHONE_ALIASES);
  const emailCol = findMatchingKey(allHeaders, EMAIL_ALIASES);
  const locationCol = findMatchingKey(allHeaders, LOCATION_ALIASES);
  const inquiryCol = findMatchingKey(allHeaders, INQUIRY_ALIASES);
  const sourceCol = findMatchingKey(allHeaders, SOURCE_ALIASES);

  const mappedSet = new Set([nameCol, phoneCol, emailCol, locationCol, inquiryCol, sourceCol].filter(Boolean));
  const unmappedCols = allHeaders.filter(h => !mappedSet.has(h));

  const mappedRows: MappedRow[] = rows.map((raw) => {
    const raw_source: Record<string, any> = {};
    const custom_attributes: Record<string, any> = {};

    for (const [key, val] of Object.entries(raw)) {
      raw_source[key] = val;
      if (unmappedCols.includes(key) && val !== null && val !== undefined && String(val).trim() !== '') {
        custom_attributes[key] = sanitizeFormulaString(val);
      }
    }

    const name = nameCol && raw[nameCol] !== undefined ? sanitizeFormulaString(raw[nameCol]) : '';
    const phone = phoneCol && raw[phoneCol] !== undefined ? sanitizeFormulaString(raw[phoneCol]) : '';
    const email = emailCol && raw[emailCol] !== undefined ? sanitizeFormulaString(raw[emailCol]) : '';
    const location = locationCol && raw[locationCol] !== undefined ? sanitizeFormulaString(raw[locationCol]) : '';
    const source = sourceCol && raw[sourceCol] !== undefined ? sanitizeFormulaString(raw[sourceCol]) : 'Direct Inbound';
    
    // If multiple conversation/notes columns exist, merge unmapped notes if inquiryCol is weak
    let inquiry_text = inquiryCol && raw[inquiryCol] !== undefined ? sanitizeFormulaString(raw[inquiryCol]) : '';
    if (!inquiry_text) {
      const extraNotes = Object.entries(custom_attributes)
        .filter(([k]) => /query|remark|note|comment|interest/i.test(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      if (extraNotes) inquiry_text = extraNotes;
    }

    return {
      name,
      phone,
      email,
      location,
      source,
      inquiry_text,
      custom_attributes,
      raw_source,
    };
  });

  return {
    detectedColumns: {
      nameCol,
      phoneCol,
      emailCol,
      locationCol,
      inquiryCol,
      sourceCol,
      unmappedCols,
    },
    mappedRows,
  };
}
