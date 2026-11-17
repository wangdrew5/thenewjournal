import { useId, useRef, useState, type FormEvent } from "react";
import "./issue-subscription.css";

const endpoint = "https://thenewjournal-email.vercel.app/api/subscribe";

export function EmailSignup({ native = false }: { native?: boolean }) {
  const id = useId();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const status = useRef<HTMLParagraphElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "saving" || state === "saved") return;
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setState("saving");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || (await response.json()).result !== "saved") {
        const error = response.status === 429 ? "Please wait a minute and try again."
          : response.status === 400 ? "Check your email address and try again."
          : "Your signup couldn’t be saved. Please try again.";
        setMessage(error);
        setState("error");
        return;
      }
      form.reset();
      setState("saved");
      setMessage("You’re on the list.");
      status.current?.focus({ preventScroll: true });
    } catch {
      setMessage("Couldn’t reach the Journal. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <div className="issue-signup">
      {state !== "saved" && <form action={endpoint} method="post" target={native ? "signup-result-" + id : undefined} onSubmit={submit}>
        <label htmlFor={id}>Email address</label>
        <div className="issue-signup-row">
          <input id={id} type="email" name="email" required maxLength={254} autoComplete="email"
            autoCapitalize="none" spellCheck={false} placeholder="you@example.com" readOnly={state === "saving"} />
          <button type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Subscribe"}</button>
        </div>
      </form>}
      {native
        ? <iframe name={"signup-result-" + id} title="Email signup result" className="issue-signup-result" />
        : <p ref={status} role="status" tabIndex={-1} className="issue-signup-message">{message}</p>}
    </div>
  );
}

export function TableSignup({ native = false }: { native?: boolean }) {
  return (
    <details className="table-signup" onToggle={event => {
      const details = event.currentTarget;
      if (details.open) details.querySelector("input")?.focus({ preventScroll: true });
    }}>
      <summary className="table-subscribe">Get new issues by email <span className="contents-fold" aria-hidden="true" /></summary>
      <EmailSignup native={native} />
    </details>
  );
}
