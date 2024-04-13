import { t, Trans } from "@lingui/macro";
import { useControllableValue } from "ahooks";
import { Space, Input, Button, message } from "antd";
import { FolderClosedIcon } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

type InputButtonProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export const InputButton = (props: InputButtonProps) => {
  const [value, setValue] = useControllableValue<string>(props);

  return (
    <Space.Compact>
      <Input
        value={value}
        className="cursor-pointer"
        placeholder={t`请选择安装目录`}
        prefix={<FolderClosedIcon className="h-4 w-4" />}
      />
      <Button
        type="primary"
        onClick={async () => {
          try {
            const path = await open({
              directory: true,
            });
            if (path) setValue(path);
          } catch (error) {
            message.error(`${error}`);
          }
        }}
      >
        <Trans>选择路径</Trans>
      </Button>
    </Space.Compact>
  );
};
