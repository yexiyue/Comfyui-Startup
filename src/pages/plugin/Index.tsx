import { command } from "@/api";
import { Button } from "antd";

export const Component = () => {
  return (
    <div>
      Plugin
      <Button
        onClick={async () => {
          const res = await command("get_plugin_list");
          console.log(res);
        }}
      >
        list
      </Button>
    </div>
  );
};
