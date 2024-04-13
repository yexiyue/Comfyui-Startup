import { command } from "@/api";
import { InputButton } from "@/components/InputButton";
import { useConfigStore } from "@/useStore";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Button, Form, Segmented, Select, message } from "antd";

export const Component = () => {
  useLingui();
  const [
    country,
    setCountry,
    comfyuiPath,
    setComfyuiPath,
    language,
    setLanguage,
  ] = useConfigStore((store) => [
    store.country,
    store.setCountry,
    store.comfyuiPath,
    store.setComfyuiPath,
    store.language,
    store.setLanguage,
  ]);
  const [form] = Form.useForm<{
    country: string;
    comfyuiPath: string;
    language: string;
  }>();

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Form
        className="w-[380px] translate-y-[-50px]"
        layout="vertical"
        labelCol={{ span: 4 }}
        form={form}
        initialValues={{
          country,
          comfyuiPath,
          language,
        }}
      >
        <Form.Item
          name={"country"}
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
          name={"comfyuiPath"}
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
        <Form.Item name={"language"} label={t`语言`}>
          <Select
            className="w-[150px]"
            options={[
              { value: "en", label: "English" },
              { value: "zh", label: "中文" },
              { value: "ja", label: "日本語" },
            ]}
          ></Select>
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
                message.success(t`更新成功`);
              } catch (error) {
                message.error(`${error}`);
              }
            }}
          >
            <Trans>更新</Trans>
          </Button>
        </div>
      </Form>
    </div>
  );
};
