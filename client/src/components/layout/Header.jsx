import { Bell, Menu, Search } from "lucide-react";

export default function Header({ page, onMenu, onSearch }) {
  return (
    <header className="topbar">
      <div className="top-left">
        <button className="icon-button menu-toggle" onClick={onMenu}>
          <Menu size={19} />
        </button>
        <div className="breadcrumbs">
          <span>Workspace</span>
          <span className="crumb-divider">/</span>
          <b>
            {page === "dashboard"
              ? "Dashboard"
              : page[0].toUpperCase() + page.slice(1)}
          </b>
        </div>
      </div>
      <div className="top-actions">
        <button className="search-trigger" onClick={onSearch}>
          <Search size={15} />
          <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <i />
        </button>
        <span className="top-divider" />
        <button className="avatar avatar-top">JD</button>
      </div>
    </header>
  );
}
