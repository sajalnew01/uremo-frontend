"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setAuthSession } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      toast("Email and password required", "error");
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("login submit", {
        email,
        passwordLength: password.length,
        apiBase: process.env.NEXT_PUBLIC_API_URL || "(fallback: onrender)",
      });
    }

    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/login", "POST", {
        email,
        password,
      });

      setAuthSession({ token: res.token, user: res.user });
      router.push("/dashboard");
    } catch (err: any) {
      toast(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded p-6">
        <h1 className="text-xl font-semibold mb-4">Login</h1>

        <input
          className="w-full border p-2 mb-3"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 mb-4"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm mt-3">
          Don't have an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
