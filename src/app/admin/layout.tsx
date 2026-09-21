export default function AdminBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-brand-gradient min-h-dvh">{children}</div>;
}
