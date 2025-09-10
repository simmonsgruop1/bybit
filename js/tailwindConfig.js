// ===== Tailwind config (for CDN build) =====
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0f1115",
          800: "#12151b",
          700: "#181c23",
          600: "#1f242d",
        },
        ink: { 300: "#9aa4b2", 400: "#b6c0ce", 500: "#d0d6e1", 700: "#e6eaf1" },
        accent: { 400: "#f5c84b", 500: "#f3b933", 600: "#e29d00" },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem" },
    },
  },
};
