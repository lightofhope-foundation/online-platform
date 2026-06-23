type NavSpinnerProps = {
  className?: string;
};

/** Small inline spinner for nav links and buttons */
export function NavSpinner({ className = "" }: NavSpinnerProps) {
  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white/40 border-t-[#63eca9] animate-spin ${className}`.trim()}
      aria-hidden
    />
  );
}
