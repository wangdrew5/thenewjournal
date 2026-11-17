import { useId, useRef } from "react";
import { siteOrigin } from "../lib/publicPages";
import "./issue-subscription.css";

export default function IssueSubscription() {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const feed = siteOrigin + "/issues.xml";
  return (
    <>
      <button type="button" className="issue-follow" onClick={() => dialog.current?.showModal()}>
        Get the next issue
      </button>
      <dialog ref={dialog} className="issue-follow-dialog" aria-labelledby={heading}>
        <form method="dialog"><button aria-label="Close subscription options">×</button></form>
        <h2 id={heading}>The next issue</h2>
        <p>Get an email when The New Journal publishes an issue, or follow along in your feed reader.</p>
        <a className="follow-email" href={"https://feedrabbit.com/subscriptions/new?url=" + encodeURIComponent(feed)}>Subscribe by email</a>
        <small>Email subscriptions are handled by Feedrabbit.</small>
        <a className="follow-feed" href={import.meta.env.BASE_URL + "issues.xml"}>Open the RSS feed</a>
      </dialog>
    </>
  );
}
