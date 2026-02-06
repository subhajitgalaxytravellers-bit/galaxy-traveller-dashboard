// src/pages/AuthPage.jsx
import * as React from "react";
import LoginForm from "./login";
import SignupForm from "./signup";
import { useNavigate } from "react-router-dom";

import SocialGoogleButton from "@/components/GoogleButton";

export default function AuthPage() {
  // System theme as default (only if you don't already have a ThemeProvider)

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (d) => document.documentElement.classList.toggle("dark", d);
    apply(mql.matches);
    const onChange = (e) => apply(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  const navigate = useNavigate();

  const [tab, setTab] = React.useState("login");

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center  place-items-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-[480px] p-4">
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          {/* Brand */}
          <div className="px-6 pt-6 pb-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Galaxy Traveler Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to continue
            </p>
          </div>

          {/* Tabs (simple) */}
          <div className="px-2 pt-2">
            <div className="mx-4 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 flex">
              <button
                onClick={() => setTab("login")}
                className={[
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                  tab === "login"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900",
                ].join(" ")}
              >
                Log in
              </button>
              <button
                onClick={() => setTab("signup")}
                className={[
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                  tab === "signup"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900",
                ].join(" ")}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="px-6">
            {tab === "login" ? <LoginForm /> : <SignupForm />}
          </div>

          <div className="relative my-2  flex items-center">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="px-3 text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="px-7 py-6 pt-3 rounded-2xl">
            <SocialGoogleButton
              onLogin={(res) => {
                localStorage.setItem("token", res.token);
                localStorage.setItem("user", JSON.stringify(res.user));
                navigate("/");
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing you agree to our Terms & Privacy.
        </p>
      </div>
    </div>
  );
}
