import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type CommandItem = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  shortcut?: string;
  perform: () => void;
};

type Props = {
  open: boolean;
  items: CommandItem[];
  onClose: () => void;
};

export function CommandPalette({ open, items, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.group} ${it.hint ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, items]);

  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);

  // scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[active];
      if (it) {
        it.perform();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // group rendering
  const groups: { name: string; items: { item: CommandItem; idx: number }[] }[] = [];
  let lastGroup = "";
  filtered.forEach((it, idx) => {
    if (it.group !== lastGroup) {
      groups.push({ name: it.group, items: [] });
      lastGroup = it.group;
    }
    groups[groups.length - 1].items.push({ item: it, idx });
  });

  return (
    <div className="cmd-overlay" onMouseDown={onClose}>
      <div
        className="cmd-panel"
        role="dialog"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Search wallets, tabs, coins, settings…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <div className="cmd-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="cmd-empty">No matches.</div>
          )}
          {groups.map((g) => (
            <div key={g.name} className="cmd-group">
              <div className="cmd-group-head">{g.name}</div>
              {g.items.map(({ item, idx }) => (
                <button
                  key={item.id}
                  type="button"
                  data-cmd-index={idx}
                  className={`cmd-item ${idx === active ? "active" : ""}`}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => {
                    item.perform();
                    onClose();
                  }}
                >
                  <span className="cmd-label">{item.label}</span>
                  {item.hint && <span className="cmd-hint">{item.hint}</span>}
                  {item.shortcut && (
                    <span className="cmd-shortcut">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="cmd-foot">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
