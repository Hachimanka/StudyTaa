import React from "react";

export default function EyeIcon({ visible, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        cursor: "pointer",
        position: "absolute",
        right: 8,
        top: "50%",
        transform: "translateY(-50%)",
        background: "var(--surface)",
        color: "var(--color-primary)",
        borderRadius: "50%",
        padding: 2,
        boxShadow: "0 0 2px rgba(0,0,0,0.08)",
        zIndex: 2
      }}
      aria-label={visible ? "Hide password" : "Show password"}
      tabIndex={0}
    >
      {visible ? (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-7.06M1 1l22 22" />
        </svg>
      )}
    </span>
  );
}
