import React, { useEffect, useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";

export interface LocationSuggestion {
  city: string;
  country: string;
  formatted_location: string;
  latitude: number;
  longitude: number;
  provider_place_id: string;
  token: string;
}

interface CityLocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  selectedLocation: LocationSuggestion | null;
  onSelect: (location: LocationSuggestion) => void;
  onClear: () => void;
}

export default function CityLocationAutocomplete({
  label = "Location (City only)",
  placeholder = "Search your city",
  required = false,
  selectedLocation,
  onSelect,
  onClear,
}: CityLocationAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    if (selectedLocation) {
      setQuery(selectedLocation.formatted_location);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation) return;

    const normalized = query.trim();
    if (normalized.length < 2) {
      setSuggestions([]);
      setLookupError("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsFetching(true);
        const res = await fetch(`/api/location/cities?text=${encodeURIComponent(normalized)}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          setSuggestions([]);
          setLookupError(payload.message || "Location API error.");
          return;
        }
        setSuggestions(payload.data || []);
        setLookupError("");
      } catch (error) {
        setSuggestions([]);
        setLookupError("Failed to fetch city suggestions.");
      } finally {
        setIsFetching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, selectedLocation]);

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-widest text-muted">{label}{required ? " *" : ""}</label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          required={required}
          readOnly={Boolean(selectedLocation)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedLocation) {
              onClear();
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-glass py-3.5 pl-12 pr-24 text-sm font-semibold text-text outline-none transition ${
            selectedLocation
              ? "border-emerald-400/70 ring-1 ring-emerald-400/40"
              : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
          }`}
        />
        {selectedLocation ? (
          <>
            <button
              type="button"
              onClick={() => {
                onClear();
                setQuery("");
                setSuggestions([]);
              }}
              className="absolute right-10 top-1/2 -translate-y-1/2 inline-flex items-center rounded-full border border-[#3f3f46] bg-[#3f3f46] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[#52525b] focus:outline-none focus:ring-2 focus:ring-primary/60"
              title="Clear city selection"
            >
              Clear
            </button>
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
          </>
        ) : isFetching ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500">Loading...</span>
        ) : null}
      </div>

      {lookupError && !selectedLocation && (
        <p className="text-xs font-semibold text-amber-600">{lookupError}</p>
      )}

      {!selectedLocation && query.trim().length >= 2 && suggestions.length > 0 && (
        <div className="rounded-2xl border border-border bg-white/95 backdrop-blur p-2 max-h-48 overflow-y-auto custom-scrollbar">
          {suggestions.map((item) => (
            <button
              key={item.provider_place_id}
              type="button"
              onClick={() => {
                onSelect(item);
                setQuery(item.formatted_location);
                setSuggestions([]);
              }}
              className="w-full text-left rounded-xl px-3 py-2.5 transition bg-transparent hover:bg-gray-100"
            >
              <p className="text-sm font-semibold text-gray-900">{item.city}</p>
              <p className="text-xs text-gray-500">{item.country}</p>
            </button>
          ))}
        </div>
      )}

      {!selectedLocation && query.trim().length >= 2 && !isFetching && suggestions.length === 0 && !lookupError && (
        <p className="text-xs font-medium text-gray-500">No city-only matches found.</p>
      )}
    </div>
  );
}
