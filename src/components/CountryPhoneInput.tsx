import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js/min";

export interface PhoneFieldValue {
  countryName: string;
  countryCode: string;
  dialCode: string;
  localPhoneNumber: string;
  fullPhoneNumber: string;
}

interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

interface CountryPhoneInputProps {
  label?: string;
  required?: boolean;
  value: PhoneFieldValue;
  onChange: (value: PhoneFieldValue) => void;
  onValidityChange?: (isValid: boolean, error: string) => void;
  compact?: boolean;
  forceWhiteText?: boolean;
}

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: COUNTRY_NAMES.of(code) ?? code,
    dialCode: `+${getCountryCallingCode(code)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const emptyPhoneValue = (): PhoneFieldValue => ({
  countryName: "",
  countryCode: "",
  dialCode: "",
  localPhoneNumber: "",
  fullPhoneNumber: "",
});

export default function CountryPhoneInput({
  label = "Phone Number",
  required = false,
  value,
  onChange,
  onValidityChange,
  compact = false,
  forceWhiteText = false,
}: CountryPhoneInputProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const normalizedCountrySearch = countrySearch.trim().toLowerCase();
  const filteredCountryOptions = useMemo(
    () =>
      COUNTRY_OPTIONS.filter((item) => {
        if (!normalizedCountrySearch) {
          return true;
        }
        return (
          item.name.toLowerCase().includes(normalizedCountrySearch) ||
          item.code.toLowerCase().includes(normalizedCountrySearch) ||
          item.dialCode.includes(normalizedCountrySearch)
        );
      }),
    [normalizedCountrySearch],
  );

  const reportValidity = (valid: boolean, error: string) => {
    setPhoneError(error);
    onValidityChange?.(valid, error);
  };

  const validatePhoneForCountry = (nextLocalNumber: string, countryCode: string, dialCode: string) => {
    const digits = nextLocalNumber.replace(/\D/g, "");
    if (!countryCode || !dialCode) {
      return { valid: false, error: "Please select a country first.", fullNumber: "" };
    }
    if (!digits) {
      return { valid: false, error: "Please enter your local phone number.", fullNumber: "" };
    }
    if (digits.startsWith("0")) {
      return { valid: false, error: "Enter local number without leading 0.", fullNumber: "" };
    }

    const fullNumber = `${dialCode}${digits}`;
    const lengthReason = validatePhoneNumberLength(fullNumber, countryCode as CountryCode);
    if (lengthReason === "TOO_SHORT") {
      return { valid: false, error: "Phone number is too short for selected country.", fullNumber: "" };
    }
    if (lengthReason === "TOO_LONG") {
      return { valid: false, error: "Phone number is too long for selected country.", fullNumber: "" };
    }
    if (lengthReason === "INVALID_LENGTH") {
      return { valid: false, error: "Phone number length is invalid for selected country.", fullNumber: "" };
    }

    const parsed = parsePhoneNumberFromString(fullNumber, countryCode as CountryCode);
    if (!parsed || !parsed.isValid()) {
      return { valid: false, error: "Invalid phone format for selected country.", fullNumber: "" };
    }
    if (parsed.country && parsed.country !== countryCode) {
      return { valid: false, error: "Phone number does not match selected country.", fullNumber: "" };
    }

    return { valid: true, error: "", fullNumber: parsed.number };
  };

  const borderClass = compact
    ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] text-text dark:text-gray-100"
    : "border-border bg-glass text-text";
  const adminTextClass = forceWhiteText ? "text-white placeholder:text-white/45" : "text-text placeholder:text-muted/60";
  const adminLabelClass = forceWhiteText ? "text-white/80" : "text-muted";

  return (
    <div className="space-y-2">
      <label className={`block text-[10px] font-black uppercase tracking-widest ${adminLabelClass}`}>
        {label}
        {required ? " *" : ""}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${forceWhiteText ? "text-white" : ""} ${
            value.countryCode ? "border-emerald-400/60 ring-1 ring-emerald-400/40" : borderClass
          }`}
        >
          <span className="truncate">
            {value.countryCode ? `${value.countryName} (${value.dialCode})` : "Select country"}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isCountryDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border border-black/10 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-[#1a1b23]">
              <input
                type="text"
                placeholder="Search country..."
                className="mb-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-[#0f1115] dark:text-gray-100"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {filteredCountryOptions.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onChange({
                        countryName: country.name,
                        countryCode: country.code,
                        dialCode: country.dialCode,
                        localPhoneNumber: "",
                        fullPhoneNumber: "",
                      });
                      reportValidity(false, "Please enter your local phone number.");
                      setIsCountryDropdownOpen(false);
                      setCountrySearch("");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    {country.name} ({country.dialCode})
                  </button>
                ))}
                {filteredCountryOptions.length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-500">No country found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className={`flex items-center rounded-xl border ${
          phoneError
            ? "border-red-400/60 ring-1 ring-red-400/40"
            : "border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary dark:border-gray-700"
        } ${compact ? "bg-gray-50 dark:bg-[#0f1115]" : "bg-glass"}`}
      >
        <span className={`pl-4 pr-3 text-sm font-bold ${forceWhiteText ? "text-white" : "text-muted"}`}>{value.dialCode || "+--"}</span>
        <span className="mr-3 h-5 w-px bg-black/10 dark:bg-white/20" />
        <input
          required={required}
          type="tel"
          inputMode="numeric"
          placeholder="Enter local number"
          className={`w-full bg-transparent py-3 pr-4 text-sm font-semibold focus:outline-none ${adminTextClass}`}
          value={value.localPhoneNumber}
          onChange={(e) => {
            const rawValue = e.target.value;
            if (!value.countryCode || !value.dialCode) {
              reportValidity(false, "Please select a country first.");
              return;
            }
            if (rawValue.includes("+")) {
              reportValidity(false, "Enter local number only, without country code.");
              return;
            }

            const digitsOnly = rawValue.replace(/\D/g, "");
            const dialDigits = value.dialCode.replace("+", "");
            if (digitsOnly.startsWith(dialDigits) && digitsOnly.length > dialDigits.length + 3) {
              reportValidity(false, "Do not include country code in local number.");
              return;
            }

            const result = validatePhoneForCountry(digitsOnly, value.countryCode, value.dialCode);
            onChange({
              ...value,
              localPhoneNumber: digitsOnly,
              fullPhoneNumber: result.valid ? result.fullNumber : "",
            });
            reportValidity(result.valid, result.error);
          }}
        />
      </div>

      {phoneError && <p className="text-xs font-semibold text-red-500">{phoneError}</p>}
      {!phoneError && value.fullPhoneNumber && (
        <p className="text-xs font-semibold text-emerald-600">Number looks good</p>
      )}
    </div>
  );
}
