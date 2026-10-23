import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  shortcut = false,
}) {
  return (
    <div className="search-field">
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {shortcut && <kbd>⌘ K</kbd>}
    </div>
  );
}
