import { open } from "@tauri-apps/plugin-shell";
import { Typography } from "antd";
import { Components } from "react-markdown";

export const CustomLink: Components["a"] = ({ href, children }) => {
  return (
    <Typography.Link
      onClick={async () => {
        await open(decodeURI(href as string));
      }}
    >
      {children}
    </Typography.Link>
  );
};
