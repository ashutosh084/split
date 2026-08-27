"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  loading?: boolean;
}

/**
 * Gmail-style chips input for tags.
 * - Typable text input that also shows a dropdown of suggestions.
 * - Selected tags rendered as chips with × buttons.
 * - Press Enter or comma to add the current input as a tag.
 * - Arrow keys + Enter to select from dropdown.
 */
export default function TagInput({
  selectedTags,
  onChange,
  suggestions,
  loading = false,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions: exclude already-selected and match input (case-insensitive)
  const filtered = suggestions.filter(
    (s) =>
      !selectedTags.includes(s) &&
      s.toLowerCase().includes(input.toLowerCase()),
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || selectedTags.includes(trimmed)) {
        setInput("");
        setShowDropdown(false);
        return;
      }
      onChange([...selectedTags, trimmed]);
      setInput("");
      setShowDropdown(false);
      setHighlightIndex(-1);
      inputRef.current?.focus();
    },
    [selectedTags, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(selectedTags.filter((t) => t !== tag));
    },
    [selectedTags, onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isSpace = e.key === " " || e.code === "Space" || e.keyCode === 32;

    if (e.key === "Enter" || e.key === "," || isSpace) {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        addTag(filtered[highlightIndex]);
      } else if (input.trim()) {
        addTag(input);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      return;
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }

    if (e.key === "Backspace" && !input && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
      return;
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 input-tactical min-h-[42px] items-center cursor-text focus-within:border-tac-accent">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider bg-tac-accent/15 text-tac-accent border border-tac-accent/30 rounded"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-tac-muted hover:text-tac-bright transition-colors leading-none text-xs"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            const value = e.target.value;
            // Mobile keyboards (Android IME) often don't fire a usable
            // keydown for the space key (key === "Unidentified",
            // keyCode 229). Detect a trailing space here and commit the
            // preceding text as a tag, mirroring the desktop behavior.
            if (value.endsWith(" ")) {
              const text = value.trim();
              if (text) {
                addTag(text);
              } else {
                setInput("");
              }
              return;
            }
            setInput(value);
            setShowDropdown(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedTags.length === 0 ? "Type a tag and press Enter..." : ""
          }
          className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-tac-bright text-sm font-mono placeholder:text-tac-dim"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1 max-h-36 overflow-y-auto border border-tac-border rounded bg-tac-surface shadow-lg"
        >
          {filtered.map((tag, i) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className={`w-full text-left px-3 py-1.5 text-sm font-mono transition-colors ${
                i === highlightIndex
                  ? "bg-tac-accent/20 text-tac-accent"
                  : "text-tac-bright hover:bg-tac-accent/10"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-[10px] text-tac-dim font-mono mt-1">
          Loading suggestions...
        </p>
      )}

      <p className="text-[10px] text-tac-muted font-mono mt-1.5 leading-relaxed">
        ⚠ Tags are shared between you and your friends. Any tag you create will
        be visible to your friends as a suggestion.
      </p>
    </div>
  );
}
