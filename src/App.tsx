import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import { useConfigStore } from "./useStore";
import { useEffect } from "react";
import { ConfigProvider, FloatButton } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import zhCN from "antd/lib/locale/zh_CN";
import enUS from "antd/lib/locale/en_US";
import { BugIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

const App = () => {
  const [language] = useConfigStore((store) => [store.language]);
  useEffect(() => {
    import(`@/locales/${language}.po`).then((res) => {
      i18n.load(res.messages);
      i18n.activate(language);
    });
  }, [language]);
  return (
    <I18nProvider i18n={i18n}>
      <StyleProvider hashPriority="high">
        <ConfigProvider locale={language === "zh" ? zhCN : enUS}>
          <RouterProvider router={router} />
          <FloatButton
            className="w-5 h-5"
            onClick={async () => {
              await invoke("open_devtool");
            }}
            icon={<BugIcon className="w-4 h-4" />}
          ></FloatButton>
        </ConfigProvider>
      </StyleProvider>
    </I18nProvider>
  );
};

export default App;
