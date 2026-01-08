"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) {
      alert("Name, email and password required");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/signup", "POST", {
        name,
        email,
        password,
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.user?.role || "user");
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded p-6">
        <h1 className="text-xl font-semibold mb-4">Create account</h1>

        <div className="mb-4">
          <label className="text-sm text-[#9CA3AF] block mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            className="w-full p-2 bg-transparent border border-[#1F2937] rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
