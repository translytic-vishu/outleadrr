import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import App from "./App";
import "./index.css";

// PostHog analytics — set VITE_POSTHOG_KEY in your env to enable
const phKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
if (phKey) {
  posthog.init(phKey, {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
