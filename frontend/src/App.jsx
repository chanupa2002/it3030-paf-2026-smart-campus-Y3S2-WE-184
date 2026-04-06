import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const SESSION_KEY = "smart-campus.session";
const THEME_KEY = "smart-campus.theme";

const ROLE_GROUPS = {
  student: "academic",
  lecturer: "academic",
  instructor: "academic",
  technician: "technician",
  admin: "admin",
};

const SIDEBAR_ICON_MAP = {
  "comp-1": "/assets/icons/resources.png",
  "comp-2": "/assets/icons/my_bookings.png",
  "comp-3": "/assets/icons/book_resource.png",
  "comp-4": "/assets/icons/my_tickets.png",
  "comp-5": "/assets/icons/raise_ticket.png",
  settings: "/assets/icons/settings.png",
};

const DASHBOARDS = {
  academic: {
    title: "Academic workspace",
    description:
      "This dashboard is ready for student, lecturer, and instructor modules when you define the real flows.",
  },
  technician: {
    title: "Technician hub",
    description:
      "This shell is ready for maintenance, resource availability, and technician-focused operations later.",
  },
  admin: {
    title: "Admin control center",
    description:
      "This shell is prepared for governance, management tools, and admin-only workflows later.",
  },
};

const SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    placement: "primary",
    title: "Organizations",
    description: "Select an organization to view its projects.",
    searchPlaceholder: "Search organizations...",
    buttonLabel: "Add Organization",
    items: [
      { code: "C1", name: "Comp 1", description: "Placeholder module ready for your first real screen." },
      { code: "C2", name: "Comp 2", description: "Placeholder module ready to be replaced later." },
      { code: "C3", name: "Comp 3", description: "Placeholder module ready for future integration." },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    placement: "primary",
    title: "Settings",
    description: "Manage preferences and system settings for this dashboard.",
    searchPlaceholder: "Search settings...",
    buttonLabel: "Add Setting",
    items: [
      { code: "PF", name: "Profile", description: "User profile settings placeholder row." },
      { code: "TH", name: "Theme", description: "Theme and appearance settings placeholder row." },
      { code: "NT", name: "Notifications", description: "Notification settings placeholder row." },
    ],
  },
  {
    id: "comp-1",
    label: "Resources",
    placement: "quick",
    title: "Resources",
    description: "Browse all campus resources and search them by name.",
    searchPlaceholder: "Search resources...",
    buttonLabel: "Resources",
    items: [
      { code: "RS", name: "Campus Resources", description: "Facility resources loaded from the backend." },
    ],
  },
  {
    id: "comp-2",
    label: "My Bookings",
    placement: "quick",
    title: "My Bookings",
    description: "Placeholder list for the bookings module.",
    searchPlaceholder: "Search bookings...",
    buttonLabel: "Bookings",
    items: [
      { code: "BK", name: "My Bookings", description: "Bookings module placeholder." },
    ],
  },
  {
    id: "comp-3",
    label: "Book Resource",
    placement: "quick",
    title: "Book Resource",
    description: "Placeholder list for the resource booking module.",
    searchPlaceholder: "Search resources to book...",
    buttonLabel: "Book Resource",
    items: [
      { code: "BR", name: "Book Resource", description: "Resource booking module placeholder." },
    ],
  },
  {
    id: "comp-4",
    label: "My Tickets",
    placement: "quick",
    title: "My Tickets",
    description: "Placeholder list for the tickets module.",
    searchPlaceholder: "Search tickets...",
    buttonLabel: "My Tickets",
    items: [
      { code: "MT", name: "My Tickets", description: "Tickets module placeholder." },
    ],
  },
  {
    id: "comp-5",
    label: "Raise Ticket",
    placement: "quick",
    title: "Raise Ticket",
    description: "Placeholder list for the raise ticket module.",
    searchPlaceholder: "Search raised tickets...",
    buttonLabel: "Raise Ticket",
    items: [
      { code: "RT", name: "Raise Ticket", description: "Raise ticket module placeholder." },
    ],
  },
];

function normalizeRole(roleName) {
  return (roleName || "").trim().toLowerCase();
}

function resolveGroup(roleName) {
  return ROLE_GROUPS[normalizeRole(roleName)] || null;
}

