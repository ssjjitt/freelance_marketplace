import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/theme-context";

const iconProps = { strokeWidth: 1.5, size: 20 } as const;

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="navbar-btn"
      aria-label={
        theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"
      }
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    >
      {theme === "dark" ? <Sun {...iconProps} /> : <Moon {...iconProps} />}
    </button>
  );
}
