import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from 'libphonenumber-js/min';

export interface StructuredPhoneInput {
  country_name: string;
  country_code: string;
  dial_code: string;
  local_phone_number: string;
  full_phone_number: string;
}

const SUPPORTED_COUNTRIES = new Set(getCountries());

export const validateStructuredPhone = (phone: StructuredPhoneInput) => {
  const countryCode = phone.country_code.toUpperCase() as CountryCode;
  if (!SUPPORTED_COUNTRIES.has(countryCode)) {
    return { ok: false as const, error: 'Unsupported country code provided.' };
  }

  const expectedDialCode = `+${getCountryCallingCode(countryCode)}`;
  if (phone.dial_code !== expectedDialCode) {
    return { ok: false as const, error: 'Dial code does not match selected country.' };
  }

  if (phone.local_phone_number.startsWith('0')) {
    return { ok: false as const, error: 'Local phone number must not start with 0.' };
  }

  const expectedFull = `${phone.dial_code}${phone.local_phone_number}`;
  if (phone.full_phone_number !== expectedFull) {
    return { ok: false as const, error: 'Phone number payload mismatch. Please re-enter your number.' };
  }

  const lengthReason = validatePhoneNumberLength(phone.full_phone_number, countryCode);
  if (lengthReason === 'TOO_SHORT') {
    return { ok: false as const, error: 'Phone number is too short for selected country.' };
  }
  if (lengthReason === 'TOO_LONG') {
    return { ok: false as const, error: 'Phone number is too long for selected country.' };
  }
  if (lengthReason === 'INVALID_LENGTH') {
    return { ok: false as const, error: 'Phone number length is invalid for selected country.' };
  }

  const parsed = parsePhoneNumberFromString(phone.full_phone_number, countryCode);
  if (!parsed || !parsed.isValid()) {
    return { ok: false as const, error: 'Invalid phone number format.' };
  }
  if (parsed.country && parsed.country !== countryCode) {
    return { ok: false as const, error: 'Phone number does not match selected country.' };
  }

  return {
    ok: true as const,
    normalized: {
      country_name: phone.country_name,
      country_code: countryCode,
      dial_code: phone.dial_code,
      local_phone_number: phone.local_phone_number,
      full_phone_number: parsed.number,
    },
  };
};
