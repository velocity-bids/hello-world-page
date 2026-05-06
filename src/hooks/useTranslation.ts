import { useTranslation as useI18nTranslation } from "react-i18next";

/**
 * Wrapper around react-i18next's useTranslation that explicitly binds to the
 * "translation" namespace. This ensures TypeScript accepts bare keys like
 * t("translation:auth.foo") instead of requiring the "translation:auth.foo" prefix,
 * which is a quirk of i18next v26's strict TypeScript types.
 */
export const useTranslation = () => useI18nTranslation("translation");
