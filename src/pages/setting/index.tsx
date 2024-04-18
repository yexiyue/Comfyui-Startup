import { command } from "@/api";
import { InputButton } from "@/components/inputButton";
import { useUpdater } from "@/hooks/useUpdater";
import { useConfigStore } from "@/useStore";
import { LoadingOutlined } from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  App,
  Button,
  Form,
  Modal,
  Segmented,
  Select,
  Spin,
  Switch,
  Typography,
} from "antd";

type FormData = {
  country: string;
  comfyuiPath: string;
  language: string;
  autoCheckUpdate: boolean;
};
export const Component = () => {
  useLingui();
  const { message } = App.useApp();
  const { update, checkUpdate, updating, progress } = useUpdater({
    manual: true,
    timeout: 3000,
  });
  console.log("updating", updating, progress);
  const [
    country,
    setCountry,
    comfyuiPath,
    setComfyuiPath,
    language,
    setLanguage,
    autoCheckUpdate,
    setAutoCheckUpdate,
  ] = useConfigStore((store) => [
    store.country,
    store.setCountry,
    store.comfyuiPath,
    store.setComfyuiPath,
    store.language,
    store.setLanguage,
    store.autoCheckUpdate,
    store.setAutoCheckUpdate,
  ]);
  const [form] = Form.useForm<FormData>();

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Form
        className="w-[380px] border rounded-lg shadow-lg"
        style={{
          padding: 24,
        }}
        layout="vertical"
        form={form}
        initialValues={{
          country,
          comfyuiPath,
          language,
          autoCheckUpdate,
        }}
      >
        <Form.Item
          name="country"
          label={t`地区`}
          extra={t`在安装模型和插件时会根据不同地区自动配置代理`}
        >
          <Segmented
            options={[
              {
                label: t`中国用户`,
                value: "chinese",
              },
              {
                label: t`其他国家`,
                value: "foreign",
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="comfyuiPath"
          label={t`路径`}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value) {
                  return Promise.reject(t`路径不能为空`);
                }
                const exist = await command("comfyui_exists", { path: value });
                if (!exist) {
                  return Promise.reject(t`请选择正确的ComfyUI目录`);
                }
              },
            },
          ]}
        >
          <InputButton />
        </Form.Item>
        <Form.Item name="language" label={t`语言`}>
          <Select
            className="w-[150px]"
            options={[
              { value: "en", label: "English" },
              { value: "zh", label: "中文" },
              { value: "ja", label: "日本語" },
            ]}
          ></Select>
        </Form.Item>
        <Form.Item name="autoCheckUpdate" label={t`自动更新`}>
          <Switch />
        </Form.Item>
        <div className="flex justify-center">
          <Button
            type="primary"
            className="w-full"
            onClick={async () => {
              const values = await form.validateFields();
              try {
                await command("set_config", {
                  configState: {
                    country: values.country,
                    comfyui_path: values.comfyuiPath,
                  },
                });
                setComfyuiPath(values.comfyuiPath);
                setCountry(values.country);
                setLanguage(values.language);
                setAutoCheckUpdate(values.autoCheckUpdate);
                message.success(t`更新成功`);
              } catch (error) {
                message.error(`${error}`);
              }
            }}
          >
            <Trans>更新</Trans>
          </Button>
        </div>
        <div className="flex justify-center pt-4">
          <Button
            type="link"
            className="w-full"
            onClick={async () => {
              const key = "checkUpdate";

              message.open({
                content: t`正在检查更新...`,
                key,
                type: "loading",
                duration: 0,
              });

              try {
                const shouldUpdate = await checkUpdate();
                if (!shouldUpdate) {
                  message.open({
                    content: t`已是最新版本`,
                    key,
                    type: "success",
                    duration: 2,
                  });
                } else {
                  const confirm = await ask(t`发现新版本，是否更新？`, {
                    title: t`更新提示`,
                    kind: "info",
                    okLabel: t`更新`,
                    cancelLabel: t`取消`,
                  });

                  if (confirm) {
                    await update();
                  }
                  message.destroy(key);
                }
              } catch (error) {
                message.open({
                  content: t`检查更新失败`,
                  key,
                  type: "error",
                  duration: 2,
                });
              }
            }}
          >
            <Trans>检查更新</Trans>
          </Button>
        </div>
      </Form>
      <Modal
        centered
        open={updating}
        closable={false}
        footer={null}
        width={200}
        styles={{
          body: {
            height: 120,
          },
        }}
      >
        <div className="w-full h-full flex justify-center items-center flex-col">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
          <Typography.Link
            style={{
              cursor: "default",
            }}
          >{t`正在更新...`}</Typography.Link>
        </div>
      </Modal>
    </div>
  );
};
