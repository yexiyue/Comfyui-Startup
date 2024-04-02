import { command } from "@/api";
import { Button } from "antd";

export const Component = () => {
  return (
    <div>
      model
      <Button
        onClick={async () => {
          const res = await command("get_model_list");
          console.log(res);
        }}
      >
        list
      </Button>
    </div>
  );
};
