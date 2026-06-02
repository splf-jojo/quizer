export default function Card({ children, className = "" }) {
  return (
    <section className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}
