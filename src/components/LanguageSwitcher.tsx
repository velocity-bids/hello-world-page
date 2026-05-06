import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isPT = i18n.language === "pt" || i18n.language.startsWith("pt");

  const toggle = () => {
    i18n.changeLanguage(isPT ? "en" : "pt");
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="text-sm font-medium px-2">
      {isPT ? "🇬🇧 EN" : "🇵🇹 PT"}
    </Button>
  );
};
