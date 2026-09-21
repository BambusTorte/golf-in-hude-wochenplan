import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "appearance-none", className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-sm font-medium text-red-600">{children}</p>;
}
