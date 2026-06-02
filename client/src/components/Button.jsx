export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:border-zinc-300 disabled:bg-zinc-300",
    secondary:
      "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400",
    danger:
      "border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:border-red-200 disabled:bg-red-200",
    ghost: "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100"
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base"
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
