"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-black">
      <h1 className="font-bold text-lg">UREMO</h1>

      <button
        onClick={logout}
        className="text-sm text-red-400 hover:text-red-500"
      >
        Logout
      </button>
    </header>
  );
}
