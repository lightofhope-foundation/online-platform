"use client";

type DisplayNameFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestion?: string;
};

export function DisplayNameField({
  id,
  value,
  onChange,
  suggestion,
}: DisplayNameFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={id} className="text-xs text-white/50">
          Anzeigename
        </label>
        <span className="group relative inline-flex">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Hinweis zum Anzeigenamen"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[10px] font-semibold text-white/60 transition hover:border-[#63eca9]/50 hover:text-[#63eca9]"
          >
            i
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/15 bg-black/95 px-3 py-2 text-xs leading-relaxed text-white/80 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            Dieser Name erscheint oben rechts in der Plattform — z. B. in der
            Kopfzeile und in Listen.
          </span>
        </span>
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={suggestion}
        maxLength={64}
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
      />
      {suggestion ? (
        <p className="mt-1 text-xs text-white/40">
          Vorschlag:{" "}
          <button
            type="button"
            className="text-[#63eca9] hover:underline"
            onClick={() => onChange(suggestion)}
          >
            {suggestion}
          </button>
        </p>
      ) : null}
    </div>
  );
}
