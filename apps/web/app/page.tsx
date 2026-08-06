"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type ApiResult = {
  message?: string;
  user?: Record<string, unknown> | null;
  session?: Record<string, unknown> | null;
  sessionId?: string;
  sessions?: unknown[];
  [key: string]: unknown;
};

const API_BASE = process.env.NEXT_PUBLIC_IDENTITY_SERVICE_URL ?? "http://localhost:4000/api";

async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload;
}

async function getJson(path: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload;
}

const emptyRegisterForm = {
  name: "",
  email: "",
  password: "",
  conformPassword: "",
};

const emptyLoginForm = {
  email: "",
  password: "",
};

export default function Home() {
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState<"register" | "login" | "verify" | "me" | "logout" | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState("");

  const prettyResult = useMemo(() => {
    if (!result) {
      return "No response yet";
    }

    return JSON.stringify(result, null, 2);
  }, [result]);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("register");
    setError("");

    try {
      const payload = await postJson("/auth/register", registerForm);
      setResult(payload);
      const returnedUser = payload.user as { id?: string } | undefined;
      if (returnedUser?.id) {
        setUserId(returnedUser.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("verify");
    setError("");

    try {
      const payload = await postJson("/auth/verify-otp", {
        userId,
        otp,
      });
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("login");
    setError("");

    try {
      const payload = await postJson("/auth/login", loginForm);
      setResult(payload);
      const returnedUser = payload.user as { id?: string } | undefined;
      if (returnedUser?.id) {
        setUserId(returnedUser.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleMe() {
    setLoading("me");
    setError("");

    try {
      const payload = await getJson("/auth/me");
      setResult(payload);
      const returnedUser = payload.user as { id?: string } | undefined;
      if (returnedUser?.id) {
        setUserId(returnedUser.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load current user");
    } finally {
      setLoading(null);
    }
  }

  async function handleLogout() {
    setLoading("logout");
    setError("");

    try {
      const payload = await postJson("/auth/logout", {});
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Identity Service Test Harness</p>
        <h1>Login, register, verify OTP, and inspect the returned user payload.</h1>
        <p className={styles.subtitle}>
          This page is wired to the local identity service so you can test the full auth flow and
          see the response data immediately.
        </p>
      </section>

      <section className={styles.grid}>
        <form className={styles.card} onSubmit={handleRegister}>
          <h2>Register</h2>
          <label>
            Name
            <input
              value={registerForm.name}
              onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Jane Doe"
            />
          </label>
          <label>
            Email
            <input
              value={registerForm.email}
              onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="jane@example.com"
              type="email"
            />
          </label>
          <label>
            Password
            <input
              value={registerForm.password}
              onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Strong password"
              type="password"
            />
          </label>
          <label>
            Confirm Password
            <input
              value={registerForm.conformPassword}
              onChange={(event) => setRegisterForm((current) => ({ ...current, conformPassword: event.target.value }))}
              placeholder="Repeat password"
              type="password"
            />
          </label>
          <button type="submit" disabled={loading === "register"}>
            {loading === "register" ? "Registering..." : "Register"}
          </button>
        </form>

        <form className={styles.card} onSubmit={handleVerify}>
          <h2>Verify OTP</h2>
          <label>
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Paste the user id from register/login"
            />
          </label>
          <label>
            OTP
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
          </label>
          <button type="submit" disabled={loading === "verify"}>
            {loading === "verify" ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <form className={styles.card} onSubmit={handleLogin}>
          <h2>Login</h2>
          <label>
            Email
            <input
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="jane@example.com"
              type="email"
            />
          </label>
          <label>
            Password
            <input
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Your password"
              type="password"
            />
          </label>
          <button type="submit" disabled={loading === "login"}>
            {loading === "login" ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className={styles.card}>
          <h2>Session</h2>
          <p>Use this after logging in to inspect the cookie-backed session and user data.</p>
          <div className={styles.actions}>
            <button type="button" onClick={handleMe} disabled={loading === "me"}>
              {loading === "me" ? "Loading..." : "Get current user"}
            </button>
            <button type="button" onClick={handleLogout} disabled={loading === "logout"}>
              {loading === "logout" ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.outputPanel}>
        <div className={styles.outputHeader}>
          <h2>Last response</h2>
          <p>{error ? "Request failed" : "Response from identity service"}</p>
        </div>
        {error ? <pre className={styles.error}>{error}</pre> : <pre className={styles.output}>{prettyResult}</pre>}
      </section>
    </main>
  );
}
