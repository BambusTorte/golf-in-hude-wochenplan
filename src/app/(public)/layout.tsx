import { PublicHeader } from "@/components/brand/PublicHeader";
import { PublicFooter } from "@/components/brand/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-brand-gradient flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 sm:px-6">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
