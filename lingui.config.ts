import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["zh", "en", "ja"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}",
      include: ["src"],
    },
  ],
  sourceLocale: "zh",
};

export default config;
