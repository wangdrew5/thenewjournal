import { useEffect, type RefObject } from "react";

// Keep keyboard focus in a custom modal and return it when the modal closes.
export function useDialogFocus(dialog: RefObject<HTMLElement | null>, initial: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active || !dialog.current) return;
    const root = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    initial.current?.focus();
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), audio[controls], video[controls], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); root.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) initial.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      previous?.focus();
    };
  }, [active, dialog, initial]);
}
