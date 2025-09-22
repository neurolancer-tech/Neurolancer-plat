"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = Cookies.get("cookie_consent");
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:pb-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          We use cookies to improve your experience, personalize content, and secure your account. By using Neurolancer, you agree to our use of cookies. See our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</Link>.
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setVisible(false)}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              try { Cookies.set("cookie_consent", "accepted", { expires: 365 }); } catch {}
              setVisible(false);
            }}
            className="px-4 py-2 text-sm rounded-md text-white"
            style={{ background: "linear-gradient(135deg, #0D9E86, #0B8A73)" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

