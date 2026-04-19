import { useState } from "react";

const USER_TYPE_OPTIONS = [
  "Student",
  "Lecturer",
  "Instructor",
  "Technician",
];

const USER_TYPE_META = {
  Student: {
    badge: "ST",
    title: "Student profile",
    description: "Access study resources, personal bookings, and day-to-day campus services.",
  },
  Lecturer: {
    badge: "LE",
    title: "Lecturer profile",
    description: "Set up academic access for teaching, schedules, and classroom coordination.",
  },
  Instructor: {
    badge: "IN",
    title: "Instructor profile",
    description: "Prepare a teaching account for labs, support sessions, and practical activities.",
  },
  Technician: {
    badge: "TE",
    title: "Technician profile",
    description: "Enable technical operations access for resources, support, and facility handling.",
  },
};

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

export default function RegisterUser({
  apiBaseUrl,
  onRegisterSuccess,
  onShowLogin,
  onThemeToggle,
  theme,
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    userType: USER_TYPE_OPTIONS[0],
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedUserTypeMeta =
    USER_TYPE_META[form.userType] ?? USER_TYPE_META[USER_TYPE_OPTIONS[0]];

  const setField = (key, value) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      roleName: form.userType,
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.name || !payload.username || !payload.email || !payload.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (payload.roleName === "Admin") {
      setError("Admin users cannot be created from this form.");
      return;
    }

    if (payload.phone && !/^\d{10}$/.test(payload.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (!isStrongPassword(payload.password)) {
      setError(
        "Password must be 8-100 chars and include uppercase, lowercase, and a number.",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setLoading(true);

    try {
      const registerResponse = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const registerPayload = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) throw new Error(getMessage(registerPayload));

      setNotice("Registration successful. Signing you in...");

      const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      });

      const loginPayload = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) throw new Error(getMessage(loginPayload));

      onRegisterSuccess(loginPayload);
    } catch (requestError) {
      setNotice("");
      setError(requestError.message || "Registration failed.");
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
              <h1>Register user</h1>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <label className="field">
                <span>Name</span>
                <input
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Enter full name"
                  required
                  type="text"
                  value={form.name}
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) =>
                    setField("phone", event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0771234567"
                  type="text"
                  value={form.phone}
                />
              </label>

              <label className="field">
                <span>Address</span>
                <input
                  onChange={(event) => setField("address", event.target.value)}
                  placeholder="Enter address"
                  type="text"
                  value={form.address}
                />
              </label>

              <label
                className="field field-user-type"
                data-user-type={form.userType.toLowerCase()}
              >
                <span>User Type</span>
                <div className="user-type-card">
                  <div className="user-type-badge" aria-hidden="true">
                    {selectedUserTypeMeta.badge}
                  </div>

                  <div className="user-type-copy">
                    <strong>{selectedUserTypeMeta.title}</strong>
                    <small>{selectedUserTypeMeta.description}</small>
                  </div>

                  <div className="user-type-select-wrap">
                    <select
                      className="user-type-select"
                      onChange={(event) => setField("userType", event.target.value)}
                      value={form.userType}
                    >
                      {USER_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="user-type-select-arrow" aria-hidden="true">
                      ▼
                    </span>
                  </div>
                </div>
              </label>

              <label className="field">
                <span>Username</span>
                <input
                  autoComplete="username"
                  onChange={(event) => setField("username", event.target.value)}
                  placeholder="Enter username"
                  required
                  type="text"
                  value={form.username}
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  autoComplete="email"
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={form.email}
                />
              </label>

              <label className="field">
                <span>Password</span>
                <div className="password-wrap">
                  <input
                    autoComplete="new-password"
                    onChange={(event) => setField("password", event.target.value)}
                    placeholder="Create a password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                  />
                  <button
                    className="icon-button"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Confirm Password</span>
                <div className="password-wrap">
                  <input
                    autoComplete="new-password"
                    onChange={(event) =>
                      setField("confirmPassword", event.target.value)
                    }
                    placeholder="Confirm password"
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                  />
                  <button
                    className="icon-button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    type="button"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="field-action-row">
                  <button
                    className="text-button field-link"
                    onClick={onShowLogin}
                    type="button"
                  >
                    Already have an account? Login
                  </button>
                </div>
              </label>

              {error ? <p className="form-error">{error}</p> : null}
              {notice ? <p className="form-success">{notice}</p> : null}

              <button
                className="primary-button"
                disabled={loading}
                type="submit"
              >
                {loading ? "Creating user..." : "Register"}
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

function ThemeToggle({ onClick, theme }) {
  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
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
