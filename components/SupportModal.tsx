"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./SupportModal.module.css";

export const SUPPORT_LINKS = {
  tmp: {
    support: "tax-monitor-pro/tax-monitor-service-support",
    intro: "tax-monitor-pro/tax-monitor-service-intro",
  },
};

interface SupportModalProps {
  calUrl: string;
  open: boolean;
  onClose: () => void;
}

export function SupportModal({ calUrl, open, onClose }: SupportModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullUrl = `https://cal.com/${calUrl}?embed=true`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <iframe
          src={fullUrl}
          className={styles.iframe}
          title="Schedule a call"
          allow="payment"
        />
      </div>
    </div>
  );
}

interface SupportButtonProps {
  calUrl: string;
  label?: string;
  className?: string;
}

export function SupportButton({
  calUrl,
  label = "Book a Call",
  className,
}: SupportButtonProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        className={`${styles.triggerButton} ${className || ""}`}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <SupportModal calUrl={calUrl} open={open} onClose={close} />
    </>
  );
}

export default SupportModal;
