import { useEffect, useMemo, useRef, useState } from "react";
import AdminPendingBookingsPanel from "./components/admin/AdminPendingBookingsPanel";
import AdminTimetablePanel from "./components/admin/AdminTimetablePanel";
import ApprovedBookingsPanel from "./components/booking/ApprovedBookingsPanel";
import BookByNamePanel from "./components/booking/BookByNamePanel";
import BookByTypePanel from "./components/booking/BookByTypePanel";
import CancelledBookingsPanelView from "./components/booking/CancelledBookingsPanel";
import PendingBookingsPanel from "./components/booking/PendingBookingsPanel";
import RaiseTicketPanel from "./components/tickets/RaiseTicketPanel";
import TicketManagementPanel from "./components/tickets/TicketManagementPanel";
import RejectedBookingsPanelView from "./components/booking/RejectedBookingsPanel";
import RegisterUser from "./components/registerUser";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const OAUTH_BASE_URL =
  API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8080`;
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
    view: "raise-ticket",
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
    label: "Ticket Management",
    view: "my-tickets",
    iconSrc: "/assets/icons/my_tickets.png",
    placement: "quick",
    title: "Tickets",
    description: "Manage and resolve campus support tickets.",
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
    description: "Work on assigned tasks and update ticket status.",
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

function isJwtExpired(jwt) {
  const expiry = Number(jwt?.exp);
  if (!Number.isFinite(expiry) || expiry <= 0) return true;
  return expiry * 1000 <= Date.now();
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
    if (!jwt || isJwtExpired(jwt)) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return {
      ...parsed,
      user: {
        ...(parsed.user || {}),
        roleName: jwt?.role || parsed?.user?.roleName || null,
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
  if (hash === "#/register") {
    return { type: "register", hash };
  }
  return { type: "login", hash: "#/login" };
}

function setHash(nextHash, replace = false) {
  const value = nextHash.startsWith("#") ? nextHash : `#${nextHash}`;
  const nextUrl =
    replace && window.location.pathname.startsWith("/oauth2/callback")
      ? `/${value}`
      : value;
  if (replace) {
    window.history.replaceState(null, "", nextUrl);
  } else {
    window.location.hash = value;
  }
}

function readOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const userId = Number(params.get("userId"));

  if (!token || !Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  return {
    token,
    userId,
    oauthRegistration: params.get("oauthRegistration") === "true",
  };
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
  const [oauthCompletion, setOauthCompletion] = useState(null);
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
      if (route.type !== "login" && route.type !== "register") {
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

  useEffect(() => {
    const oauthCallback = readOAuthCallback();
    if (!oauthCallback) {
      return undefined;
    }

    let cancelled = false;

    async function completeOAuthLogin() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/${oauthCallback.userId}`,
          {
            headers: {
              Authorization: `Bearer ${oauthCallback.token}`,
            },
          },
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(getMessage(payload));
        if (cancelled) return;

        handleLoginSuccess({
          token: oauthCallback.token,
          user: payload,
        });

        if (oauthCallback.oauthRegistration) {
          setOauthCompletion({
            token: oauthCallback.token,
            user: payload,
          });
        }
      } catch {
        if (cancelled) return;
        setHash("#/login", true);
        setRoute(readRoute());
      }
    }

    completeOAuthLogin();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setOauthCompletion(null);
    setHash("#/login", true);
    setRoute(readRoute());
  };

  if (!session || !group || !config) {
    if (route.type === "register") {
      return (
        <RegisterUser
          apiBaseUrl={API_BASE_URL}
          onRegisterSuccess={handleLoginSuccess}
          onShowLogin={() => {
            setHash("#/login");
            setRoute(readRoute());
          }}
          onThemeToggle={toggleTheme}
          theme={theme}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onShowRegister={() => {
          setHash("#/register");
          setRoute(readRoute());
        }}
        onThemeToggle={toggleTheme}
        theme={theme}
      />
    );
  }

  return (
    <>
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
      {oauthCompletion ? (
        <OAuthRegistrationModal
          apiBaseUrl={API_BASE_URL}
          onSuccess={(response) => {
            handleLoginSuccess(response);
            setOauthCompletion(null);
          }}
          token={oauthCompletion.token}
          user={oauthCompletion.user}
        />
      ) : null}
    </>
  );
}

function LoginPage({ onLoginSuccess, onShowRegister, onThemeToggle, theme }) {
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
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);
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
    setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
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
    setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
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
    setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
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

  const continueWithGoogle = () => {
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/google`;
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
      setShowResetNewPassword(false);
      setShowResetConfirmPassword(false);
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

              <button
                className="secondary-button google-button"
                onClick={continueWithGoogle}
                type="button"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button
                className="text-button field-link"
                onClick={onShowRegister}
                type="button"
              >
                Create a user account
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
                  <div className="password-wrap">
                    <input
                      autoComplete="new-password"
                      onChange={(event) =>
                        setResetNewPassword(event.target.value)
                      }
                      placeholder="Enter new password"
                      required
                      type={showResetNewPassword ? "text" : "password"}
                      value={resetNewPassword}
                    />
                    <button
                      className="icon-button"
                      onClick={() =>
                        setShowResetNewPassword((value) => !value)
                      }
                      type="button"
                    >
                      {showResetNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="modal-field modal-field-full">
                  <span>Confirm Password</span>
                  <div className="password-wrap">
                    <input
                      autoComplete="new-password"
                      onChange={(event) =>
                        setResetConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                      required
                      type={showResetConfirmPassword ? "text" : "password"}
                      value={resetConfirmPassword}
                    />
                    <button
                      className="icon-button"
                      onClick={() =>
                        setShowResetConfirmPassword((value) => !value)
                      }
                      type="button"
                    >
                      {showResetConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
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

function OAuthRegistrationModal({
  apiBaseUrl,
  onSuccess,
  token,
  user,
}) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      setError("Username is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/users/oAuthUpdate/${user?.userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: normalizedUsername,
            roleName: user?.roleName || "Student",
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getMessage(payload));

      onSuccess(payload);
    } catch (requestError) {
      setError(requestError.message || "Unable to complete OAuth registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card forgot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oauth-registration-title"
      >
        <div className="modal-header">
          <h3 id="oauth-registration-title">Complete your profile</h3>
          <p>
            Your Google sign-in worked. Choose a username to finish your
            registration.
          </p>
        </div>

        <form className="auth-form forgot-form" onSubmit={submit}>
          <label className="modal-field modal-field-full">
            <span>Username</span>
            <input
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
              required
              type="text"
              value={username}
            />
          </label>

          {error ? <div className="modal-inline-error">{error}</div> : null}

          <div className="modal-actions">
            <button
              className="modal-primary-button"
              disabled={loading}
              type="submit"
            >
              {loading ? "Saving..." : "Save Username"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const normalizedRole = normalizeRole(user?.roleName);
  const activeView = activeSection?.view;
  const shouldShowHero = activeView === "dashboard";
  const shouldShowStudentLecturerDashboard =
    shouldShowHero &&
    (normalizedRole === "student" || normalizedRole === "lecturer");
  const shouldShowAdminDashboard =
    shouldShowHero && normalizedRole === "admin";
  const shouldShowTechnicianDashboard =
    shouldShowHero && normalizedRole === "technician";
  const shouldShowResources = activeView === "resources";
  const shouldShowMyBookings = activeView === "my-bookings";
  const shouldShowBookResource = activeView === "book-resource";
  const shouldShowMyTickets = activeView === "my-tickets";
  const shouldShowRaiseTicket = activeView === "raise-ticket";
  const shouldShowAdminResourceManagement = activeView === "admin-resource-management";
  const shouldShowAdminUsers = activeView === "admin-users";
  const shouldShowAdminBookings = activeView === "admin-bookings";
  const shouldShowAdminTimetable = activeView === "admin-timetable";
  const shouldShowAdminAnalytics = activeSection?.id === "admin-analytics";
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
                shouldShowStudentLecturerDashboard ||
                shouldShowAdminDashboard ||
                shouldShowTechnicianDashboard
                  ? "dashboard-content-panel-dashboard"
                  : shouldShowResources
                  ? "dashboard-content-panel-resources"
                  : shouldShowAdminResourceManagement
                    ? "dashboard-content-panel-resources"
                    : shouldShowAdminUsers
                      ? "dashboard-content-panel-resources"
                      : shouldShowAdminBookings
                        ? "dashboard-content-panel-book-resource"
                        : shouldShowAdminTimetable
                          ? "dashboard-content-panel-resources"
                          : shouldShowAdminAnalytics
                            ? "dashboard-content-panel-analytics"
                          : shouldShowSettingsProfile
                            ? "dashboard-content-panel-settings"
                            : shouldShowMyBookings
                              ? "dashboard-content-panel-book-resource"
                              : shouldShowBookResource
                                ? "dashboard-content-panel-book-resource"
                                : shouldShowMyTickets
                                  ? "dashboard-content-panel-book-resource"
                                  : shouldShowRaiseTicket
                                    ? "dashboard-content-panel-book-resource"
                                    : "dashboard-content-empty"
              }`}
            >
              {shouldShowStudentLecturerDashboard ? (
                <StudentLecturerDashboardSection
                  notifications={visibleNotifications}
                  onOpenBookings={() => {
                    const bookingsSection = sections.find(
                      (section) => section.view === "my-bookings",
                    );
                    if (bookingsSection) {
                      onSectionChange(bookingsSection.id);
                    }
                  }}
                  onOpenTickets={() => {
                    const ticketsSection = sections.find(
                      (section) => section.view === "my-tickets",
                    );
                    if (ticketsSection) {
                      onSectionChange(ticketsSection.id);
                    }
                  }}
                  token={token}
                  unreadNotificationCount={unreadNotificationCount}
                  user={user}
                />
              ) : null}
              {shouldShowAdminDashboard ? (
                <AdminDashboardSection token={token} />
              ) : null}
              {shouldShowTechnicianDashboard ? (
                <TechnicianDashboardSection
                  notifications={visibleNotifications}
                  onOpenResources={() => {
                    const resourcesSection = sections.find(
                      (section) => section.view === "resources",
                    );
                    if (resourcesSection) {
                      onSectionChange(resourcesSection.id);
                    }
                  }}
                  onOpenTickets={() => {
                    const ticketsSection = sections.find(
                      (section) => section.view === "my-tickets",
                    );
                    if (ticketsSection) {
                      onSectionChange(ticketsSection.id);
                    }
                  }}
                  token={token}
                  unreadNotificationCount={unreadNotificationCount}
                />
              ) : null}
              {shouldShowResources ? <ResourcesSection token={token} /> : null}
              {shouldShowAdminResourceManagement ? <AdminResourceManagementSection token={token} /> : null}
              {shouldShowAdminUsers ? <AdminUsersSection token={token} /> : null}
              {shouldShowAdminBookings ? <AdminPendingBookingsPanel apiBaseUrl={API_BASE_URL} token={token} /> : null}
              {shouldShowAdminTimetable ? <AdminTimetablePanel apiBaseUrl={API_BASE_URL} token={token} /> : null}
              {shouldShowAdminAnalytics ? <AdminAnalyticsSection token={token} /> : null}
              {shouldShowMyBookings ? <MyBookingsSection token={token} user={user} /> : null}
              {shouldShowBookResource ? <BookResourceSection token={token} user={user} /> : null}
              {shouldShowMyTickets ? <MyTicketsSection apiBaseUrl={API_BASE_URL} token={token} user={user} /> : null}
              {shouldShowRaiseTicket ? <RaiseTicketPanel apiBaseUrl={API_BASE_URL} token={token} userId={user?.userId || user?.id} /> : null}
              {shouldShowSettingsProfile ? <SettingsProfileSection user={user} /> : null}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function StudentLecturerDashboardSection({
  notifications,
  onOpenBookings,
  onOpenTickets,
  token,
  unreadNotificationCount,
  user,
}) {
  const userId = user?.userId || user?.id || null;
  const [dashboardData, setDashboardData] = useState({
    approvedBookings: [],
    pendingBookings: [],
    tickets: [],
    loading: true,
  });

  useEffect(() => {
    if (!token || !userId) {
      setDashboardData({
        approvedBookings: [],
        pendingBookings: [],
        tickets: [],
        loading: false,
      });
      return undefined;
    }

    const controller = new AbortController();

    async function loadDashboardData() {
      setDashboardData((current) => ({
        ...current,
        loading: true,
      }));

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [approvedResponse, pendingResponse, ticketsResponse] =
          await Promise.allSettled([
            fetch(`${API_BASE_URL}/api/bookings/ViewApprovedBookings`, {
              headers,
              signal: controller.signal,
            }),
            fetch(`${API_BASE_URL}/api/bookings/ViewPendingBookings`, {
              headers,
              signal: controller.signal,
            }),
            fetch(`${API_BASE_URL}/api/tickets?pageNumber=0&pageSize=100`, {
              headers,
              signal: controller.signal,
            }),
          ]);

        const approvedPayload = await readSettledJson(approvedResponse, []);
        const pendingPayload = await readSettledJson(pendingResponse, []);
        const ticketsPayload = await readSettledJson(ticketsResponse, {});

        const approvedBookings = (Array.isArray(approvedPayload)
          ? approvedPayload
          : []
        ).filter((booking) => Number(booking?.user_id) === Number(userId));

        const pendingBookings = (Array.isArray(pendingPayload)
          ? pendingPayload
          : []
        ).filter((booking) => Number(booking?.user_id) === Number(userId));

        const tickets = Array.isArray(ticketsPayload?.content)
          ? ticketsPayload.content
          : [];

        setDashboardData({
          approvedBookings,
          pendingBookings,
          tickets,
          loading: false,
        });
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setDashboardData({
          approvedBookings: [],
          pendingBookings: [],
          tickets: [],
          loading: false,
        });
      }
    }

    loadDashboardData();
    return () => controller.abort();
  }, [token, userId]);

  const todayKey = getLocalDateKey();
  const approvedBookings = useMemo(
    () =>
      [...dashboardData.approvedBookings].sort(
        compareBookingsByDateAndFirstSlot,
      ),
    [dashboardData.approvedBookings],
  );
  const pendingBookings = useMemo(
    () =>
      [...dashboardData.pendingBookings].sort(compareBookingsByDateAndFirstSlot),
    [dashboardData.pendingBookings],
  );
  const tickets = useMemo(
    () =>
      [...dashboardData.tickets].sort(
        (left, right) =>
          new Date(right?.createdAt || 0).getTime() -
          new Date(left?.createdAt || 0).getTime(),
      ),
    [dashboardData.tickets],
  );

  const todayApprovedBookings = approvedBookings.filter(
    (booking) => booking?.date === todayKey,
  );
  const upcomingApprovedBookings = approvedBookings
    .filter((booking) => {
      const bookingDate = parseDashboardDate(booking?.date);
      const todayDate = parseDashboardDate(todayKey);
      return bookingDate && todayDate ? bookingDate >= todayDate : false;
    })
    .slice(0, 3);
  const latestPendingBookings = pendingBookings.slice(0, 3);
  const latestNotifications = notifications.slice(0, 5);
  const ticketCounts = tickets.reduce(
    (summary, ticket) => {
      const status = String(ticket?.status || "").toUpperCase();
      if (status === "OPEN") summary.open += 1;
      if (status === "IN_PROGRESS") summary.inProgress += 1;
      if (status === "RESOLVED") summary.resolved += 1;
      return summary;
    },
    { open: 0, inProgress: 0, resolved: 0 },
  );

  return (
    <div className="academic-dashboard-shell">
      <div className="academic-dashboard-summary-grid">
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Today&apos;s Bookings</span>
          <strong>{todayApprovedBookings.length}</strong>
          <p>Approved bookings scheduled for today.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Pending Requests</span>
          <strong>{pendingBookings.length}</strong>
          <p>Bookings still waiting for approval.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Open Tickets</span>
          <strong>{ticketCounts.open}</strong>
          <p>Support tickets still open on your account.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Unread Alerts</span>
          <strong>{unreadNotificationCount}</strong>
          <p>New notifications not opened in the bell panel yet.</p>
        </article>
      </div>

      {dashboardData.loading ? (
        <div className="availability-feedback availability-feedback-neutral">
          Loading dashboard widgets...
        </div>
      ) : (
        <div className="academic-dashboard-grid">
          <article className="academic-dashboard-widget academic-dashboard-widget-wide">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Upcoming
                </span>
                <h3>Next Approved Bookings</h3>
              </div>
              <button
                className="academic-dashboard-link"
                onClick={onOpenBookings}
                type="button"
              >
                View all bookings
              </button>
            </div>

            {upcomingApprovedBookings.length > 0 ? (
              <div className="academic-dashboard-list">
                {upcomingApprovedBookings.map((booking) => (
                  <article
                    className="academic-dashboard-list-item"
                    key={
                      booking.booking_group_id ||
                      `${booking.resource_name}-${booking.date}`
                    }
                  >
                    <div>
                      <strong>
                        {booking.resource_name ||
                          `Resource #${booking.resource_id ?? "N/A"}`}
                      </strong>
                      <p>{booking.purpose || "No purpose provided"}</p>
                    </div>
                    <div className="academic-dashboard-list-meta">
                      <span>{formatDashboardDate(booking.date)}</span>
                      <small>{formatDashboardSlots(booking.slots)}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No approved bookings are scheduled from today onward.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Alerts
                </span>
                <h3>Latest Notifications</h3>
              </div>
            </div>

            {latestNotifications.length > 0 ? (
              <div className="academic-dashboard-feed">
                {latestNotifications.map((notification) => (
                  <article
                    className="academic-dashboard-feed-item"
                    key={notification.notificationId}
                  >
                    <strong>
                      {notification.notificationType || "Notification"}
                    </strong>
                    <p>{notification.notification || ""}</p>
                    <small>
                      {formatNotificationTime(notification.createdAt)}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No recent notifications to show yet.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Support
                </span>
                <h3>Ticket Snapshot</h3>
              </div>
              <button
                className="academic-dashboard-link"
                onClick={onOpenTickets}
                type="button"
              >
                Open tickets
              </button>
            </div>

            <div className="academic-dashboard-ticket-stats">
              <div>
                <span>Open</span>
                <strong>{ticketCounts.open}</strong>
              </div>
              <div>
                <span>In Progress</span>
                <strong>{ticketCounts.inProgress}</strong>
              </div>
              <div>
                <span>Resolved</span>
                <strong>{ticketCounts.resolved}</strong>
              </div>
            </div>

            {tickets.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {tickets.slice(0, 3).map((ticket) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={ticket.ticketId}
                  >
                    <strong>
                      #{ticket.ticketId} {ticket.category || "General"}
                    </strong>
                    <p>{ticket.description || "No description provided"}</p>
                    <small>{formatTicketStatus(ticket.status)}</small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                You have not raised any tickets yet.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Booking Queue
                </span>
                <h3>Pending Approval</h3>
              </div>
              <button
                className="academic-dashboard-link"
                onClick={onOpenBookings}
                type="button"
              >
                Manage bookings
              </button>
            </div>

            {latestPendingBookings.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {latestPendingBookings.map((booking) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={booking.booking_group_id}
                  >
                    <strong>
                      {booking.resource_name ||
                        `Resource #${booking.resource_id ?? "N/A"}`}
                    </strong>
                    <p>{booking.purpose || "No purpose provided"}</p>
                    <small>
                      {formatDashboardDate(booking.date)} |{" "}
                      {formatDashboardSlots(booking.slots)}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No pending booking requests are waiting right now.
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}

function AdminDashboardSection({ token }) {
  const [dashboardData, setDashboardData] = useState({
    users: [],
    resources: [],
    pendingBookings: [],
    approvedBookings: [],
    tickets: [],
    loading: true,
  });

  useEffect(() => {
    if (!token) {
      setDashboardData({
        users: [],
        resources: [],
        pendingBookings: [],
        approvedBookings: [],
        tickets: [],
        loading: false,
      });
      return undefined;
    }

    const controller = new AbortController();

    async function loadDashboardData() {
      setDashboardData((current) => ({
        ...current,
        loading: true,
      }));

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [
          usersResponse,
          resourcesResponse,
          pendingResponse,
          approvedResponse,
          ticketsResponse,
        ] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/users`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/facilities`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/bookings/ViewPendingBookings`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/bookings/ViewApprovedBookings`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/tickets?pageNumber=0&pageSize=100`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        const users = await readSettledJson(usersResponse, []);
        const resources = await readSettledJson(resourcesResponse, []);
        const pendingBookings = await readSettledJson(pendingResponse, []);
        const approvedBookings = await readSettledJson(approvedResponse, []);
        const ticketsPayload = await readSettledJson(ticketsResponse, {});

        setDashboardData({
          users: Array.isArray(users) ? users : [],
          resources: Array.isArray(resources) ? resources : [],
          pendingBookings: Array.isArray(pendingBookings) ? pendingBookings : [],
          approvedBookings: Array.isArray(approvedBookings)
            ? approvedBookings
            : [],
          tickets: Array.isArray(ticketsPayload?.content)
            ? ticketsPayload.content
            : [],
          loading: false,
        });
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setDashboardData({
          users: [],
          resources: [],
          pendingBookings: [],
          approvedBookings: [],
          tickets: [],
          loading: false,
        });
      }
    }

    loadDashboardData();
    return () => controller.abort();
  }, [token]);

  const activeUsers = dashboardData.users.filter(
    (user) => user?.active !== false,
  );
  const roleCounts = activeUsers.reduce(
    (summary, currentUser) => {
      const role = normalizeRole(currentUser?.roleName);
      if (role === "student") summary.students += 1;
      if (role === "lecturer") summary.lecturers += 1;
      if (role === "technician") summary.technicians += 1;
      if (role === "admin") summary.admins += 1;
      return summary;
    },
    { students: 0, lecturers: 0, technicians: 0, admins: 0 },
  );

  const resourceCounts = dashboardData.resources.reduce(
    (summary, resource) => {
      summary.total += 1;
      if (resolveResourceAvailable(resource)) {
        summary.available += 1;
      } else {
        summary.unavailable += 1;
      }

      const type = String(resource?.type || "Other").trim() || "Other";
      summary.byType[type] = (summary.byType[type] || 0) + 1;
      return summary;
    },
    { total: 0, available: 0, unavailable: 0, byType: {} },
  );

  const ticketCounts = dashboardData.tickets.reduce(
    (summary, ticket) => {
      const status = String(ticket?.status || "").toUpperCase();
      if (status === "OPEN") summary.open += 1;
      if (status === "IN_PROGRESS") summary.inProgress += 1;
      if (status === "RESOLVED") summary.resolved += 1;
      return summary;
    },
    { open: 0, inProgress: 0, resolved: 0 },
  );

  const pendingBookings = [...dashboardData.pendingBookings].sort(
    compareBookingsByCreatedAtAsc,
  );
  const activeTickets = [...dashboardData.tickets]
    .filter((ticket) => {
      const status = String(ticket?.status || "").toUpperCase();
      return status === "OPEN" || status === "IN_PROGRESS";
    })
    .sort(
      (left, right) =>
        new Date(right?.createdAt || 0).getTime() -
        new Date(left?.createdAt || 0).getTime(),
    )
    .slice(0, 3);
  const topResourceTypes = Object.entries(resourceCounts.byType)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const newestUsers = [...activeUsers]
    .sort(
      (left, right) =>
        new Date(right?.createdAt || 0).getTime() -
        new Date(left?.createdAt || 0).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="academic-dashboard-shell">
      <div className="academic-dashboard-summary-grid">
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">
            Pending Bookings
          </span>
          <strong>{dashboardData.pendingBookings.length}</strong>
          <p>Requests waiting for admin approval.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Open Tickets</span>
          <strong>{ticketCounts.open}</strong>
          <p>Support issues that still need assignment or action.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Campus Resources</span>
          <strong>{resourceCounts.total}</strong>
          <p>Tracked resources currently registered in the system.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Active Users</span>
          <strong>{activeUsers.length}</strong>
          <p>Accounts currently active across all user roles.</p>
        </article>
      </div>

      {dashboardData.loading ? (
        <div className="availability-feedback availability-feedback-neutral">
          Loading dashboard widgets...
        </div>
      ) : (
        <div className="academic-dashboard-grid">
          <article className="academic-dashboard-widget academic-dashboard-widget-wide">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Queue
                </span>
                <h3>Pending Booking Approval Queue</h3>
              </div>
            </div>

            {pendingBookings.length > 0 ? (
              <div className="academic-dashboard-list">
                {pendingBookings.slice(0, 4).map((booking) => (
                  <article
                    className="academic-dashboard-list-item"
                    key={booking.booking_group_id}
                  >
                    <div>
                      <strong>
                        {booking.resource_name ||
                          `Resource #${booking.resource_id ?? "N/A"}`}
                      </strong>
                      <p>{booking.purpose || "No purpose provided"}</p>
                    </div>
                    <div className="academic-dashboard-list-meta">
                      <span>{formatDashboardDate(booking.date)}</span>
                      <small>
                        User #{booking.user_id ?? "N/A"} |{" "}
                        {formatDashboardSlots(booking.slots)}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No pending booking approvals are waiting right now.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Operations
                </span>
                <h3>Ticket Operations</h3>
              </div>
            </div>

            <div className="academic-dashboard-ticket-stats">
              <div>
                <span>Open</span>
                <strong>{ticketCounts.open}</strong>
              </div>
              <div>
                <span>In Progress</span>
                <strong>{ticketCounts.inProgress}</strong>
              </div>
              <div>
                <span>Resolved</span>
                <strong>{ticketCounts.resolved}</strong>
              </div>
            </div>

            {activeTickets.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {activeTickets.map((ticket) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={ticket.ticketId}
                  >
                    <strong>
                      #{ticket.ticketId} {ticket.category || "General"}
                    </strong>
                    <p>{ticket.description || "No description provided"}</p>
                    <small>
                      {formatTicketStatus(ticket.status)} |{" "}
                      {ticket.assignedUser?.name || "Unassigned"}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No active tickets need attention right now.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Resources
                </span>
                <h3>Resource Health</h3>
              </div>
            </div>

            <div className="academic-dashboard-ticket-stats">
              <div>
                <span>Available</span>
                <strong>{resourceCounts.available}</strong>
              </div>
              <div>
                <span>Unavailable</span>
                <strong>{resourceCounts.unavailable}</strong>
              </div>
              <div>
                <span>Approved Today</span>
                <strong>
                  {
                    dashboardData.approvedBookings.filter(
                      (booking) => booking?.date === getLocalDateKey(),
                    ).length
                  }
                </strong>
              </div>
            </div>

            {topResourceTypes.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {topResourceTypes.map(([type, count]) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={type}
                  >
                    <strong>{type}</strong>
                    <p>{count} resource(s) registered in this type.</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                Resource distribution will appear here once resources are available.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Users
                </span>
                <h3>User Overview</h3>
              </div>
            </div>

            <div className="academic-dashboard-ticket-stats">
              <div>
                <span>Students</span>
                <strong>{roleCounts.students}</strong>
              </div>
              <div>
                <span>Lecturers</span>
                <strong>{roleCounts.lecturers}</strong>
              </div>
              <div>
                <span>Technicians</span>
                <strong>{roleCounts.technicians}</strong>
              </div>
            </div>

            {newestUsers.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {newestUsers.map((currentUser) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={currentUser.userId}
                  >
                    <strong>{currentUser.name || currentUser.email}</strong>
                    <p>{currentUser.email || "No email provided"}</p>
                    <small>
                      {currentUser.roleName || "User"} |{" "}
                      {formatDashboardDate(
                        currentUser.createdAt
                          ? String(currentUser.createdAt).slice(0, 10)
                          : "",
                      )}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                User activity data will appear here once accounts are available.
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}

function TechnicianDashboardSection({
  notifications,
  onOpenResources,
  onOpenTickets,
  token,
  unreadNotificationCount,
}) {
  const [dashboardData, setDashboardData] = useState({
    resources: [],
    tickets: [],
    loading: true,
  });

  useEffect(() => {
    if (!token) {
      setDashboardData({
        resources: [],
        tickets: [],
        loading: false,
      });
      return undefined;
    }

    const controller = new AbortController();

    async function loadDashboardData() {
      setDashboardData((current) => ({
        ...current,
        loading: true,
      }));

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [resourcesResponse, ticketsResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/facilities`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/tickets?pageNumber=0&pageSize=100`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        const resources = await readSettledJson(resourcesResponse, []);
        const ticketsPayload = await readSettledJson(ticketsResponse, {});

        setDashboardData({
          resources: Array.isArray(resources) ? resources : [],
          tickets: Array.isArray(ticketsPayload?.content)
            ? ticketsPayload.content
            : [],
          loading: false,
        });
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setDashboardData({
          resources: [],
          tickets: [],
          loading: false,
        });
      }
    }

    loadDashboardData();
    return () => controller.abort();
  }, [token]);

  const tickets = [...dashboardData.tickets].sort(
    (left, right) =>
      new Date(right?.createdAt || 0).getTime() -
      new Date(left?.createdAt || 0).getTime(),
  );
  const ticketCounts = tickets.reduce(
    (summary, ticket) => {
      const status = String(ticket?.status || "").toUpperCase();
      if (status === "OPEN") summary.open += 1;
      if (status === "IN_PROGRESS") summary.inProgress += 1;
      if (status === "RESOLVED") summary.resolved += 1;
      if (status === "REJECTED") summary.rejected += 1;
      return summary;
    },
    { open: 0, inProgress: 0, resolved: 0, rejected: 0 },
  );

  const activeTickets = tickets.filter((ticket) => {
    const status = String(ticket?.status || "").toUpperCase();
    return status === "OPEN" || status === "IN_PROGRESS";
  });
  const latestResolvedTickets = tickets
    .filter(
      (ticket) => String(ticket?.status || "").toUpperCase() === "RESOLVED",
    )
    .slice(0, 3);

  const resourceCounts = dashboardData.resources.reduce(
    (summary, resource) => {
      summary.total += 1;
      if (resolveResourceAvailable(resource)) {
        summary.available += 1;
      } else {
        summary.unavailable += 1;
      }

      const type = String(resource?.type || "Other").trim() || "Other";
      summary.byType[type] = (summary.byType[type] || 0) + 1;
      return summary;
    },
    { total: 0, available: 0, unavailable: 0, byType: {} },
  );

  const topResourceTypes = Object.entries(resourceCounts.byType)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const latestNotifications = notifications.slice(0, 5);

  return (
    <div className="academic-dashboard-shell">
      <div className="academic-dashboard-summary-grid">
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">
            Assigned Active Tickets
          </span>
          <strong>{activeTickets.length}</strong>
          <p>Tickets currently waiting for your action or progress update.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Resolved Tickets</span>
          <strong>{ticketCounts.resolved}</strong>
          <p>Tickets you can move toward closure after resolution.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">
            Available Resources
          </span>
          <strong>{resourceCounts.available}</strong>
          <p>Campus resources currently marked available in the system.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Unread Alerts</span>
          <strong>{unreadNotificationCount}</strong>
          <p>New ticket-related notifications not opened yet.</p>
        </article>
      </div>

      {dashboardData.loading ? (
        <div className="availability-feedback availability-feedback-neutral">
          Loading dashboard widgets...
        </div>
      ) : (
        <div className="academic-dashboard-grid">
          <article className="academic-dashboard-widget academic-dashboard-widget-wide">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Work Queue
                </span>
                <h3>Your Active Ticket Queue</h3>
              </div>
              <button
                className="academic-dashboard-link"
                onClick={onOpenTickets}
                type="button"
              >
                Open tickets
              </button>
            </div>

            {activeTickets.length > 0 ? (
              <div className="academic-dashboard-list">
                {activeTickets.slice(0, 4).map((ticket) => (
                  <article
                    className="academic-dashboard-list-item"
                    key={ticket.ticketId}
                  >
                    <div>
                      <strong>
                        #{ticket.ticketId} {ticket.category || "General"}
                      </strong>
                      <p>{ticket.description || "No description provided"}</p>
                    </div>
                    <div className="academic-dashboard-list-meta">
                      <span>{formatTicketStatus(ticket.status)}</span>
                      <small>
                        {ticket.resource?.name || "Unknown resource"} |{" "}
                        {ticket.priority || "Unknown priority"}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No active assigned tickets are waiting right now.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Alerts
                </span>
                <h3>Latest Notifications</h3>
              </div>
            </div>

            {latestNotifications.length > 0 ? (
              <div className="academic-dashboard-feed">
                {latestNotifications.map((notification) => (
                  <article
                    className="academic-dashboard-feed-item"
                    key={notification.notificationId}
                  >
                    <strong>
                      {notification.notificationType || "Notification"}
                    </strong>
                    <p>{notification.notification || ""}</p>
                    <small>
                      {formatNotificationTime(notification.createdAt)}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No recent technician alerts to show yet.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Status
                </span>
                <h3>Ticket Snapshot</h3>
              </div>
            </div>

            <div className="academic-dashboard-ticket-stats">
              <div>
                <span>Open</span>
                <strong>{ticketCounts.open}</strong>
              </div>
              <div>
                <span>In Progress</span>
                <strong>{ticketCounts.inProgress}</strong>
              </div>
              <div>
                <span>Resolved</span>
                <strong>{ticketCounts.resolved}</strong>
              </div>
            </div>

            {latestResolvedTickets.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {latestResolvedTickets.map((ticket) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={ticket.ticketId}
                  >
                    <strong>
                      #{ticket.ticketId} {ticket.category || "General"}
                    </strong>
                    <p>{ticket.description || "No description provided"}</p>
                    <small>
                      Resolved |{" "}
                      {ticket.resource?.name || "Unknown resource"}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                No resolved tickets are listed yet.
              </div>
            )}
          </article>

          <article className="academic-dashboard-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Resources
                </span>
                <h3>Resource Overview</h3>
              </div>
              <button
                className="academic-dashboard-link"
                onClick={onOpenResources}
                type="button"
              >
                Browse resources
              </button>
            </div>

            <div className="academic-dashboard-ticket-stats">
              <div>
                <span>Total</span>
                <strong>{resourceCounts.total}</strong>
              </div>
              <div>
                <span>Available</span>
                <strong>{resourceCounts.available}</strong>
              </div>
              <div>
                <span>Unavailable</span>
                <strong>{resourceCounts.unavailable}</strong>
              </div>
            </div>

            {topResourceTypes.length > 0 ? (
              <div className="academic-dashboard-mini-list">
                {topResourceTypes.map(([type, count]) => (
                  <article
                    className="academic-dashboard-mini-item"
                    key={type}
                  >
                    <strong>{type}</strong>
                    <p>{count} resource(s) currently tracked.</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="academic-dashboard-empty">
                Resource data will appear here once resources are available.
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}

function AdminAnalyticsSection({ token }) {
  const [analyticsData, setAnalyticsData] = useState({
    resources: [],
    bookings: [],
    tickets: [],
    loading: true,
  });
  const [timeWindow, setTimeWindow] = useState("30");
  const [bookingDateMode, setBookingDateMode] = useState("booking-date");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");

  useEffect(() => {
    if (!token) {
      setAnalyticsData({
        resources: [],
        bookings: [],
        tickets: [],
        loading: false,
      });
      return undefined;
    }

    const controller = new AbortController();

    async function loadAnalyticsData() {
      setAnalyticsData((current) => ({
        ...current,
        loading: true,
      }));

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [
          resourcesResponse,
          pendingResponse,
          approvedResponse,
          rejectedResponse,
          cancelledResponse,
          ticketsResponse,
        ] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/facilities`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/bookings/ViewPendingBookings`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/bookings/ViewApprovedBookings`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/bookings/ViewRejectedBookings`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/bookings/ViewCancelledBookings`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/tickets?pageNumber=0&pageSize=100`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        const resources = await readSettledJson(resourcesResponse, []);
        const pendingBookings = await readSettledJson(pendingResponse, []);
        const approvedBookings = await readSettledJson(approvedResponse, []);
        const rejectedBookings = await readSettledJson(rejectedResponse, []);
        const cancelledBookings = await readSettledJson(cancelledResponse, []);
        const ticketsPayload = await readSettledJson(ticketsResponse, {});

        setAnalyticsData({
          resources: Array.isArray(resources) ? resources : [],
          bookings: [
            ...mergeBookingsWithStatus(pendingBookings, "Pending"),
            ...mergeBookingsWithStatus(approvedBookings, "Approved"),
            ...mergeBookingsWithStatus(rejectedBookings, "Rejected"),
            ...mergeBookingsWithStatus(cancelledBookings, "Cancelled"),
          ],
          tickets: Array.isArray(ticketsPayload?.content)
            ? ticketsPayload.content
            : [],
          loading: false,
        });
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setAnalyticsData({
          resources: [],
          bookings: [],
          tickets: [],
          loading: false,
        });
      }
    }

    loadAnalyticsData();
    return () => controller.abort();
  }, [token]);

  const resourceTypes = useMemo(
    () =>
      [
        ...new Set(
          analyticsData.resources
            .map((resource) => String(resource?.type || "").trim())
            .filter(Boolean),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [analyticsData.resources],
  );

  const resourceTypeByName = useMemo(
    () =>
      new Map(
        analyticsData.resources.map((resource) => [
          normalizeLookup(resource?.name),
          String(resource?.type || "").trim(),
        ]),
      ),
    [analyticsData.resources],
  );

  const filteredResources = analyticsData.resources.filter((resource) => {
    if (resourceTypeFilter === "all") return true;
    return normalizeLookup(resource?.type) === normalizeLookup(resourceTypeFilter);
  });

  const filteredBookings = analyticsData.bookings.filter((booking) => {
    if (
      resourceTypeFilter !== "all" &&
      normalizeLookup(
        resourceTypeByName.get(normalizeLookup(booking?.resource_name)) || "",
      ) !== normalizeLookup(resourceTypeFilter)
    ) {
      return false;
    }

    const dateValue =
      bookingDateMode === "request-date" ? booking?.created_at : booking?.date;
    return isWithinTimeWindow(dateValue, timeWindow, bookingDateMode === "booking-date");
  });

  const filteredTickets = analyticsData.tickets.filter((ticket) => {
    if (
      resourceTypeFilter !== "all" &&
      normalizeLookup(ticket?.resource?.type) !== normalizeLookup(resourceTypeFilter)
    ) {
      return false;
    }

    return isWithinTimeWindow(ticket?.createdAt, timeWindow, false);
  });

  const bookingStatusData = [
    {
      label: "Pending",
      value: filteredBookings.filter(
        (booking) => normalizeLookup(booking.analyticsStatus) === "pending",
      ).length,
      color: "#4f46e5",
    },
    {
      label: "Approved",
      value: filteredBookings.filter(
        (booking) => normalizeLookup(booking.analyticsStatus) === "approved",
      ).length,
      color: "#0f766e",
    },
    {
      label: "Rejected",
      value: filteredBookings.filter(
        (booking) => normalizeLookup(booking.analyticsStatus) === "rejected",
      ).length,
      color: "#ef4444",
    },
    {
      label: "Cancelled",
      value: filteredBookings.filter(
        (booking) => normalizeLookup(booking.analyticsStatus) === "cancelled",
      ).length,
      color: "#f97316",
    },
  ];

  const peakHourData = Array.from({ length: 12 }, (_, index) => {
    const slot = index + 8;
    const value = filteredBookings.reduce((total, booking) => {
      const slots = Array.isArray(booking?.slots) ? booking.slots : [];
      return total + slots.filter((currentSlot) => Number(currentSlot) === slot).length;
    }, 0);

    return {
      label: `${slot}:00`,
      value,
      color: "#2563eb",
    };
  });

  const topResourcesData = Object.entries(
    filteredBookings.reduce((summary, booking) => {
      const key =
        booking?.resource_name ||
        `Resource #${booking?.resource_id ?? booking?.booking_group_id ?? "N/A"}`;
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, value]) => ({
      label,
      value,
      color: "#7c3aed",
    }));

  const weekdayBookingData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (label, index) => ({
      label,
      value: filteredBookings.filter((booking) => {
        const targetDate =
          bookingDateMode === "request-date" ? booking?.created_at : booking?.date;
        const parsed = parseAnalyticsDate(targetDate, bookingDateMode === "booking-date");
        return parsed ? parsed.getDay() === index : false;
      }).length,
      color: "#14b8a6",
    }),
  );

  const ticketStatusData = [
    { label: "Open", value: 0, color: "#ef4444" },
    { label: "In Progress", value: 0, color: "#f97316" },
    { label: "Resolved", value: 0, color: "#22c55e" },
    { label: "Rejected", value: 0, color: "#64748b" },
    { label: "Closed", value: 0, color: "#2563eb" },
  ].map((item) => ({
    ...item,
    value: filteredTickets.filter(
      (ticket) => normalizeLookup(ticket?.status) === normalizeLookup(item.label),
    ).length,
  }));

  const ticketPriorityData = [
    { label: "High", value: 0, color: "#ef4444" },
    { label: "Medium", value: 0, color: "#f59e0b" },
    { label: "Low", value: 0, color: "#22c55e" },
  ].map((item) => ({
    ...item,
    value: filteredTickets.filter(
      (ticket) => normalizeLookup(ticket?.priority) === normalizeLookup(item.label),
    ).length,
  }));

  const resourceAvailabilityData = Object.entries(
    filteredResources.reduce((summary, resource) => {
      const type = String(resource?.type || "Other").trim() || "Other";
      if (!summary[type]) {
        summary[type] = { available: 0, unavailable: 0 };
      }

      if (resolveResourceAvailable(resource)) {
        summary[type].available += 1;
      } else {
        summary[type].unavailable += 1;
      }
      return summary;
    }, {}),
  ).map(([label, value]) => ({
    label,
    available: value.available,
    unavailable: value.unavailable,
    total: value.available + value.unavailable,
  }));

  const totalBookings = filteredBookings.length;
  const approvedBookings = bookingStatusData.find(
    (item) => item.label === "Approved",
  )?.value || 0;
  const approvalRate = totalBookings
    ? Math.round((approvedBookings / totalBookings) * 100)
    : 0;
  const totalTickets = filteredTickets.length;
  const openTickets = ticketStatusData.find((item) => item.label === "Open")?.value || 0;
  const totalResources = filteredResources.length;
  const availableResources = filteredResources.filter(resolveResourceAvailable).length;
  const availabilityRate = totalResources
    ? Math.round((availableResources / totalResources) * 100)
    : 0;

  const reportSummary = {
    generatedAt: new Date().toISOString(),
    filters: {
      timeWindow,
      bookingDateMode,
      resourceTypeFilter,
    },
    summary: {
      totalBookings,
      approvalRate,
      totalTickets,
      openTickets,
      totalResources,
      availabilityRate,
    },
    bookingStatusData,
    peakHourData,
    topResourcesData,
    weekdayBookingData,
    ticketStatusData,
    ticketPriorityData,
    resourceAvailabilityData,
  };

  return (
    <div className="analytics-shell">
      <div className="analytics-toolbar">
        <div className="analytics-toolbar-copy">
          <h2>Operations Analytics</h2>
          <p>
            Track booking demand, resource patterns, and ticket activity using
            current campus data.
          </p>
        </div>

        <div className="analytics-toolbar-actions">
          <label className="analytics-control">
            <span>Window</span>
            <select
              onChange={(event) => setTimeWindow(event.target.value)}
              value={timeWindow}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>

          <label className="analytics-control">
            <span>Bookings By</span>
            <select
              onChange={(event) => setBookingDateMode(event.target.value)}
              value={bookingDateMode}
            >
              <option value="booking-date">Booking date</option>
              <option value="request-date">Request created date</option>
            </select>
          </label>

          <label className="analytics-control">
            <span>Resource Type</span>
            <select
              onChange={(event) => setResourceTypeFilter(event.target.value)}
              value={resourceTypeFilter}
            >
              <option value="all">All types</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <button
            className="analytics-export-button"
            onClick={() =>
              downloadReportFile(
                `admin-analytics-${timeWindow}.csv`,
                buildAnalyticsCsv(reportSummary),
                "text/csv;charset=utf-8",
              )
            }
            type="button"
          >
            Download CSV
          </button>
          <button
            className="analytics-export-button analytics-export-button-secondary"
            onClick={() =>
              downloadReportFile(
                `admin-analytics-${timeWindow}.json`,
                JSON.stringify(reportSummary, null, 2),
                "application/json;charset=utf-8",
              )
            }
            type="button"
          >
            Download JSON
          </button>
        </div>
      </div>

      <div className="academic-dashboard-summary-grid">
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Bookings</span>
          <strong>{totalBookings}</strong>
          <p>{approvalRate}% approval rate in the current view.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Tickets</span>
          <strong>{totalTickets}</strong>
          <p>{openTickets} still open in the selected time window.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Resources</span>
          <strong>{totalResources}</strong>
          <p>{availabilityRate}% currently marked available.</p>
        </article>
        <article className="academic-dashboard-stat-card">
          <span className="academic-dashboard-stat-label">Top Resource</span>
          <strong>{topResourcesData[0]?.label || "N/A"}</strong>
          <p>
            {topResourcesData[0]?.value || 0} booking(s) in the selected view.
          </p>
        </article>
      </div>

      {analyticsData.loading ? (
        <div className="availability-feedback availability-feedback-neutral">
          Loading analytics...
        </div>
      ) : (
        <div className="analytics-stack">
          <article className="academic-dashboard-widget analytics-feature-widget">
            <div className="academic-dashboard-widget-head">
              <div>
                <span className="academic-dashboard-widget-eyebrow">
                  Bookings
                </span>
                <h3>Bookings by Status</h3>
              </div>
            </div>
            <VerticalBarChart
              data={bookingStatusData}
              emptyLabel="No booking status data in the current filter."
            />
          </article>

          <div className="analytics-columns">
            <div className="analytics-column">
              <article className="academic-dashboard-widget">
                <div className="academic-dashboard-widget-head">
                  <div>
                    <span className="academic-dashboard-widget-eyebrow">
                      Demand
                    </span>
                    <h3>Peak Booking Hours</h3>
                  </div>
                </div>
                <HorizontalBarChart
                  data={peakHourData.filter((item) => item.value > 0)}
                  emptyLabel="No booking slot activity found in the current view."
                />
              </article>

              <article className="academic-dashboard-widget">
                <div className="academic-dashboard-widget-head">
                  <div>
                    <span className="academic-dashboard-widget-eyebrow">
                      Tickets
                    </span>
                    <h3>Status Distribution</h3>
                  </div>
                </div>
                <DonutChart
                  data={ticketStatusData}
                  emptyLabel="No ticket status data in the current view."
                />
              </article>
            </div>

            <div className="analytics-column">
              <article className="academic-dashboard-widget">
                <div className="academic-dashboard-widget-head">
                  <div>
                    <span className="academic-dashboard-widget-eyebrow">
                      Resources
                    </span>
                    <h3>Top Booked Resources</h3>
                  </div>
                </div>
                <HorizontalBarChart
                  data={topResourcesData}
                  emptyLabel="No resource booking activity found in the current view."
                />
              </article>

              <article className="academic-dashboard-widget">
                <div className="academic-dashboard-widget-head">
                  <div>
                    <span className="academic-dashboard-widget-eyebrow">
                      Availability
                    </span>
                    <h3>Resource Availability by Type</h3>
                  </div>
                </div>
                <ResourceAvailabilityChart
                  data={resourceAvailabilityData}
                  emptyLabel="No resource availability breakdown is available."
                />
              </article>
            </div>

            <div className="analytics-column">
              <article className="academic-dashboard-widget">
                <div className="academic-dashboard-widget-head">
                  <div>
                    <span className="academic-dashboard-widget-eyebrow">
                      Trends
                    </span>
                    <h3>Bookings by Weekday</h3>
                  </div>
                </div>
                <VerticalBarChart
                  data={weekdayBookingData}
                  emptyLabel="No weekday booking trend data available."
                />
              </article>

              <article className="academic-dashboard-widget">
                <div className="academic-dashboard-widget-head">
                  <div>
                    <span className="academic-dashboard-widget-eyebrow">
                      Priority
                    </span>
                    <h3>Ticket Priority Mix</h3>
                  </div>
                </div>
                <DonutChart
                  data={ticketPriorityData}
                  emptyLabel="No ticket priority data in the current view."
                />
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VerticalBarChart({ data, emptyLabel }) {
  const chartData = data.filter((item) => item.value > 0);
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  if (chartData.length === 0) {
    return <div className="academic-dashboard-empty">{emptyLabel}</div>;
  }

  return (
    <div className="analytics-vertical-chart">
      <div className="analytics-vertical-bars">
        {chartData.map((item) => (
          <div className="analytics-vertical-bar-col" key={item.label}>
            <span className="analytics-vertical-bar-value">{item.value}</span>
            <div className="analytics-vertical-bar-track">
              <div
                className="analytics-vertical-bar-fill"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  background: `linear-gradient(180deg, ${item.color}, ${item.color}aa)`,
                }}
              />
            </div>
            <span className="analytics-vertical-bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, emptyLabel }) {
  const chartData = data.filter((item) => item.value > 0);
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  if (chartData.length === 0) {
    return <div className="academic-dashboard-empty">{emptyLabel}</div>;
  }

  return (
    <div className="analytics-horizontal-list">
      {chartData.map((item) => (
        <div className="analytics-horizontal-row" key={item.label}>
          <div className="analytics-horizontal-copy">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
          <div className="analytics-horizontal-track">
            <div
              className="analytics-horizontal-fill"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                background: `linear-gradient(90deg, ${item.color}, ${item.color}bb)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, emptyLabel }) {
  const chartData = data.filter((item) => item.value > 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0 || total === 0) {
    return <div className="academic-dashboard-empty">{emptyLabel}</div>;
  }

  let cursor = 0;
  const segments = chartData
    .map((item) => {
      const start = cursor;
      const end = cursor + (item.value / total) * 100;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="analytics-donut-layout">
      <div
        className="analytics-donut-ring"
        style={{
          background: `conic-gradient(${segments})`,
        }}
      >
        <div className="analytics-donut-center">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className="analytics-donut-legend">
        {chartData.map((item) => (
          <div className="analytics-donut-legend-item" key={item.label}>
            <span
              className="analytics-donut-legend-dot"
              style={{ background: item.color }}
            />
            <div>
              <strong>{item.label}</strong>
              <small>
                {item.value} | {Math.round((item.value / total) * 100)}%
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceAvailabilityChart({ data, emptyLabel }) {
  const chartData = data.filter((item) => item.total > 0);
  const maxValue = Math.max(...chartData.map((item) => item.total), 1);

  if (chartData.length === 0) {
    return <div className="academic-dashboard-empty">{emptyLabel}</div>;
  }

  return (
    <div className="analytics-resource-grid">
      {chartData.map((item) => (
        <article className="analytics-resource-card" key={item.label}>
          <div className="analytics-resource-head">
            <strong>{item.label}</strong>
            <span>{item.total} total</span>
          </div>
          <div className="analytics-resource-stack">
            <div
              className="analytics-resource-stack-available"
              style={{
                width: `${(item.available / maxValue) * 100}%`,
              }}
            />
            <div
              className="analytics-resource-stack-unavailable"
              style={{
                width: `${(item.unavailable / maxValue) * 100}%`,
              }}
            />
          </div>
          <div className="analytics-resource-meta">
            <small>Available: {item.available}</small>
            <small>Unavailable: {item.unavailable}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

async function readSettledJson(result, fallbackValue) {
  if (result?.status !== "fulfilled") {
    return fallbackValue;
  }

  const response = result.value;
  const payload = await response.json().catch(() => fallbackValue);
  return response.ok ? payload : fallbackValue;
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
  const bookingUserId = user?.userId || user?.id;

  const activePanel = {
      approved: (
        <ApprovedBookingsPanel
          apiBaseUrl={API_BASE_URL}
          token={token}
          userId={bookingUserId}
        />
      ),
      pending: (
        <PendingBookingsPanel
          apiBaseUrl={API_BASE_URL}
          token={token}
          userId={bookingUserId}
        />
      ),
      rejected: (
        <RejectedBookingsPanelView
          apiBaseUrl={API_BASE_URL}
          token={token}
          userId={bookingUserId}
        />
      ),
      cancelled: (
        <CancelledBookingsPanelView
          apiBaseUrl={API_BASE_URL}
          token={token}
          userId={bookingUserId}
        />
      ),
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
            <strong>{user?.userId ?? user?.id ?? "N/A"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookResourceSection({ token, user }) {
    const [activeTab, setActiveTab] = useState("type");
    const bookingUserId = user?.userId || user?.id;
    const activePanel =
      activeTab === "type" ? (
        <BookByTypePanel
          apiBaseUrl={API_BASE_URL}
          roleName={user?.roleName}
          token={token}
          userId={bookingUserId}
        />
      ) : (
        <BookByNamePanel
          apiBaseUrl={API_BASE_URL}
          token={token}
          userId={bookingUserId}
          roleName={user?.roleName}
        />
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

function MyTicketsSection({ apiBaseUrl, token, user }) {
  const isAdmin = user?.roleName?.toLowerCase() === "admin";
  const [activeTab, setActiveTab] = useState("open");
  
  const tabs = [
    { key: "open", label: "Open" },
    { key: "in-progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
    { key: "rejected", label: "Rejected" },
    { key: "closed", label: "Closed" },
  ];

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

      <div className="book-resource-tab-panel" role="tabpanel" aria-live="polite">
        <TicketManagementPanel 
          statusFilter={activeTab} 
          apiBaseUrl={apiBaseUrl}
          token={token}
          user={user}
        />
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

function getResourceMark(type) {
  const normalized = (type || "R").trim();
  if (!normalized) return "R";

  return normalized
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDashboardDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getBookingFirstSlot(booking) {
  if (!Array.isArray(booking?.slots) || booking.slots.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const values = booking.slots
    .map((slot) => Number(slot))
    .filter((slot) => Number.isFinite(slot))
    .sort((left, right) => left - right);

  return values[0] ?? Number.POSITIVE_INFINITY;
}

function compareBookingsByDateAndFirstSlot(left, right) {
  const leftDate = parseDashboardDate(left?.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightDate =
    parseDashboardDate(right?.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  return getBookingFirstSlot(left) - getBookingFirstSlot(right);
}

function compareBookingsByCreatedAtAsc(left, right) {
  return (
    new Date(left?.created_at || 0).getTime() -
    new Date(right?.created_at || 0).getTime()
  );
}

function formatDashboardDate(value) {
  if (!value) return "No date selected";

  const parsed = parseDashboardDate(value);
  if (!parsed) return value;

  return parsed.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDashboardSlots(values) {
  if (!Array.isArray(values) || values.length === 0) return "Slots not listed";

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right)
    .map((value) => `${value}:00-${value + 1}:00`)
    .join(", ");
}

function formatTicketStatus(value) {
  return String(value || "Unknown")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveResourceAvailable(resource) {
  const rawAvailability = resource?.available ?? resource?.availability;
  if (rawAvailability === true || rawAvailability === false) {
    return rawAvailability;
  }

  return (
    rawAvailability === 1 ||
    rawAvailability === "1" ||
    rawAvailability === "true"
  );
}

function mergeBookingsWithStatus(values, status) {
  if (!Array.isArray(values)) return [];
  return values.map((item) => ({
    ...item,
    analyticsStatus: status,
  }));
}

function normalizeLookup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function parseAnalyticsDate(value, isDateOnly = false) {
  if (!value) return null;

  const parsed = isDateOnly
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`)
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinTimeWindow(value, windowValue, isDateOnly = false) {
  if (windowValue === "all") return true;

  const parsed = parseAnalyticsDate(value, isDateOnly);
  if (!parsed) return false;

  const days = Number(windowValue);
  if (!Number.isFinite(days) || days <= 0) return true;

  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));

  return parsed >= threshold;
}

function buildAnalyticsCsv(report) {
  const lines = [
    ["Generated At", report.generatedAt],
    ["Window", report.filters.timeWindow],
    ["Bookings By", report.filters.bookingDateMode],
    ["Resource Type", report.filters.resourceTypeFilter],
    [],
    ["Summary"],
    ["Metric", "Value"],
    ["Total Bookings", report.summary.totalBookings],
    ["Approval Rate", `${report.summary.approvalRate}%`],
    ["Total Tickets", report.summary.totalTickets],
    ["Open Tickets", report.summary.openTickets],
    ["Total Resources", report.summary.totalResources],
    ["Availability Rate", `${report.summary.availabilityRate}%`],
    [],
    ["Bookings By Status"],
    ["Label", "Value"],
    ...report.bookingStatusData.map((item) => [item.label, item.value]),
    [],
    ["Peak Booking Hours"],
    ["Hour", "Bookings"],
    ...report.peakHourData.map((item) => [item.label, item.value]),
    [],
    ["Top Resources"],
    ["Resource", "Bookings"],
    ...report.topResourcesData.map((item) => [item.label, item.value]),
    [],
    ["Bookings By Weekday"],
    ["Weekday", "Bookings"],
    ...report.weekdayBookingData.map((item) => [item.label, item.value]),
    [],
    ["Ticket Status"],
    ["Status", "Tickets"],
    ...report.ticketStatusData.map((item) => [item.label, item.value]),
    [],
    ["Ticket Priority"],
    ["Priority", "Tickets"],
    ...report.ticketPriorityData.map((item) => [item.label, item.value]),
    [],
    ["Resource Availability By Type"],
    ["Type", "Available", "Unavailable", "Total"],
    ...report.resourceAvailabilityData.map((item) => [
      item.label,
      item.available,
      item.unavailable,
      item.total,
    ]),
  ];

  return lines
    .map((row) =>
      row
        .map((value) => {
          const cell = String(value ?? "");
          return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
        })
        .join(","),
    )
    .join("\n");
}

function downloadReportFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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
