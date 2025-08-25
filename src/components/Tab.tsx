"use client";

import { useId, KeyboardEvent } from "react";

interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function Tabs({ items, value, onChange, className }: TabsProps) {
  const baseId = useId();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (items.length < 2) return;
    const idx = items.findIndex((t) => t.key === value);
    if (idx === -1) return;

    if (e.key === "ArrowRight") {
      const next = items[(idx + 1) % items.length];
      onChange(next.key);
    } else if (e.key === "ArrowLeft") {
      const prev = items[(idx - 1 + items.length) % items.length];
      onChange(prev.key);
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="예약 탭"
        className="inline-flex rounded-2xl bg-gray-100 p-1"
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const selected = item.key === value;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-${item.key}-panel`}
              id={`${baseId}-${item.key}-tab`}
              onClick={() => onChange(item.key)}
              className={[
                "px-4 py-2 rounded-xl text-sm font-medium transition",
                selected
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {typeof item.badge === "number" && (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-gray-200 px-2 text-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
