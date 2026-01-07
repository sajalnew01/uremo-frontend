import Link from "next/link";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Buy Service", href: "/buy-service" },
  { name: "My Orders", href: "/orders" },
  { name: "Apply to Work", href: "/apply-to-work" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 p-6 hidden md:block">
      <nav className="space-y-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-sm text-zinc-300 hover:text-white"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
