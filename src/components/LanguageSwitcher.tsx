import { useTranslation } from 'react-i18next';
import React from 'react';

// --- Theme Context ---
const ThemeContext = React.createContext<any>({ theme: 'light', setTheme: () => {} });
const useTheme = () => React.useContext(ThemeContext);

const THEMES: any = {
  light: { secondary: "bg-zinc-100 text-zinc-700" },
  dark: { secondary: "bg-zinc-800 text-zinc-300" },
  comfort: { secondary: "bg-[#d3cbb7] text-[#586e75]" },
  other: { secondary: "bg-[#e0f2fe] text-[#0369a1]" }
};

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'fr', name: 'French' },
  { code: 'ar', name: 'Arabic' },
  { code: 'uk', name: 'Ukrainian' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  // We'll use a simpler approach since we can't easily share the context across files without a separate file
  // For now, let's just use a prop or a simpler way. 
  // Actually, I'll just use a more generic style that works well enough or pass it from App.tsx
  
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="px-3 py-2 rounded-full font-medium text-sm border-none focus:ring-0 bg-black/5 text-current"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code} className="bg-white text-black">
          {lang.name}
        </option>
      ))}
    </select>
  );
};
