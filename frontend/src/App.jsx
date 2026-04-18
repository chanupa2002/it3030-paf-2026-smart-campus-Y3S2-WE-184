import { useEffect, useMemo, useRef, useState } from "react";
import AdminPendingBookingsPanel from "./components/admin/AdminPendingBookingsPanel";
import AdminTimetablePanel from "./components/admin/AdminTimetablePanel";
import ApprovedBookingsPanel from "./components/booking/ApprovedBookingsPanel";
import BookByNamePanel from "./components/booking/BookByNamePanel";
import BookByTypePanel from "./components/booking/BookByTypePanel";
import CancelledBookingsPanelView from "./components/booking/CancelledBookingsPanel";
import PendingBookingsPanel from "./components/booking/PendingBookingsPanel";
import RejectedBookingsPanelView from "./components/booking/RejectedBookingsPanel";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const SESSION_KEY = "smart-campus.session";
const THEME_KEY = "smart-campus.theme";

const ROLE_GROUPS = {
  student: "academic",
  lecturer: "academic",
  instructor: "academic",
  technician: "technician",
  admin: "admin",
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

const ACADEMIC_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    view: "dashboard",
    placement: "primary",
    title: "Organizations",
    description: "Select an organization to view its projects.",
    searchPlaceholder: "Search organizations...",
    buttonLabel: "Add Organization",
    items: [
      {
        code: "C1",
        name: "Comp 1",
        description: "Placeholder module ready for your first real screen.",
      },
      {
        code: "C2",
        name: "Comp 2",
        description: "Placeholder module ready to be replaced later.",
      },
      {
        code: "C3",
        name: "Comp 3",
        description: "Placeholder module ready for future integration.",
      },
    ],
  },
  {
    id: "comp-1",
    label: "Resources",
    view: "resources",
    iconSrc: "/assets/icons/resources.png",
    placement: "quick",
    title: "Resources",
    description: "Browse all campus resources and search them by name.",
    searchPlaceholder: "Search resources...",
    buttonLabel: "Resources",
    items: [
      {
        code: "RS",
        name: "Campus Resources",
        description: "Facility resources loaded from the backend.",
      },
    ],
  },
  {
    id: "comp-2",
    label: "My Bookings",
    view: "my-bookings",
    iconSrc: "/assets/icons/my_bookings.png",
    placement: "quick",
    title: "My Bookings",
    description: "Placeholder list for the bookings module.",
    searchPlaceholder: "Search bookings...",
    buttonLabel: "Bookings",
    items: [
      {
        code: "BK",
        name: "My Bookings",
        description: "Bookings module placeholder.",
      },
    ],
  },
  {
    id: "comp-3",
    label: "Book Resource",
    view: "book-resource",
    iconSrc: "/assets/icons/book_resource.png",
    placement: "quick",
    title: "Book Resource",
    description: "Placeholder list for the resource booking module.",
    searchPlaceholder: "Search resources to book...",
    buttonLabel: "Book Resource",
    items: [
      {
        code: "BR",
        name: "Book Resource",
        description: "Resource booking module placeholder.",
      },
    ],
  },
  {
    id: "comp-4",
    label: "My Tickets",
    view: "my-tickets",
    iconSrc: "/assets/icons/my_tickets.png",
    placement: "quick",
    title: "My Tickets",
    description: "Placeholder list for the tickets module.",
    searchPlaceholder: "Search tickets...",
    buttonLabel: "My Tickets",
    items: [
      {
        code: "MT",
        name: "My Tickets",
        description: "Tickets module placeholder.",
      },
    ],
  },
  {
    id: "comp-5",
    label: "Raise Ticket",
    view: "empty",
    iconSrc: "/assets/icons/raise_ticket.png",
    placement: "quick",
    title: "Raise Ticket",
    description: "Placeholder list for the raise ticket module.",
    searchPlaceholder: "Search raised tickets...",
    buttonLabel: "Raise Ticket",
    items: [
      {
        code: "RT",
        name: "Raise Ticket",
        description: "Raise ticket module placeholder.",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    view: "empty",
    iconSrc: "/assets/icons/settings.png",
    placement: "primary",
    title: "Settings",
    description: "Manage preferences and system settings for this dashboard.",
    searchPlaceholder: "Search settings...",
    buttonLabel: "Add Setting",
    items: [
      {
        code: "PF",
        name: "Profile",
        description: "User profile settings placeholder row.",
      },
      {
        code: "TH",
        name: "Theme",
        description: "Theme and appearance settings placeholder row.",
      },
      {
        code: "NT",
        name: "Notifications",
        description: "Notification settings placeholder row.",
      },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    view: "dashboard",
    placement: "primary",
    title: "Dashboard",
    description: "Admin dashboard overview.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "admin-comp-1",
    label: "Resources",
    view: "admin-resource-management",
    iconSrc: "/assets/icons/resources.png",
    placement: "quick",
    title: "Resources",
    description: "Manage resource data across the campus.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "admin-comp-2",
    label: "Bookings",
    view: "admin-bookings",
    iconSrc: "/assets/icons/my_bookings.png",
    placement: "quick",
    title: "Bookings",
    description: "Admin bookings page placeholder.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "admin-timetable",
    label: "Timetable",
    view: "admin-timetable",
    iconSrc: "/assets/icons/timetable.png",
    placement: "quick",
    title: "Timetable",
    description: "Admin timetable page placeholder.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "admin-comp-3",
    label: "Tickets",
    view: "empty",
    iconSrc: "/assets/icons/my_tickets.png",
    placement: "quick",
    title: "Tickets",
    description: "Admin tickets page placeholder.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "admin-users",
    label: "Users",
    view: "admin-users",
    iconSrc: "/assets/icons/user.png",
    placement: "quick",
    title: "Users",
    description: "Admin users page placeholder.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "admin-analytics",
    label: "Analytics",
    view: "empty",
    iconSrc: "/assets/icons/analysis.png",
    placement: "quick",
    title: "Analytics",
    description: "Admin analytics page placeholder.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "settings",
    label: "Settings",
    view: "empty",
    iconSrc: "/assets/icons/settings.png",
    placement: "primary",
    title: "Settings",
    description: "Manage preferences and system settings for this dashboard.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
];

const TECHNICIAN_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    view: "dashboard",
    placement: "primary",
    title: "Dashboard",
    description: "Technician dashboard overview.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "technician-resources",
    label: "Resources",
    view: "resources",
    iconSrc: "/assets/icons/resources.png",
    placement: "quick",
    title: "Resources",
    description: "Browse all campus resources and search them by name.",
    searchPlaceholder: "Search resources...",
    buttonLabel: "Resources",
    items: [],
  },
  {
    id: "technician-tickets",
    label: "Tickets",
    view: "my-tickets",
    iconSrc: "/assets/icons/my_tickets.png",
    placement: "quick",
    title: "Tickets",
    description: "Technician tickets page placeholder.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
  },
  {
    id: "settings",
    label: "Settings",
    view: "empty",
    iconSrc: "/assets/icons/settings.png",
    placement: "primary",
    title: "Settings",
    description: "Manage preferences and system settings for this dashboard.",
    searchPlaceholder: "",
    buttonLabel: "",
    items: [],
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
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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

function isStrongPassword(value) {
  if (!value) return false;
  if (value.length < 8 || value.length > 100) return false;
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  return hasLower && hasUpper && hasDigit;
}

function getNotificationStorageKey(userId) {
  return `smart-campus.notifications.dismissed.${userId}`;
}

function getNotificationSeenKey(userId) {
  return `smart-campus.notifications.seen.${userId}`;
}

function readDismissedNotificationIds(userId) {
  if (!userId) return [];

  try {
    const raw = window.localStorage.getItem(getNotificationStorageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((value) => String(value))
          .filter((value) => value.trim() !== "")
      : [];
  } catch {
    return [];
  }
}

function storeDismissedNotificationIds(userId, ids) {
  if (!userId) return;
  window.localStorage.setItem(
    getNotificationStorageKey(userId),
    JSON.stringify(ids),
  );
}

function readNotificationSeenAt(userId) {
  if (!userId) return 0;

  try {
    const raw = window.localStorage.getItem(getNotificationSeenKey(userId));
    if (!raw) return 0;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function storeNotificationSeenAt(userId, timestamp) {
  if (!userId) return;
  window.localStorage.setItem(
    getNotificationSeenKey(userId),
    String(timestamp),
  );
}

function toNotificationTimestamp(value) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatNotificationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createSections(group) {
  const config = DASHBOARDS[group];
  const baseSections =
    group === "admin"
      ? ADMIN_SECTIONS
      : group === "technician"
        ? TECHNICIAN_SECTIONS
        : ACADEMIC_SECTIONS;
  return baseSections.map((section, index) => ({
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
  const [active, setActive] = useState({
    academic: "dashboard",
    technician: "dashboard",
    admin: "dashboard",
  });

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

  const toggleTheme = () =>
    setTheme((value) => (value === "dark" ? "light" : "dark"));

  const handleLoginSuccess = (response) => {
    const jwt = decodeJwt(response?.token);
    const roleName = response?.user?.roleName || jwt?.role || null;
    const groupName = resolveGroup(roleName);

    if (!groupName) {
      throw new Error(
        "Login worked, but this frontend does not yet have a dashboard mapped for that role.",
      );
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
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onThemeToggle={toggleTheme}
        theme={theme}
      />
    );
  }

  return (
    <DashboardPage
      activeSection={activeSection}
      config={config}
      group={group}
      onLogout={logout}
      onSectionChange={(sectionId) =>
        setActive((value) => ({ ...value, [group]: sectionId }))
      }
      onThemeToggle={toggleTheme}
      sections={sections}
      token={session.token}
      theme={theme}
      user={session.user}
    />
  );
}

function LoginPage({ onLoginSuccess, onThemeToggle, theme }) {
  const RESET_CODE_TTL_SECONDS = 10 * 60;
  const MAX_CODE_ATTEMPTS = 3;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_CODE_ATTEMPTS);
  const [resetExpiresAt, setResetExpiresAt] = useState(0);
  const [resetSecondsLeft, setResetSecondsLeft] = useState(0);

  const openResetModal = () => {
    setIsResetModalOpen(true);
    setResetStep("email");
    setResetEmail(email.trim());
    setResetCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setResetInfo("");
    setRemainingAttempts(MAX_CODE_ATTEMPTS);
    setResetExpiresAt(0);
    setResetSecondsLeft(0);
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
    setResetStep("email");
    setResetCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setResetInfo("");
    setRemainingAttempts(MAX_CODE_ATTEMPTS);
    setResetExpiresAt(0);
    setResetSecondsLeft(0);
  };

  const restartResetProcess = (
    message = "Your reset session ended. Please request a new code.",
  ) => {
    setResetStep("email");
    setResetCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setResetInfo(message);
    setRemainingAttempts(MAX_CODE_ATTEMPTS);
    setResetExpiresAt(0);
    setResetSecondsLeft(0);
  };

  useEffect(() => {
    if (!isResetModalOpen || resetExpiresAt <= 0) {
      return undefined;
    }

    const tick = () => {
      const nextSeconds = Math.max(
        0,
        Math.floor((resetExpiresAt - Date.now()) / 1000),
      );
      setResetSecondsLeft(nextSeconds);

      if (nextSeconds === 0) {
        restartResetProcess(
          "The code expired. Please request a new password reset code.",
        );
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [isResetModalOpen, resetExpiresAt]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setLoginNotice("");

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

  const submitResetEmail = async (event) => {
    event.preventDefault();
    const normalizedEmail = resetEmail.trim();

    if (!normalizedEmail) {
      setResetError("Email is required.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetInfo("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getMessage(payload));

      setResetEmail(normalizedEmail);
      setResetStep("code");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setRemainingAttempts(MAX_CODE_ATTEMPTS);
      setResetExpiresAt(Date.now() + RESET_CODE_TTL_SECONDS * 1000);
      setResetSecondsLeft(RESET_CODE_TTL_SECONDS);
      setResetInfo(
        "A verification code was sent to your email if it is registered.",
      );
    } catch (requestError) {
      setResetError(requestError.message || "Unable to request reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const submitResetCode = async (event) => {
    event.preventDefault();

    if (resetSecondsLeft <= 0) {
      restartResetProcess(
        "The code expired. Please request a new password reset code.",
      );
      return;
    }

    if (remainingAttempts <= 0) {
      restartResetProcess(
        "You reached the maximum number of attempts. Please request a new code.",
      );
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetInfo("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resetEmail.trim(),
            code: resetCode.trim(),
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getMessage(payload));

      if (payload?.valid) {
        setResetStep("password");
        setResetError("");
        setResetInfo("Code verified. Enter your new password.");
        return;
      }

      const nextAttempts = remainingAttempts - 1;
      setRemainingAttempts(nextAttempts);

      if (nextAttempts <= 0) {
        restartResetProcess(
          "You entered an invalid code 3 times. Please request a new code.",
        );
        return;
      }

      setResetError(
        payload?.message ||
          `Invalid code. ${nextAttempts} attempt(s) remaining.`,
      );
    } catch (requestError) {
      const nextAttempts = remainingAttempts - 1;
      setRemainingAttempts(nextAttempts);

      if (nextAttempts <= 0) {
        restartResetProcess(
          "You entered an invalid code 3 times. Please request a new code.",
        );
        return;
      }

      setResetError(
        requestError.message ||
          `Invalid code. ${nextAttempts} attempt(s) remaining.`,
      );
    } finally {
      setResetLoading(false);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();

    if (resetSecondsLeft <= 0) {
      restartResetProcess(
        "The code expired. Please request a new password reset code.",
      );
      return;
    }

    if (!isStrongPassword(resetNewPassword)) {
      setResetError(
        "Password must be 8-100 chars and include uppercase, lowercase, and a number.",
      );
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Password confirmation does not match.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetInfo("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resetEmail.trim(),
            code: resetCode.trim(),
            newPassword: resetNewPassword,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getMessage(payload));

      closeResetModal();
      setPassword("");
      setLoginNotice(
        "Password reset successful. Please sign in with your new password.",
      );
    } catch (requestError) {
      restartResetProcess(
        requestError.message ||
          "Reset session is no longer valid. Please request a new code.",
      );
    } finally {
      setResetLoading(false);
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
                  <button
                    className="icon-button"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="field-action-row">
                  <button
                    className="text-button field-link"
                    onClick={openResetModal}
                    type="button"
                  >
                    Forgot your password?
                  </button>
                </div>
              </label>

              {error ? <p className="form-error">{error}</p> : null}
              {loginNotice ? (
                <p className="form-success">{loginNotice}</p>
              ) : null}

              <button
                className="primary-button"
                disabled={loading}
                type="submit"
              >
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

      {isResetModalOpen ? (
        <div className="modal-backdrop">
          <div
            className="modal-card forgot-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              className="modal-close"
              onClick={closeResetModal}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="forgot-password-title">Forgot Password</h3>
              <p>
                {resetStep === "email"
                  ? "Enter your registered email to receive a reset code."
                  : resetStep === "code"
                    ? "Enter the code sent to your email."
                    : "Set a new password for your account."}
              </p>
            </div>

            <div className="forgot-meta-row">
              <span
                className={`forgot-step-chip ${resetStep === "email" ? "forgot-step-chip-active" : ""}`}
              >
                1. Email
              </span>
              <span
                className={`forgot-step-chip ${resetStep === "code" ? "forgot-step-chip-active" : ""}`}
              >
                2. Code
              </span>
              <span
                className={`forgot-step-chip ${resetStep === "password" ? "forgot-step-chip-active" : ""}`}
              >
                3. Password
              </span>
            </div>

            {(resetStep === "code" || resetStep === "password") &&
            resetSecondsLeft > 0 ? (
              <div className="forgot-timer-row">
                <span>Code expires in</span>
                <strong>
                  {String(Math.floor(resetSecondsLeft / 60)).padStart(2, "0")}:
                  {String(resetSecondsLeft % 60).padStart(2, "0")}
                </strong>
                <span>Attempts left: {remainingAttempts}</span>
              </div>
            ) : null}

            {resetStep === "email" ? (
              <form
                className="auth-form forgot-form"
                onSubmit={submitResetEmail}
              >
                <label className="modal-field modal-field-full">
                  <span>Email</span>
                  <input
                    autoComplete="email"
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={resetEmail}
                  />
                </label>

                {resetError ? (
                  <div className="modal-inline-error">{resetError}</div>
                ) : null}
                {resetInfo ? (
                  <div className="forgot-inline-info">{resetInfo}</div>
                ) : null}

                <div className="modal-actions">
                  <button
                    className="modal-secondary-button"
                    onClick={closeResetModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-primary-button"
                    disabled={resetLoading}
                    type="submit"
                  >
                    {resetLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </form>
            ) : null}

            {resetStep === "code" ? (
              <form
                className="auth-form forgot-form"
                onSubmit={submitResetCode}
              >
                <label className="modal-field modal-field-full">
                  <span>Verification Code</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) =>
                      setResetCode(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter 6-digit code"
                    required
                    type="text"
                    value={resetCode}
                  />
                </label>

                {resetError ? (
                  <div className="modal-inline-error">{resetError}</div>
                ) : null}
                {resetInfo ? (
                  <div className="forgot-inline-info">{resetInfo}</div>
                ) : null}

                <div className="modal-actions">
                  <button
                    className="modal-secondary-button"
                    onClick={() => restartResetProcess()}
                    type="button"
                  >
                    Start Over
                  </button>
                  <button
                    className="modal-primary-button"
                    disabled={resetLoading || resetCode.length !== 6}
                    type="submit"
                  >
                    {resetLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            ) : null}

            {resetStep === "password" ? (
              <form
                className="auth-form forgot-form"
                onSubmit={submitResetPassword}
              >
                <label className="modal-field modal-field-full">
                  <span>New Password</span>
                  <input
                    autoComplete="new-password"
                    onChange={(event) =>
                      setResetNewPassword(event.target.value)
                    }
                    placeholder="Enter new password"
                    required
                    type="password"
                    value={resetNewPassword}
                  />
                </label>

                <label className="modal-field modal-field-full">
                  <span>Confirm Password</span>
                  <input
                    autoComplete="new-password"
                    onChange={(event) =>
                      setResetConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    required
                    type="password"
                    value={resetConfirmPassword}
                  />
                </label>

                <p className="forgot-password-hint">
                  Use 8-100 characters with at least one uppercase letter, one
                  lowercase letter, and one number.
                </p>

                {resetError ? (
                  <div className="modal-inline-error">{resetError}</div>
                ) : null}
                {resetInfo ? (
                  <div className="forgot-inline-info">{resetInfo}</div>
                ) : null}

                <div className="modal-actions">
                  <button
                    className="modal-secondary-button"
                    onClick={() => restartResetProcess()}
                    type="button"
                  >
                    Restart
                  </button>
                  <button
                    className="modal-primary-button"
                    disabled={resetLoading}
                    type="submit"
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function DashboardPage({
  activeSection,
  group,
  onLogout,
  onSectionChange,
  onThemeToggle,
  sections,
  theme,
  token,
  user,
}) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const [notificationSeenAt, setNotificationSeenAt] = useState(0);
  const notificationsRef = useRef(null);

  useEffect(() => {
    document.body.setAttribute("data-dashboard-group", group || "");
    return () => {
      document.body.removeAttribute("data-dashboard-group");
    };
  }, [group]);

  useEffect(() => {
    if (group === "admin") {
      return undefined;
    }

    const neutralizeBackdrops = () => {
      window.document.querySelectorAll(".modal-backdrop").forEach((element) => {
        element.style.setProperty("display", "none", "important");
        element.style.setProperty("pointer-events", "none", "important");
      });
    };

    neutralizeBackdrops();

    const observer = new MutationObserver(() => {
      neutralizeBackdrops();
    });

    observer.observe(window.document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [group]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [activeSection?.id]);

  useEffect(() => {
    const userId = user?.userId;
    if (!userId) {
      setNotifications([]);
      setDismissedNotificationIds([]);
      setNotificationSeenAt(0);
      return;
    }

    setDismissedNotificationIds(readDismissedNotificationIds(userId));
    setNotificationSeenAt(readNotificationSeenAt(userId));
  }, [user?.userId]);

  useEffect(() => {
    const userId = user?.userId;
    if (!token || !userId) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError("");
      return;
    }

    const controller = new AbortController();

    async function loadNotifications() {
      setNotificationsLoading(true);
      setNotificationsError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/notifications/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(getMessage(payload));
        }

        const nextNotifications = (Array.isArray(payload) ? payload : [])
          .filter((notification) => notification?.userId === userId)
          .sort((left, right) => {
            const createdAtDelta =
              toNotificationTimestamp(right.createdAt) -
              toNotificationTimestamp(left.createdAt);
            if (createdAtDelta !== 0) return createdAtDelta;
            return (
              (Number(right.notificationId) || 0) -
              (Number(left.notificationId) || 0)
            );
          });

        setNotifications(nextNotifications);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setNotifications([]);
        setNotificationsError(
          requestError.message || "Unable to load notifications right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();
    const pollId = window.setInterval(loadNotifications, 5000);

    return () => {
      controller.abort();
      window.clearInterval(pollId);
    };
  }, [token, user?.userId]);

  const visibleNotifications = notifications.filter(
    (notification) =>
      !dismissedNotificationIds.includes(String(notification.notificationId)),
  );

  const unreadNotificationCount = visibleNotifications.filter(
    (notification) =>
      toNotificationTimestamp(notification.createdAt) > notificationSeenAt,
  ).length;

  const dismissNotification = (notificationId) => {
    if (notificationId == null) return;

    setDismissedNotificationIds((current) => {
      const normalizedId = String(notificationId);
      const next = current.includes(normalizedId)
        ? current
        : [...current, normalizedId];
      if (user?.userId) {
        storeDismissedNotificationIds(user.userId, next);
      }
      return next;
    });
  };

  const openNotificationsPanel = () => {
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen((value) => {
      const next = !value;
      if (next && user?.userId) {
        const now = Date.now();
        setNotificationSeenAt(now);
        storeNotificationSeenAt(user.userId, now);
      }
      return next;
    });
  };

  const openTicketFromNotification = () => {
    const ticketSection = sections.find(
      (section) => section.view === "my-tickets",
    );
    if (ticketSection) {
      onSectionChange(ticketSection.id);
    }

    setIsNotificationsOpen(false);
  };

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isNotificationsOpen]);

  const greeting = getGreeting();
  const orderedSections = sections;
  const activeView = activeSection?.view;
  const shouldShowHero = activeView === "dashboard";
  const shouldShowResources = activeView === "resources";
  const shouldShowMyBookings = activeView === "my-bookings";
  const shouldShowBookResource = activeView === "book-resource";
  const shouldShowMyTickets = activeView === "my-tickets";
  const shouldShowAdminResourceManagement =
    activeView === "admin-resource-management";
  const shouldShowAdminUsers = activeView === "admin-users";
  const shouldShowAdminBookings = activeView === "admin-bookings";
  const shouldShowAdminTimetable = activeView === "admin-timetable";
  const shouldShowSettingsProfile = activeSection?.id === "settings";
  const shouldShowNotifications = group !== "admin";
  const topbarLabel =
    activeView === "dashboard"
      ? getDashboardLabel(user?.roleName)
      : activeSection?.label || "Dashboard";

  return (
    <main className={`dashboard-page dashboard-${group}`}>
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
                  ) : section.iconSrc ? (
                    <img
                      alt=""
                      className="nav-icon-image"
                      src={section.iconSrc}
                    />
                  ) : (
                    <PlusSquareIcon />
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
            <div className="avatar">
              {getInitials(user?.name || user?.email || "SC")}
            </div>
            <div className="sidebar-profile-copy">
              <strong>{user?.email || "Smart Campus User"}</strong>
              <span>{user?.name || user?.roleName || "No name"}</span>
            </div>
          </button>
          <div
            className={`sidebar-profile-menu ${isProfileMenuOpen ? "sidebar-profile-menu-open" : ""}`}
          >
            <button
              className="sidebar-profile-logout"
              onClick={onLogout}
              type="button"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <section className="content-area">
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <div
              className="topbar-title-animated"
              key={`${activeSection?.id || "dashboard"}-${topbarLabel}`}
            >
              <HomeIcon />
              <span>{topbarLabel}</span>
            </div>
          </div>
          <div className="topbar-actions" ref={notificationsRef}>
            {shouldShowNotifications ? (
              <>
                <button
                  aria-expanded={isNotificationsOpen}
                  aria-label="Notifications"
                  className={`topbar-icon-button ${isNotificationsOpen ? "topbar-icon-button-active" : ""}`}
                  onClick={openNotificationsPanel}
                  type="button"
                >
                  <img
                    alt=""
                    className="topbar-icon-image"
                    src="/assets/icons/bell.png"
                  />
                  {unreadNotificationCount > 0 ? (
                    <span
                      className="topbar-notification-badge"
                      aria-hidden="true"
                    >
                      {unreadNotificationCount > 9
                        ? "9+"
                        : unreadNotificationCount}
                    </span>
                  ) : null}
                </button>
                <div
                  className={`topbar-notifications-menu ${isNotificationsOpen ? "topbar-notifications-menu-open" : ""}`}
                >
                  <div className="topbar-notifications-header">
                    <strong>Notifications</strong>
                    <span>Latest updates for your account.</span>
                  </div>
                  {notificationsLoading ? (
                    <div className="topbar-notifications-state">
                      Loading notifications...
                    </div>
                  ) : notificationsError ? (
                    <div className="topbar-notifications-state topbar-notifications-state-error">
                      {notificationsError}
                    </div>
                  ) : visibleNotifications.length === 0 ? (
                    <div className="topbar-notifications-empty">
                      <img
                        alt=""
                        className="topbar-notifications-empty-icon"
                        src="/assets/icons/bell.png"
                      />
                      <strong>No notifications yet</strong>
                      <span>Ticket updates for your account will appear here.</span>
                    </div>
                  ) : (
                    <div className="topbar-notifications-list">
                      {visibleNotifications.map((notification) => (
                        <article
                          className="topbar-notification-item"
                          key={notification.notificationId}
                        >
                          <div className="topbar-notification-copy">
                            <strong>{notification.notificationType || "Notification"}</strong>
                            <p>{notification.notification || ""}</p>
                            <small>
                              {formatNotificationTime(notification.createdAt)}
                            </small>
                          </div>
                          <div className="topbar-notification-actions">
                            {String(
                              notification.notificationType || "",
                            ).toLowerCase() === "ticket" ? (
                              <button
                                className="topbar-notification-link"
                                onClick={openTicketFromNotification}
                                type="button"
                              >
                                View ticket
                              </button>
                            ) : null}
                            <button
                              aria-label="Dismiss notification"
                              className="topbar-notification-dismiss"
                              onClick={() =>
                                dismissNotification(notification.notificationId)
                              }
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
            <ThemeToggle onClick={onThemeToggle} theme={theme} />
          </div>
        </header>

        <div className="content-scroll">
          <div className="section-stage" key={activeSection?.id || "dashboard"}>
            {shouldShowHero ? (
              <header className="hero-card">
                <div className="hero-copy">
                  <h1>
                    {greeting},{" "}
                    <span>{user?.name || user?.email || "User"}</span>
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
                  : shouldShowAdminResourceManagement
                    ? "dashboard-content-panel-resources"
                    : shouldShowAdminUsers
                      ? "dashboard-content-panel-resources"
                      : shouldShowAdminBookings
                        ? "dashboard-content-panel-book-resource"
                        : shouldShowAdminTimetable
                          ? "dashboard-content-panel-resources"
                          : shouldShowSettingsProfile
                            ? "dashboard-content-panel-settings"
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
              {shouldShowAdminResourceManagement ? (
                <AdminResourceManagementSection token={token} />
              ) : null}
              {shouldShowAdminUsers ? (
                <AdminUsersSection token={token} />
              ) : null}
              {shouldShowAdminBookings ? (
                <AdminPendingBookingsPanel
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                />
              ) : null}
              {shouldShowAdminTimetable ? (
                <AdminTimetablePanel apiBaseUrl={API_BASE_URL} token={token} />
              ) : null}
              {shouldShowMyBookings ? (
                <MyBookingsSection
                  token={token}
                  user={user}
                />
              ) : null}
              {shouldShowBookResource ? (
                <BookResourceSection token={token} user={user} />
              ) : null}
              {shouldShowMyTickets ? <MyTicketsSection /> : null}
              {shouldShowSettingsProfile ? (
                <SettingsProfileSection user={user} />
              ) : null}
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
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const typeFilterRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();
  const resourceTypes = useMemo(
    () =>
      [
        ...new Set(
          allResources.map((resource) => resource.type).filter(Boolean),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [allResources],
  );

  const filteredResources = useMemo(
    () =>
      allResources.filter((resource) => {
        const matchesQuery =
          !normalizedQuery ||
          (resource.name || "").toLowerCase().includes(normalizedQuery);
        const matchesType =
          selectedTypes.length === 0 || selectedTypes.includes(resource.type);
        const rawAvailability = resource?.available ?? resource?.availability;
        const availabilityValue =
          rawAvailability === true || rawAvailability === false
            ? rawAvailability
            : rawAvailability === 1 ||
              rawAvailability === "1" ||
              rawAvailability === "true";
        const matchesAvailability =
          !availableOnly || availabilityValue === true;

        return matchesQuery && matchesType && matchesAvailability;
      }),
    [allResources, availableOnly, normalizedQuery, selectedTypes],
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        typeFilterRef.current &&
        !typeFilterRef.current.contains(event.target)
      ) {
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
        : [...current, type],
    );
  };

  return (
    <div className="resources-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Campus Resources</h2>
        </div>

        <div className="workspace-toolbar">
          <label
            className="workspace-search resources-search"
            htmlFor="resource-search"
          >
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

            <div
              className={`resource-filter-menu ${isTypeFilterOpen ? "resource-filter-menu-open" : ""}`}
            >
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
                  <div className="resource-filter-empty">
                    No resource types found.
                  </div>
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

          <label className="resources-available-toggle">
            <input
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
              type="checkbox"
            />
            <span>Available Only</span>
          </label>
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
            <article
              className="resource-card"
              key={resource.id ?? `${resource.name}-${resource.location}`}
            >
              <div className="resource-card-top">
                <div className="resource-card-mark">
                  {getResourceMark(resource.type)}
                </div>
                <div className="resource-card-copy">
                  <h3>{resource.name || "Unnamed Resource"}</h3>
                  <span>
                    {resource.location || "Campus location not available"}
                  </span>
                </div>
                <span className="resource-type-badge">
                  {resource.type || "Resource"}
                </span>
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

function AdminResourceManagementSection({ token }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [pendingAvailabilityChange, setPendingAvailabilityChange] =
    useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isChangingAvailability, setIsChangingAvailability] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState("");
  const [createName, setCreateName] = useState("");
  const [createCapacity, setCreateCapacity] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editCapacity, setEditCapacity] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const queryValue = query.trim().toLowerCase();
  const typeOptions = useMemo(
    () =>
      [
        ...new Set(resources.map((resource) => resource.type).filter(Boolean)),
      ].sort((left, right) => left.localeCompare(right)),
    [resources],
  );

  function getCapacityNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  const filteredResources = useMemo(() => {
    const parsedMin = minCapacity.trim() === "" ? null : Number(minCapacity);
    const parsedMax = maxCapacity.trim() === "" ? null : Number(maxCapacity);

    const min =
      parsedMin != null && Number.isFinite(parsedMin)
        ? parsedMax != null && Number.isFinite(parsedMax)
          ? Math.min(parsedMin, parsedMax)
          : parsedMin
        : null;

    const max =
      parsedMax != null && Number.isFinite(parsedMax)
        ? parsedMin != null && Number.isFinite(parsedMin)
          ? Math.max(parsedMin, parsedMax)
          : parsedMax
        : null;

    return resources.filter((resource) => {
      const resourceName = (resource.name || "").toLowerCase();
      const resourceId = resource.id == null ? "" : String(resource.id);
      const matchesQuery =
        !queryValue ||
        resourceName.includes(queryValue) ||
        resourceId.includes(queryValue);
      const matchesType = !selectedType || resource.type === selectedType;

      const capacityValue = getCapacityNumber(resource.capacity);
      const matchesMin =
        min == null || (capacityValue != null && capacityValue >= min);
      const matchesMax =
        max == null || (capacityValue != null && capacityValue <= max);
      const availabilityValue = getAvailabilityBoolean(resource);
      const matchesAvailability = !availableOnly || availabilityValue === true;

      return (
        matchesQuery &&
        matchesType &&
        matchesMin &&
        matchesMax &&
        matchesAvailability
      );
    });
  }, [
    availableOnly,
    maxCapacity,
    minCapacity,
    queryValue,
    resources,
    selectedType,
  ]);

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

        setResources(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setResources([]);
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

  const currentCapacityValue =
    editingResource?.capacity == null ? "" : String(editingResource.capacity);
  const currentLocationValue = editingResource?.location || "";
  const isEditDirty =
    editingResource != null &&
    (editCapacity !== currentCapacityValue ||
      editLocation !== currentLocationValue);

  function getAvailabilityBoolean(resource) {
    const rawValue = resource?.available ?? resource?.availability;
    if (rawValue === true || rawValue === false) {
      return rawValue;
    }
    if (rawValue === 1 || rawValue === "1" || rawValue === "true") {
      return true;
    }
    if (rawValue === 0 || rawValue === "0" || rawValue === "false") {
      return false;
    }
    return null;
  }

  function getAvailabilitySelectValue(resource) {
    const availabilityValue = getAvailabilityBoolean(resource);
    if (availabilityValue === true) return "available";
    if (availabilityValue === false) return "not-available";
    return "unknown";
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateType("");
    setCreateName("");
    setCreateCapacity("");
    setCreateLocation("");
    setCreateError("");
  };

  const saveCreatedResource = async () => {
    const trimmedType = createType.trim();
    const trimmedName = createName.trim();
    const trimmedLocation = createLocation.trim();

    if (!trimmedType || !trimmedName || !trimmedLocation) {
      setCreateError("Type, name, and location are required.");
      return;
    }

    const payload = {
      type: trimmedType,
      name: trimmedName,
      location: trimmedLocation,
    };

    if (createCapacity.trim() !== "") {
      const parsedCapacity = Number(createCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
        setCreateError("Capacity must be a valid positive number.");
        return;
      }
      payload.capacity = parsedCapacity;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/facilities/createResource`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );

      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(responsePayload));
      }

      setResources((current) =>
        [...current, responsePayload].sort((left, right) => {
          const leftId = left?.id ?? Number.MAX_SAFE_INTEGER;
          const rightId = right?.id ?? Number.MAX_SAFE_INTEGER;
          return leftId - rightId;
        }),
      );
      closeCreateModal();
    } catch (requestError) {
      setCreateError(
        requestError.message || "Unable to create the resource right now.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (resource) => {
    setEditingResource(resource);
    setEditCapacity(resource.capacity == null ? "" : String(resource.capacity));
    setEditLocation(resource.location || "");
    setEditError("");
    setIsCloseConfirmOpen(false);
  };

  const closeEditModal = (forceDiscard = false) => {
    if (editingResource && isEditDirty && !forceDiscard) {
      setIsCloseConfirmOpen(true);
      return;
    }

    setEditingResource(null);
    setEditCapacity("");
    setEditLocation("");
    setEditError("");
    setIsCloseConfirmOpen(false);
  };

  const requestAvailabilityChange = (resource, nextValue) => {
    if (nextValue !== "available" && nextValue !== "not-available") return;

    const currentValue = getAvailabilitySelectValue(resource);
    if (currentValue === nextValue) return;

    setAvailabilityError("");
    setPendingAvailabilityChange({
      resource,
      nextValue,
    });
  };

  const confirmAvailabilityChange = async () => {
    if (!pendingAvailabilityChange?.resource?.id) return;

    setIsChangingAvailability(true);
    setAvailabilityError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/facilities/changeResourceAvailability`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            resource_id: pendingAvailabilityChange.resource.id,
            available: pendingAvailabilityChange.nextValue === "available",
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(payload));
      }

      const nextAvailabilityValue = payload?.available;
      const normalizedAvailability =
        typeof nextAvailabilityValue === "boolean"
          ? nextAvailabilityValue
          : pendingAvailabilityChange.nextValue === "available";

      setResources((current) =>
        current.map((resource) =>
          resource.id === pendingAvailabilityChange.resource.id
            ? { ...resource, available: normalizedAvailability }
            : resource,
        ),
      );
      setPendingAvailabilityChange(null);
    } catch (requestError) {
      setAvailabilityError(
        requestError.message || "Unable to update availability right now.",
      );
    } finally {
      setIsChangingAvailability(false);
    }
  };

  const saveResourceUpdate = async () => {
    if (!editingResource) return;

    const trimmedLocation = editLocation.trim();
    const payload = {};

    if (trimmedLocation !== currentLocationValue) {
      if (!trimmedLocation) {
        setEditError("Location is required.");
        return;
      }
      payload.location = trimmedLocation;
    }

    if (editCapacity !== currentCapacityValue) {
      if (editCapacity.trim() === "") {
        setEditError("Capacity cannot be empty when changing it.");
        return;
      }

      const parsedCapacity = Number(editCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
        setEditError("Capacity must be a valid positive number.");
        return;
      }

      payload.capacity = parsedCapacity;
    }

    if (Object.keys(payload).length === 0) {
      closeEditModal(true);
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/facilities/updateResource/${editingResource.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        },
      );

      const payloadResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(payloadResponse));
      }

      setResources((current) =>
        current.map((resource) =>
          resource.id === editingResource.id ? payloadResponse : resource,
        ),
      );
      closeEditModal(true);
    } catch (requestError) {
      setEditError(
        requestError.message || "Unable to update the resource right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingResource) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(
        `${API_BASE_URL}/api/facilities/deleteResource/${deletingResource.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getMessage(payload));
      }

      setResources((current) =>
        current.filter((resource) => resource.id !== deletingResource.id),
      );
      setDeletingResource(null);
    } catch (requestError) {
      setDeleteError(
        requestError.message || "Unable to delete the resource right now.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="resource-management-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Resource Management</h2>
        </div>
        <button
          className="workspace-add-button resource-management-add-button"
          onClick={() => setIsCreateModalOpen(true)}
          type="button"
        >
          <span className="resource-management-add-icon">
            <PlusSquareIcon />
          </span>
          <span>Add Resource</span>
        </button>
      </div>

      <div className="resource-management-toolbar">
        <label
          className="workspace-search resource-management-search"
          htmlFor="resource-management-search"
        >
          <SearchIcon />
          <input
            id="resource-management-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by resource name or ID..."
            type="search"
            value={query}
          />
        </label>

        <label className="resource-management-filter">
          <span>Type</span>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="resource-management-filter resource-management-filter-sm">
          <span>Min Capacity</span>
          <input
            inputMode="numeric"
            onChange={(event) => setMinCapacity(event.target.value)}
            placeholder="Min"
            type="number"
            value={minCapacity}
          />
        </label>

        <label className="resource-management-filter resource-management-filter-sm">
          <span>Max Capacity</span>
          <input
            inputMode="numeric"
            onChange={(event) => setMaxCapacity(event.target.value)}
            placeholder="Max"
            type="number"
            value={maxCapacity}
          />
        </label>

        <label className="resource-management-checkbox">
          <input
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.target.checked)}
            type="checkbox"
          />
          <span>Available Only</span>
        </label>
      </div>

      {loading ? (
        <div className="resources-state-card">
          <div className="resources-loading-dots">
            <span />
            <span />
            <span />
          </div>
          <strong>Loading resource table...</strong>
          <span>Fetching the latest campus resource records.</span>
        </div>
      ) : error ? (
        <div className="resources-state-card resources-state-error">
          <strong>Could not load resources</strong>
          <span>{error}</span>
        </div>
      ) : (
        <div className="resource-management-table-wrap">
          <table className="resource-management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Availability</th>
                <th>Update</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length === 0 ? (
                <tr>
                  <td className="resource-management-empty-row" colSpan={8}>
                    No resources matched the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr
                    key={resource.id ?? `${resource.name}-${resource.location}`}
                  >
                    <td>{resource.id ?? "N/A"}</td>
                    <td>{resource.type || "N/A"}</td>
                    <td>{resource.name || "N/A"}</td>
                    <td>{resource.capacity ?? "N/A"}</td>
                    <td>{resource.location || "N/A"}</td>
                    <td>
                      <div className="resource-management-availability-cell">
                        <select
                          className="resource-management-select"
                          onChange={(event) =>
                            requestAvailabilityChange(
                              resource,
                              event.target.value,
                            )
                          }
                          value={getAvailabilitySelectValue(resource)}
                        >
                          <option value="unknown" disabled>
                            Unknown
                          </option>
                          <option value="available">Available</option>
                          <option value="not-available">Not Available</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <button
                        className="resource-management-action resource-management-action-update"
                        onClick={() => openEditModal(resource)}
                        type="button"
                      >
                        Update
                      </button>
                    </td>
                    <td>
                      <button
                        className="resource-management-action resource-management-action-delete"
                        onClick={() => setDeletingResource(resource)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingResource ? (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-update-title"
          >
            <button
              className="modal-close"
              onClick={() => closeEditModal()}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="resource-update-title">Update Resource</h3>
              <p>Update the editable resource details below.</p>
            </div>

            <div className="modal-form-grid">
              <label className="modal-field">
                <span>ID</span>
                <input readOnly type="text" value={editingResource.id ?? ""} />
              </label>
              <label className="modal-field">
                <span>Type</span>
                <input
                  readOnly
                  type="text"
                  value={editingResource.type || "N/A"}
                />
              </label>
              <label className="modal-field">
                <span>Name</span>
                <input
                  readOnly
                  type="text"
                  value={editingResource.name || "N/A"}
                />
              </label>
              <label className="modal-field">
                <span>Capacity</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setEditCapacity(event.target.value)}
                  placeholder="Capacity"
                  type="number"
                  value={editCapacity}
                />
              </label>
              <label className="modal-field modal-field-full">
                <span>Location</span>
                <input
                  onChange={(event) => setEditLocation(event.target.value)}
                  placeholder="Location"
                  type="text"
                  value={editLocation}
                />
              </label>
            </div>

            {editError ? (
              <div className="modal-inline-error">{editError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={() => closeEditModal(true)}
                type="button"
              >
                Discard
              </button>
              <button
                className="modal-primary-button"
                disabled={isSaving}
                onClick={saveResourceUpdate}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>

            {isCloseConfirmOpen ? (
              <div className="modal-confirm-strip">
                <strong>Unsaved changes</strong>
                <span>Do you want to save before closing this window?</span>
                <div className="modal-confirm-actions">
                  <button
                    className="modal-secondary-button"
                    onClick={() => setIsCloseConfirmOpen(false)}
                    type="button"
                  >
                    Continue Editing
                  </button>
                  <button
                    className="modal-secondary-button"
                    onClick={() => closeEditModal(true)}
                    type="button"
                  >
                    Discard
                  </button>
                  <button
                    className="modal-primary-button"
                    disabled={isSaving}
                    onClick={saveResourceUpdate}
                    type="button"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {deletingResource ? (
        <div className="modal-backdrop">
          <div
            className="modal-card modal-card-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-delete-title"
          >
            <div className="modal-header">
              <h3 id="resource-delete-title">Delete Resource</h3>
              <p>
                {deleteError
                  ? "This resource having current booking, so cancel them first and try to delete the resource."
                  : `Are you sure you want to delete ${deletingResource.name || "this resource"}?`}
              </p>
            </div>
            {deleteError ? (
              <div className="modal-actions">
                <button
                  className="modal-primary-button"
                  onClick={() => {
                    setDeletingResource(null);
                    setDeleteError("");
                  }}
                  type="button"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="modal-actions">
                <button
                  className="modal-secondary-button"
                  onClick={() => {
                    setDeletingResource(null);
                    setDeleteError("");
                  }}
                  type="button"
                >
                  No
                </button>
                <button
                  className="resource-management-action resource-management-action-delete"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  type="button"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {pendingAvailabilityChange ? (
        <div className="modal-backdrop">
          <div
            aria-labelledby="resource-availability-title"
            aria-modal="true"
            className="modal-card modal-card-confirm"
            role="dialog"
          >
            <div className="modal-header">
              <h3 id="resource-availability-title">Change Availability</h3>
              <p>
                Are you sure you want to mark{" "}
                {pendingAvailabilityChange.resource.name || "this resource"} as{" "}
                {pendingAvailabilityChange.nextValue === "available"
                  ? "Available"
                  : "Not Available"}
                ?
              </p>
            </div>

            {availabilityError ? (
              <div className="modal-inline-error">{availabilityError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={() => {
                  setPendingAvailabilityChange(null);
                  setAvailabilityError("");
                }}
                type="button"
              >
                No
              </button>
              <button
                className="modal-primary-button"
                disabled={isChangingAvailability}
                onClick={confirmAvailabilityChange}
                type="button"
              >
                {isChangingAvailability ? "Updating..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="modal-backdrop">
          <div
            aria-labelledby="resource-create-title"
            aria-modal="true"
            className="modal-card"
            role="dialog"
          >
            <button
              className="modal-close"
              onClick={closeCreateModal}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="resource-create-title">Create Resource</h3>
              <p>Add a new campus resource to the catalog.</p>
            </div>

            <div className="modal-form-grid">
              <label className="modal-field">
                <span>Type</span>
                <select
                  onChange={(event) => setCreateType(event.target.value)}
                  value={createType}
                >
                  <option value="">Select type</option>
                  <option value="LecHall">Lecture Hall</option>
                  <option value="Lab">Lab</option>
                  <option value="Item">Item</option>
                </select>
              </label>
              <label className="modal-field">
                <span>Name</span>
                <input
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="E302"
                  type="text"
                  value={createName}
                />
              </label>
              <label className="modal-field">
                <span>Capacity</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setCreateCapacity(event.target.value)}
                  placeholder="45"
                  type="number"
                  value={createCapacity}
                />
              </label>
              <label className="modal-field modal-field-full">
                <span>Location</span>
                <input
                  onChange={(event) => setCreateLocation(event.target.value)}
                  placeholder="FOC New Building"
                  type="text"
                  value={createLocation}
                />
              </label>
            </div>

            {createError ? (
              <div className="modal-inline-error">{createError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={closeCreateModal}
                type="button"
              >
                Discard
              </button>
              <button
                className="modal-primary-button"
                disabled={isCreating}
                onClick={saveCreatedResource}
                type="button"
              >
                {isCreating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminUsersSection({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
function MyBookingsSection({ token, user }) {
  const [activeTab, setActiveTab] = useState("approved");
  const activePanel = {
    approved: <ApprovedBookingsPanel apiBaseUrl={API_BASE_URL} token={token} userId={user?.userId} />,
    pending: <PendingBookingsPanel apiBaseUrl={API_BASE_URL} token={token} userId={user?.userId} />,
    rejected: <RejectedBookingsPanelView apiBaseUrl={API_BASE_URL} token={token} userId={user?.userId} />,
    cancelled: <CancelledBookingsPanelView apiBaseUrl={API_BASE_URL} token={token} userId={user?.userId} />,
  }[activeTab];

  const queryValue = query.trim().toLowerCase();
  const roleOptions = useMemo(
    () =>
      [...new Set(users.map((user) => user.roleName).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [users],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const searchBlob = [
          user.userId,
          user.name,
          user.username,
          user.email,
          user.phone,
          user.address,
          user.roleName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesQuery = !queryValue || searchBlob.includes(queryValue);
        const matchesRole = !selectedRole || user.roleName === selectedRole;
        const statusValue = user.active ? "active" : "inactive";
        const matchesStatus = !selectedStatus || statusValue === selectedStatus;

        return matchesQuery && matchesRole && matchesStatus;
      }),
    [queryValue, selectedRole, selectedStatus, users],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(getMessage(payload));
        }

        setUsers(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setUsers([]);
        setError(requestError.message || "Unable to load users right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [token]);

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPhone(user.phone || "");
    setEditAddress(user.address || "");
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditPhone("");
    setEditAddress("");
    setEditError("");
  };

  const saveUserUpdate = async () => {
    if (!editingUser?.userId) return;

    const payload = {};
    const trimmedPhone = editPhone.trim();
    const trimmedAddress = editAddress.trim();

    if (trimmedPhone !== (editingUser.phone || ""))
      payload.phone = trimmedPhone;
    if (trimmedAddress !== (editingUser.address || ""))
      payload.address = trimmedAddress;

    if (Object.keys(payload).length === 0) {
      closeEditModal();
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${editingUser.userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        },
      );

      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(responsePayload));
      }

      setUsers((current) =>
        current.map((user) =>
          user.userId === editingUser.userId ? responsePayload : user,
        ),
      );
      closeEditModal();
    } catch (requestError) {
      setEditError(
        requestError.message || "Unable to update the user right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser?.userId) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${deletingUser.userId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getMessage(payload));
      }

      setDeletingUser(null);
      window.location.reload();
    } catch (requestError) {
      setDeleteError(
        requestError.message || "Unable to delete the user right now.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="resource-management-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>User Management</h2>
        </div>
      </div>

      <div className="resource-management-toolbar">
        <label
          className="workspace-search resource-management-search"
          htmlFor="user-management-search"
        >
          <SearchIcon />
          <input
            id="user-management-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by user name, username, email, or ID..."
            type="search"
            value={query}
          />
        </label>

        <label className="resource-management-filter">
          <span>Role</span>
          <select
            onChange={(event) => setSelectedRole(event.target.value)}
            value={selectedRole}
          >
            <option value="">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="resource-management-filter">
          <span>Status</span>
          <select
            onChange={(event) => setSelectedStatus(event.target.value)}
            value={selectedStatus}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="resources-state-card">
          <div className="resources-loading-dots">
            <span />
            <span />
            <span />
          </div>
          <strong>Loading user table...</strong>
          <span>Fetching the latest user records.</span>
        </div>
      ) : error ? (
        <div className="resources-state-card resources-state-error">
          <strong>Could not load users</strong>
          <span>{error}</span>
        </div>
      ) : (
        <div className="resource-management-table-wrap">
          <table className="resource-management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td className="resource-management-empty-row" colSpan={10}>
                    No users matched the current search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.userId ?? "N/A"}</td>
                    <td>{user.name || "N/A"}</td>
                    <td>{user.username || "N/A"}</td>
                    <td>{user.email || "N/A"}</td>
                    <td>{user.phone || "N/A"}</td>
                    <td>{user.address || "N/A"}</td>
                    <td>{user.roleName || "N/A"}</td>
                    <td>{user.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className="resource-management-action resource-management-action-update"
                        onClick={() => openEditModal(user)}
                        type="button"
                      >
                        Edit
                      </button>
                    </td>
                    <td>
                      <button
                        className="resource-management-action resource-management-action-delete"
                        onClick={() => setDeletingUser(user)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingUser ? (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-update-title"
          >
            <button
              className="modal-close"
              onClick={closeEditModal}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="user-update-title">Edit User</h3>
              <p>Update the user details below.</p>
            </div>

            <div className="modal-form-grid">
              <label className="modal-field">
                <span>ID</span>
                <input readOnly type="text" value={editingUser.userId ?? ""} />
              </label>
              <label className="modal-field">
                <span>Role</span>
                <input
                  readOnly
                  type="text"
                  value={editingUser.roleName || "N/A"}
                />
              </label>
              <label className="modal-field">
                <span>Name</span>
                <input readOnly type="text" value={editingUser.name || "N/A"} />
              </label>
              <label className="modal-field">
                <span>Username</span>
                <input
                  readOnly
                  type="text"
                  value={editingUser.username || "N/A"}
                />
              </label>
              <label className="modal-field">
                <span>Phone</span>
                <input
                  onChange={(event) => setEditPhone(event.target.value)}
                  placeholder="10-digit phone"
                  type="text"
                  value={editPhone}
                />
              </label>
              <label className="modal-field modal-field-full">
                <span>Address</span>
                <input
                  onChange={(event) => setEditAddress(event.target.value)}
                  placeholder="Home address"
                  type="text"
                  value={editAddress}
                />
              </label>
            </div>

            {editError ? (
              <div className="modal-inline-error">{editError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={closeEditModal}
                type="button"
              >
                Discard
              </button>
              <button
                className="modal-primary-button"
                disabled={isSaving}
                onClick={saveUserUpdate}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingUser ? (
        <div className="modal-backdrop">
          <div
            className="modal-card modal-card-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-delete-title"
          >
            <div className="modal-header">
              <h3 id="user-delete-title">Delete User</h3>
              <p>
                {deleteError
                  ? "The user could not be deleted. Please try again."
                  : `Are you sure you want to delete ${deletingUser.name || deletingUser.username || `user #${deletingUser.userId}`}?`}
              </p>
            </div>

            {deleteError ? (
              <div className="modal-actions">
                <button
                  className="modal-primary-button"
                  onClick={() => {
                    setDeletingUser(null);
                    setDeleteError("");
                  }}
                  type="button"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="modal-actions">
                <button
                  className="modal-secondary-button"
                  onClick={() => {
                    setDeletingUser(null);
                    setDeleteError("");
                  }}
                  type="button"
                >
                  No
                </button>
                <button
                  className="resource-management-action resource-management-action-delete"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  type="button"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MyBookingsSection({ token, user }) {
  const [activeTab, setActiveTab] = useState("approved");

  const activePanel = {
    approved: (
      <ApprovedBookingsPanel
        apiBaseUrl={API_BASE_URL}
        token={token}
        userId={user?.userId}
      />
    ),
    pending: (
      <PendingBookingsPanel
        apiBaseUrl={API_BASE_URL}
        token={token}
        userId={user?.userId}
      />
    ),
    rejected: <RejectedBookingsPanel />,
    cancelled: <CancelledBookingsPanel />,
  }[activeTab];

  return (
    <div className="book-resource-shell">
      <div
        className="book-resource-tabs bookings-tabs"
        role="tablist"
        aria-label="My bookings status tabs"
      >
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

      <div
        className="book-resource-tab-panel"
        role="tabpanel"
        aria-live="polite"
      >
        {activePanel}
      </div>
    </div>
  );
}

function SettingsProfileSection({ user }) {
  return (
    <div className="settings-profile-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Profile</h2>
        </div>
      </div>

      <div className="settings-profile-card">
        <div className="settings-profile-hero">
          <div className="settings-profile-avatar">
            {getInitials(user?.name || user?.email || "SC")}
          </div>
          <div className="settings-profile-copy">
            <h3>{user?.name || "Smart Campus User"}</h3>
            <span>{user?.roleName || "User"}</span>
          </div>
        </div>

        <div className="settings-profile-grid">
          <div className="settings-profile-item">
            <span>Name</span>
            <strong>{user?.name || "N/A"}</strong>
          </div>
          <div className="settings-profile-item">
            <span>Email</span>
            <strong>{user?.email || "N/A"}</strong>
          </div>
          <div className="settings-profile-item">
            <span>Role</span>
            <strong>{user?.roleName || "N/A"}</strong>
          </div>
          <div className="settings-profile-item">
            <span>User ID</span>
            <strong>{user?.id ?? "N/A"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookResourceSection({ token, user }) {
  const [activeTab, setActiveTab] = useState("type");
  const activePanel =
    activeTab === "type" ? (
      <BookByTypePanel
        apiBaseUrl={API_BASE_URL}
        roleName={user?.roleName}
        token={token}
        userId={user?.userId}
      />
    ) : (
      <BookByNamePanel
        apiBaseUrl={API_BASE_URL}
        token={token}
        userId={user?.userId}
      />
      <BookByNamePanel apiBaseUrl={API_BASE_URL} token={token} userId={user?.userId} roleName={user?.roleName} />
    );

  return (
    <div className="book-resource-shell">
      <div
        className="book-resource-tabs"
        role="tablist"
        aria-label="Book resource options"
      >
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

      <div
        className="book-resource-tab-panel"
        role="tabpanel"
        aria-live="polite"
      >
        {activePanel}
      </div>
    </div>
  );
}

function MyTicketsSection() {
  const [activeTab, setActiveTab] = useState("open");
  const tabs = [
    { key: "open", label: "Open", panel: <OpenTicketsPanel /> },
    {
      key: "in-progress",
      label: "In Progress",
      panel: <InProgressTicketsPanel />,
    },
    { key: "resolved", label: "Resolved", panel: <ResolvedTicketsPanel /> },
    { key: "rejected", label: "Rejected", panel: <RejectedTicketsPanel /> },
  ];
  const activePanel =
    tabs.find((tab) => tab.key === activeTab)?.panel || tabs[0].panel;

  return (
    <div className="book-resource-shell">
      <div
        className="book-resource-tabs tickets-tabs"
        role="tablist"
        aria-label="My tickets status tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            aria-selected={activeTab === tab.key}
            className={`book-resource-tab ${activeTab === tab.key ? "book-resource-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="book-resource-tab-panel"
        role="tabpanel"
        aria-live="polite"
      >
        {activePanel}
      </div>
    </div>
  );
}

function RejectedBookingsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Rejected Bookings</h3>
      <p>
        Rejected bookings display here. We can add the real rejected booking
        content next.
      </p>
    </div>
  );
}

function CancelledBookingsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Cancelled Bookings</h3>
      <p>
        Cancelled bookings display here. We can add the real cancelled booking
        content next.
      </p>
    </div>
  );
}

function OpenTicketsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Open Tickets</h3>
      <p>
        Open tickets display here. We can add the real open ticket content next.
      </p>
    </div>
  );
}

function InProgressTicketsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>In Progress Tickets</h3>
      <p>
        In progress tickets display here. We can add the real in progress ticket
        content next.
      </p>
    </div>
  );
}

function ResolvedTicketsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Resolved Tickets</h3>
      <p>
        Resolved tickets display here. We can add the real resolved ticket
        content next.
      </p>
    </div>
  );
}

function RejectedTicketsPanel() {
  return (
    <div className="book-resource-panel-card">
      <h3>Rejected Tickets</h3>
      <p>
        Rejected tickets display here. We can add the real rejected ticket
        content next.
      </p>
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
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className="theme-toggle"
      onClick={onClick}
      type="button"
    >
      <img
        alt=""
        className="theme-toggle-icon"
        src={
          theme === "dark"
            ? "/assets/icons/lightMode.png"
            : "/assets/icons/darkMode.png"
        }
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
      <path
        d="M10 20v-5h4v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8v8M8 12h8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8v4.5l3 1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <circle
        cx="11"
        cy="11"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m20 20-4.2-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="m10 7 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
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
  const parts = String(value).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "SC";
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default App;
