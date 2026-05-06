import en from "./en/translation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
    // Disables strict key checking so bare keys like t("translation:auth.foo") are accepted
    // without the "translation:" namespace prefix. This is a workaround for
    // TypeScript issue #52516 where generic defaults don't resolve at call sites.
    strictKeyChecks: false;
  }
}
