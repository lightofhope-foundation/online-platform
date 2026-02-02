"use client";

import { useState } from "react";
import { resetAdminPassword } from "../admin/reset-password-action";

export default function ResetAdminPasswordPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    const res = await resetAdminPassword();
    if (res.success) {
      setResult("✅ Password successfully reset to: Hallo123!");
    } else {
      setResult(`❌ Error: ${res.error}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="max-w-md w-full space-y-4 border border-white/10 bg-white/5 p-6 rounded-lg">
        <h1 className="text-xl font-semibold">Reset Admin Password</h1>
        <p className="text-sm opacity-75">
          This will reset the password for <strong>info@oag-media.com</strong> to <code className="bg-white/10 px-1 rounded">Hallo123!</code>
        </p>
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        {result && (
          <div className="mt-4 p-3 rounded bg-white/10 text-sm">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
