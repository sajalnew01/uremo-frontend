export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white hover:shadow-lg transition">
      {title && <h3 className="font-semibold text-lg mb-4">{title}</h3>}
      {children}
    </div>
  );
}