function resolveHash(roleName) {
  const group = resolveGroup(roleName);
  return group ? `#/dashboard/${group}` : "#/login";
}

function decodeJwt(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function getInitialTheme() {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;

    const jwt = decodeJwt(parsed.token);
    return {
      ...parsed,
      user: {
        ...(parsed.user || {}),
        roleName: parsed?.user?.roleName || jwt?.role || null,
      },
    };
  } catch {
    return null;
  }
}

function storeSession(session) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readRoute() {
  const hash = window.location.hash || "#/login";
  if (hash.startsWith("#/dashboard/")) {
    return { type: "dashboard", hash };
  }
  return { type: "login", hash: "#/login" };
}

function setHash(nextHash, replace = false) {
  const value = nextHash.startsWith("#") ? nextHash : `#${nextHash}`;
  if (replace) {
    window.history.replaceState(null, "", value);
  } else {
    window.location.hash = value;
  }
}

function getMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}

function createSections(group) {
  const config = DASHBOARDS[group];
  return SECTIONS.map((section, index) => ({
    ...section,
    title: index === 0 ? config.title : section.title,
    body:
      index === 0
        ? config.description
        : `${section.label} is a placeholder slot. We can replace it later with your real sidebar module for this dashboard.`,
  }));
}

function getDashboardLabel(roleName) {
  const role = (roleName || "User").trim();
  return `${role} Dashboard`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [session, setSession] = useState(readSession);
  const [route, setRoute] = useState(readRoute);
  const [active, setActive] = useState({ academic: "dashboard", technician: "dashboard", admin: "dashboard" });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      if (route.type !== "login") {
        setHash("#/login", true);
        setRoute(readRoute());
      }
      return;
    }

    const expected = resolveHash(session.user?.roleName);
    if (route.hash !== expected) {
      setHash(expected, true);
      setRoute(readRoute());
    }
  }, [route, session]);

  const group = resolveGroup(session?.user?.roleName);
  const config = group ? DASHBOARDS[group] : null;
  const sections = useMemo(() => (group ? createSections(group) : []), [group]);
  const activeSection = group
    ? sections.find((section) => section.id === active[group]) || sections[0]
    : null;

  const toggleTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));

  const handleLoginSuccess = (response) => {
    const jwt = decodeJwt(response?.token);
    const roleName = response?.user?.roleName || jwt?.role || null;
    const groupName = resolveGroup(roleName);

    if (!groupName) {
      throw new Error("Login worked, but this frontend does not yet have a dashboard mapped for that role.");
    }

    const nextSession = {
      token: response.token,
      user: {
        ...(response.user || {}),
        roleName,
      },
    };

    storeSession(nextSession);
    setActive((value) => ({ ...value, [groupName]: "dashboard" }));
    setSession(nextSession);
    setHash(resolveHash(roleName), true);
    setRoute(readRoute());
  };

  const logout = () => {
    storeSession(null);
    setSession(null);
    setHash("#/login", true);
    setRoute(readRoute());
  };

  if (!session || !group || !config) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onThemeToggle={toggleTheme} theme={theme} />;
  }

  return (
    <DashboardPage
      activeSection={activeSection}
      config={config}
      group={group}
      onLogout={logout}
      onSectionChange={(sectionId) => setActive((value) => ({ ...value, [group]: sectionId }))}
      onThemeToggle={toggleTheme}
      sections={sections}
      token={session.token}
      theme={theme}
      user={session.user}
    />
  );
}

