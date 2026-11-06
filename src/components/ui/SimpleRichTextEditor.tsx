"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = "Notiz schreiben …",
  minHeight = 120,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const run = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-black/35">
      <div className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-1.5">
        <ToolbarBtn label="B" title="Fett" onClick={() => run("bold")} className="font-bold" />
        <ToolbarBtn label="U" title="Unterstreichen" onClick={() => run("underline")} className="underline" />
        <ToolbarBtn label="•" title="Stichpunkte" onClick={() => run("insertUnorderedList")} />
        <ToolbarBtn
          label="Link"
          title="Link einfügen"
          onClick={() => {
            const url = window.prompt("URL (https://…)");
            if (url?.trim()) run("createLink", url.trim());
          }}
        />
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className="prose-invert max-w-none px-3 py-2 text-sm text-white outline-none empty:before:pointer-events-none empty:before:text-white/30 empty:before:content-[attr(data-placeholder)] [&_a]:text-[#63eca9] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
        style={{ minHeight }}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        onKeyDown={(e) => {
          if (e.key === "-" && ref.current) {
            // browser list handling via toolbar; keep dash typing natural
          }
        }}
      />
    </div>
  );
}

function ToolbarBtn({
  label,
  title,
  onClick,
  className = "",
}: {
  label: string;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white ${className}`}
    >
      {label}
    </button>
  );
}
