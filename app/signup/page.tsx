"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setAuthSession } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function Signup() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) {
      toast("Name, email and password required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/signup", "POST", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setAuthSession({
        token: res.token,
        user: res.user || { role: "user", email },
      });
      router.push("/dashboard");
    } catch (err: any) {
      toast(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded p-6">
        <h1 className="text-xl font-semibold mb-4">Create account</h1>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full border p-2 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            className="w-full border p-2 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? "Creating..." : "Sign up"}
        </button>

        <p className="text-sm mt-3">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
