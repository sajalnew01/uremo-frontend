export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
      {title && <h3 className="font-semibold text-lg mb-4">{title}</h3>}
      {children}
    </div>
  );
}
