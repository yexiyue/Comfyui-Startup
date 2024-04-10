import { StyleProvider } from "@ant-design/cssinjs";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { invoke } from "@tauri-apps/api/core";
import { App as AntdApp, ConfigProvider, FloatButton } from "antd";
import enUS from "antd/lib/locale/en_US";
import zhCN from "antd/lib/locale/zh_CN";
import { BugIcon } from "lucide-react";
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { messages as enMessages } from "./locales/en.po";
import { messages as zhMessages } from "./locales/zh.po";
import { router } from "./router/router";
import { useConfigStore } from "./useStore";

i18n.load("zh", zhMessages);
i18n.load("en", enMessages);

const App = () => {
  const [language] = useConfigStore((store) => [store.language]);

  useEffect(() => {
    i18n.activate(language);
  }, [language]);
  
  return (
    <I18nProvider i18n={i18n}>
      <StyleProvider hashPriority="high">
        <ConfigProvider locale={language === "zh" ? zhCN : enUS}>
          <AntdApp>
            <RouterProvider router={router} />
          </AntdApp>
          {import.meta.env.DEV && (
            <FloatButton
              className="w-5 h-5"
              onClick={async () => {
                await invoke("open_devtool");
              }}
              style={{
                zIndex: 9999,
              }}
              icon={<BugIcon className="w-4 h-4" />}
            ></FloatButton>
          )}
        </ConfigProvider>
      </StyleProvider>
    </I18nProvider>
  );
};

export default App;
