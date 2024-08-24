import { useEffect, useState } from "react";
import Image from "next/image";

export default function ThemeSwitcher() {
  // Get stored theme
  let defaultTheme = localStorage.getItem("theme") as "dark" | "light" | null;

  // If no theme is stored, use device default
  if (defaultTheme === null) {
    defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(defaultTheme);

  useEffect(() => {
    localStorage.setItem("theme", currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // Set theme to device default when it changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onThemeChanges);
    return (() => {
      window.matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", onThemeChanges);
    });
  }, []);

  function onThemeChanges(ev: MediaQueryListEvent) {
    setCurrentTheme(ev.matches ? "dark" : "light");
  }

  return (
    <Image
      src={currentTheme === "dark" ? "/dark-theme-logo" : "/light-theme-logo"}
      onClick={() => setCurrentTheme(currentTheme === "dark" ? "light" : "dark")}
      width={64}
      height={64}
      alt="switch to dark theme"
      className="float-right h-full w-auto rounded-full p-3 opacity-75 hover:cursor-pointer hover:opacity-90"
    />
  );
}