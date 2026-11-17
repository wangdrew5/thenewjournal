import { useId, useRef } from "react";
import { EmailSignup } from "./EmailSignup";
import "./issue-subscription.css";

export default function IssueSubscription() {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  return (
    <>
      <button type="button" className="issue-follow" onClick={() => dialog.current?.showModal()}>
        Get the next issue
      </button>
      <dialog ref={dialog} className="issue-follow-dialog" aria-labelledby={heading}>
        <form className="issue-follow-close" method="dialog"><button aria-label="Close subscription options">×</button></form>
        <h2 id={heading}>The next issue</h2>
        <p>Get new issues by email.</p>
        <EmailSignup />
        <a className="follow-feed" href={import.meta.env.BASE_URL + "issues.xml"}>Open the RSS feed</a>
      </dialog>
    </>
  );
}