function LoginPage({ onLoginSuccess, onThemeToggle, theme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getMessage(payload));

      onLoginSuccess(payload);
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="page-corner">
        <ThemeToggle onClick={onThemeToggle} theme={theme} />
      </div>

      <div className="auth-shell">
        <section className="auth-card auth-card-wide">
          <div className="auth-panel">
            <div className="auth-copy">
              <div className="brand-title">Smart Campus</div>
              <div className="auth-divider" />
              <h1>Sign in</h1>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <label className="field">
                <span>Email</span>
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="field">
                <span>Password</span>
                <div className="password-wrap">
                  <input
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button className="icon-button" onClick={() => setShowPassword((value) => !value)} type="button">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="field-action-row">
                  <button className="text-button field-link" disabled type="button">
                    Forgot your password?
                  </button>
                </div>
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <button className="primary-button" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Login"}
              </button>

              <button className="secondary-button google-button" type="button">
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </form>
          </div>

          <div className="auth-media">
            <div className="auth-image-wrap auth-image-pane">
              <img
                alt="Smart Campus visual"
                className="auth-image"
                src="/assets/images/smartCampus.jpg"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardPage({ activeSection, onLogout, onSectionChange, onThemeToggle, sections, theme, token, user }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [activeSection?.id]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const greeting = getGreeting();
  const orderedSections = [
    sections.find((section) => section.id === "dashboard"),
    sections.find((section) => section.id === "comp-1"),
    sections.find((section) => section.id === "comp-2"),
    sections.find((section) => section.id === "comp-3"),
    sections.find((section) => section.id === "comp-4"),
    sections.find((section) => section.id === "comp-5"),
    sections.find((section) => section.id === "settings"),
  ].filter(Boolean);
  const shouldShowHero = activeSection?.id === "dashboard";
  const shouldShowResources = activeSection?.id === "comp-1";
  const shouldShowMyBookings = activeSection?.id === "comp-2";
  const shouldShowBookResource = activeSection?.id === "comp-3";
  const shouldShowMyTickets = activeSection?.id === "comp-4";
  const topbarLabel =
    activeSection?.id === "dashboard"
      ? getDashboardLabel(user?.roleName)
      : activeSection?.label || "Dashboard";

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brandbar">
          <div className="sidebar-brandbar-left">
            <img
              alt="Education icon"
              className="sidebar-brand-icon"
              src="/assets/icons/education.png"
            />
            <strong>Smart Campus</strong>
          </div>
          <button className="sidebar-mini-button" type="button">
            <PanelIcon />
          </button>
        </div>

        <div className="sidebar-main">
          <nav className="sidebar-nav">
            {orderedSections.map((section) => (
              <button
                className={`nav-button ${section.id === activeSection?.id ? "nav-button-active" : ""}`}
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                type="button"
              >
                <span className="nav-icon-wrap nav-icon-plain">
                  {section.id === "dashboard" ? (
                    <GridIcon />
                  ) : (
                    <img
                      alt=""
                      className="nav-icon-image"
                      src={SIDEBAR_ICON_MAP[section.id]}
                    />
                  )}
                </span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-profile">
          <button
            aria-expanded={isProfileMenuOpen}
            className={`sidebar-profile-card ${isProfileMenuOpen ? "sidebar-profile-card-open" : ""}`}
            onClick={() => {
              setIsNotificationsOpen(false);
              setIsProfileMenuOpen((value) => !value);
            }}
            type="button"
          >
            <div className="avatar">{getInitials(user?.name || user?.email || "SC")}</div>
            <div className="sidebar-profile-copy">
              <strong>{user?.email || "Smart Campus User"}</strong>
              <span>{user?.name || user?.roleName || "No name"}</span>
            </div>
          </button>
          <div className={`sidebar-profile-menu ${isProfileMenuOpen ? "sidebar-profile-menu-open" : ""}`}>
            <button className="sidebar-profile-logout" onClick={onLogout} type="button">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <section className="content-area">
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <div className="topbar-title-animated" key={`${activeSection?.id || "dashboard"}-${topbarLabel}`}>
              <HomeIcon />
              <span>{topbarLabel}</span>
            </div>
          </div>
          <div className="topbar-actions" ref={notificationsRef}>
            <button
              aria-expanded={isNotificationsOpen}
              aria-label="Notifications"
              className={`topbar-icon-button ${isNotificationsOpen ? "topbar-icon-button-active" : ""}`}
              onClick={() => {
                setIsProfileMenuOpen(false);
                setIsNotificationsOpen((value) => !value);
              }}
              type="button"
            >
              <img alt="" className="topbar-icon-image" src="/assets/icons/bell.png" />
            </button>
            <div className={`topbar-notifications-menu ${isNotificationsOpen ? "topbar-notifications-menu-open" : ""}`}>
              <div className="topbar-notifications-header">
                <strong>Notifications</strong>
                <span>Latest updates will appear here.</span>
              </div>
              <div className="topbar-notifications-empty">
                <img alt="" className="topbar-notifications-empty-icon" src="/assets/icons/bell.png" />
                <strong>No notifications yet</strong>
                <span>When your notification API is ready, items can appear here.</span>
              </div>
            </div>
            <ThemeToggle onClick={onThemeToggle} theme={theme} />
          </div>
        </header>

        <div className="content-scroll">
          <div className="section-stage" key={activeSection?.id || "dashboard"}>
            {shouldShowHero ? (
              <header className="hero-card">
                <div className="hero-copy">
                  <h1>
                    {greeting}, <span>{user?.name || user?.email || "User"}</span>
                  </h1>
                </div>

                <div className="hero-tools">
                  <div className="time-inline">
                    <span className="time-inline-icon">
                      <ClockIcon />
                    </span>
                    <strong>{time}</strong>
                  </div>
                </div>
              </header>
            ) : null}

            <section
              className={`dashboard-content-panel ${
                shouldShowResources
                  ? "dashboard-content-panel-resources"
                  : shouldShowMyBookings
                    ? "dashboard-content-panel-book-resource"
                  : shouldShowBookResource
                    ? "dashboard-content-panel-book-resource"
                    : shouldShowMyTickets
                      ? "dashboard-content-panel-book-resource"
                    : "dashboard-content-empty"
              }`}
            >
              {shouldShowResources ? <ResourcesSection token={token} /> : null}
              {shouldShowMyBookings ? <MyBookingsSection /> : null}
              {shouldShowBookResource ? <BookResourceSection /> : null}
              {shouldShowMyTickets ? <MyTicketsSection /> : null}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResourcesSection({ token }) {
  const [query, setQuery] = useState("");
  const [allResources, setAllResources] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const typeFilterRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();
  const resourceTypes = useMemo(
    () =>
      [...new Set(allResources.map((resource) => resource.type).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right)),
    [allResources]
  );

  const filteredResources = useMemo(
    () =>
      allResources.filter((resource) => {
        const matchesQuery =
          !normalizedQuery || (resource.name || "").toLowerCase().includes(normalizedQuery);
        const matchesType =
          selectedTypes.length === 0 || selectedTypes.includes(resource.type);

        return matchesQuery && matchesType;
      }),
    [allResources, normalizedQuery, selectedTypes]
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target)) {
        setIsTypeFilterOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/api/facilities`, {
          headers,
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(getMessage(payload));
        }

        setAllResources(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setAllResources([]);
        setError(requestError.message || "Unable to load resources right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadResources();
    return () => controller.abort();
  }, [token]);

  const toggleTypeSelection = (type) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  return (
    <div className="resources-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Campus Resources</h2>
          <p>Search and browse the currently available resource catalog across the campus.</p>
        </div>

        <div className="workspace-toolbar">
          <label className="workspace-search resources-search" htmlFor="resource-search">
            <SearchIcon />
            <input
              id="resource-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resource name..."
              type="search"
              value={query}
            />
          </label>

          <div className="resource-filter" ref={typeFilterRef}>
            <button
              aria-expanded={isTypeFilterOpen}
              className={`resource-filter-trigger ${isTypeFilterOpen ? "resource-filter-trigger-open" : ""}`}
              onClick={() => setIsTypeFilterOpen((value) => !value)}
              type="button"
            >
              <span className="resource-filter-trigger-copy">
                {selectedTypes.length === 0
                  ? "All Types"
                  : `${selectedTypes.length} Type${selectedTypes.length === 1 ? "" : "s"}`}
              </span>
              <span className="resource-filter-trigger-icon">
                <ChevronDownIcon />
              </span>
            </button>

            <div className={`resource-filter-menu ${isTypeFilterOpen ? "resource-filter-menu-open" : ""}`}>
              <div className="resource-filter-menu-header">
                <strong>Resource Types</strong>
                {selectedTypes.length > 0 ? (
                  <button
                    className="resource-filter-clear"
                    onClick={() => setSelectedTypes([])}
                    type="button"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="resource-filter-options">
                {resourceTypes.length === 0 ? (
                  <div className="resource-filter-empty">No resource types found.</div>
                ) : (
                  resourceTypes.map((type) => (
                    <label className="resource-filter-option" key={type}>
                      <input
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleTypeSelection(type)}
                        type="checkbox"
                      />
                      <span>{type}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="resources-state-card">
          <div className="resources-loading-dots">
            <span />
            <span />
            <span />
          </div>
          <strong>Loading resources...</strong>
          <span>Fetching the latest campus resource list.</span>
        </div>
      ) : error ? (
        <div className="resources-state-card resources-state-error">
          <strong>Could not load resources</strong>
          <span>{error}</span>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="resources-state-card">
          <strong>No resources found</strong>
          <span>
            {normalizedQuery
              ? `No resource names matched "${query.trim()}".`
              : selectedTypes.length > 0
                ? "No resources matched the selected type filters."
                : "No resources are available in the catalog yet."}
          </span>
        </div>
      ) : (
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article className="resource-card" key={resource.id ?? `${resource.name}-${resource.location}`}>
              <div className="resource-card-top">
                <div className="resource-card-mark">{getResourceMark(resource.type)}</div>
                <div className="resource-card-copy">
                  <h3>{resource.name || "Unnamed Resource"}</h3>
                  <span>{resource.location || "Campus location not available"}</span>
                </div>
                <span className="resource-type-badge">{resource.type || "Resource"}</span>
              </div>

              <div className="resource-card-meta">
                <div className="resource-meta-item">
                  <span className="resource-meta-label">Capacity</span>
                  <strong>{resource.capacity ?? "N/A"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MyBookingsSection() {
  const [activeTab, setActiveTab] = useState("approved");
  const activePanel = {
    approved: <ApprovedBookingsPanel />,
    pending: <PendingBookingsPanel />,
    rejected: <RejectedBookingsPanel />,
    cancelled: <CancelledBookingsPanel />,
  }[activeTab];

  return (
    <div className="book-resource-shell">
      <div className="book-resource-tabs bookings-tabs" role="tablist" aria-label="My bookings status tabs">
        <button
          aria-selected={activeTab === "approved"}
          className={`book-resource-tab ${activeTab === "approved" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("approved")}
          role="tab"
          type="button"
        >
          Approved
        </button>
        <button
          aria-selected={activeTab === "pending"}
          className={`book-resource-tab ${activeTab === "pending" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("pending")}
          role="tab"
          type="button"
        >
          Pending
        </button>
        <button
          aria-selected={activeTab === "rejected"}
          className={`book-resource-tab ${activeTab === "rejected" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("rejected")}
          role="tab"
          type="button"
        >
          Rejected
        </button>
        <button
          aria-selected={activeTab === "cancelled"}
          className={`book-resource-tab ${activeTab === "cancelled" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
          role="tab"
          type="button"
        >
          Cancelled
        </button>
      </div>

      <div className="book-resource-tab-panel" role="tabpanel" aria-live="polite">
        {activePanel}
      </div>
    </div>
  );
}

function BookResourceSection() {
  const [activeTab, setActiveTab] = useState("type");
  const activePanel = activeTab === "type" ? <BookByTypePanel /> : <BookByNamePanel />;

  return (
    <div className="book-resource-shell">
      <div className="book-resource-tabs" role="tablist" aria-label="Book resource options">
        <button
          aria-selected={activeTab === "type"}
          className={`book-resource-tab ${activeTab === "type" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("type")}
          role="tab"
          type="button"
        >
          Book by Type
        </button>
        <button
          aria-selected={activeTab === "name"}
          className={`book-resource-tab ${activeTab === "name" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("name")}
          role="tab"
          type="button"
        >
          Book by Name
        </button>
      </div>

      <div className="book-resource-tab-panel" role="tabpanel" aria-live="polite">
        {activePanel}
      </div>
    </div>
  );
}

function MyTicketsSection() {
  const [activeTab, setActiveTab] = useState("pending");
  const activePanel = activeTab === "pending" ? <PendingTicketsPanel /> : <SolvedTicketsPanel />;

  return (
    <div className="book-resource-shell">
      <div className="book-resource-tabs" role="tablist" aria-label="My tickets status tabs">
        <button
          aria-selected={activeTab === "pending"}
          className={`book-resource-tab ${activeTab === "pending" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("pending")}
          role="tab"
          type="button"
        >
          Pending
        </button>
        <button
          aria-selected={activeTab === "solved"}
          className={`book-resource-tab ${activeTab === "solved" ? "book-resource-tab-active" : ""}`}
          onClick={() => setActiveTab("solved")}
          role="tab"
          type="button"
        >
          Solved
        </button>
      </div>

      <div className="book-resource-tab-panel" role="tabpanel" aria-live="polite">
        {activePanel}
      </div>
    </div>
  );
}

function ApprovedBookingsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Approved Bookings</h3>
      <p>Approved bookings display here. We can add the real approved booking content next.</p>
    </div>
  );
}

function PendingBookingsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Pending Bookings</h3>
      <p>Pending bookings display here. We can add the real pending booking content next.</p>
    </div>
  );
}

function RejectedBookingsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Rejected Bookings</h3>
      <p>Rejected bookings display here. We can add the real rejected booking content next.</p>
    </div>
  );
}

function CancelledBookingsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Cancelled Bookings</h3>
      <p>Cancelled bookings display here. We can add the real cancelled booking content next.</p>
    </div>
  );
}

function PendingTicketsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Pending Tickets</h3>
      <p>Pending tickets display here. We can add the real pending ticket content next.</p>
    </div>
  );
}

function SolvedTicketsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Solved Tickets</h3>
      <p>Solved tickets display here. We can add the real solved ticket content next.</p>
    </div>
  );
}

function BookByTypePanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Book by Type</h3>
      <p>This is the Book by Type section. We can add the real booking flow here next.</p>
    </div>
  );
}

function BookByNamePanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Book by Name</h3>
      <p>This is the Book by Name section. We can add the real booking flow here next.</p>
    </div>
  );
}

function getResourceMark(type) {
  const normalized = (type || "R").trim();
  if (!normalized) return "R";

  return normalized
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function ThemeToggle({ onClick, theme }) {
  return (
    <button
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-toggle"
      onClick={onClick}
      type="button"
    >
      <img
        alt=""
        className="theme-toggle-icon"
        src={theme === "dark" ? "/assets/icons/lightMode.png" : "/assets/icons/darkMode.png"}
      />
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M21.6 12.23c0-.68-.06-1.33-.18-1.95H12v3.69h5.39a4.61 4.61 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.61-2.41l-3.24-2.51c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.57-4.1H3.08v2.59A9.98 9.98 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.43 13.94A5.99 5.99 0 0 1 6.12 12c0-.67.11-1.32.31-1.94V7.47H3.08A9.98 9.98 0 0 0 2 12c0 1.61.39 3.14 1.08 4.53l3.35-2.59Z"
        fill="#FBBC04"
      />
      <path
        d="M12 5.96c1.47 0 2.78.5 3.81 1.48l2.85-2.85C16.95 2.98 14.69 2 12 2A9.98 9.98 0 0 0 3.08 7.47l3.35 2.59c.78-2.35 2.98-4.1 5.57-4.1Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M4 10.5 12 4l8 6.5V20H4v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M10 20v-5h4v5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <rect x="4" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 8.8A3.2 3.2 0 1 1 8.8 12 3.2 3.2 0 0 1 12 8.8Zm8 3.2-.9-.3a7.9 7.9 0 0 0-.6-1.5l.5-.8a1 1 0 0 0-.1-1.2l-1.6-1.6a1 1 0 0 0-1.2-.1l-.8.5a7.9 7.9 0 0 0-1.5-.6L13 4a1 1 0 0 0-1-.8h-2a1 1 0 0 0-1 .8l-.3.9a7.9 7.9 0 0 0-1.5.6l-.8-.5a1 1 0 0 0-1.2.1L3.6 6.7a1 1 0 0 0-.1 1.2l.5.8a7.9 7.9 0 0 0-.6 1.5L2.5 11a1 1 0 0 0-.8 1v2a1 1 0 0 0 .8 1l.9.3a7.9 7.9 0 0 0 .6 1.5l-.5.8a1 1 0 0 0 .1 1.2l1.6 1.6a1 1 0 0 0 1.2.1l.8-.5a7.9 7.9 0 0 0 1.5.6l.3.9a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.3-.9a7.9 7.9 0 0 0 1.5-.6l.8.5a1 1 0 0 0 1.2-.1l1.6-1.6a1 1 0 0 0 .1-1.2l-.5-.8a7.9 7.9 0 0 0 .6-1.5l.9-.3a1 1 0 0 0 .8-1v-2a1 1 0 0 0-.8-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-4.2-4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path d="m10 7 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 5v14" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h6A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 10 18.5V17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14 12H5m0 0 2.8-2.8M5 12l2.8 2.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getInitials(value) {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "SC";
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default App;



