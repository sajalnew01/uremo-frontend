export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      {title && <h3 className="font-semibold text-lg mb-4">{title}</h3>}
      {children}
    </div>
  );
}
