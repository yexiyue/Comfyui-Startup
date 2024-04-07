import { command } from "@/api";
import { useAsyncEffect, useDebounce, useSize } from "ahooks";
import { useRef, useState } from "react";
import { Input, Segmented, SelectProps } from "antd";
import { t, Trans } from "@lingui/macro";
import { SearchIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AllModel } from "./commponents/AllModel";
import { cn } from "@/lib/utils";

export const Component = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, { wait: 500 });
  const [type, setType] = useState("");
  const [base, setBase] = useState("");
  const [types, setTypes] = useState<SelectProps["options"]>([]);
  const [bases, setBases] = useState<SelectProps["options"]>([]);

  // 获取宽度
  const divRef = useRef<HTMLDivElement>(null);
  const size = useSize(divRef);

  useAsyncEffect(async () => {
    const types = await command("get_model_type_groups");
    setTypes(types);
    const bases = await command("get_model_base_groups");
    setBases(bases);
  }, []);

  const props = {
    type,
    base,
    search: debouncedSearch,
    width: size?.width ?? 0,
  };

  return (
    <div className="w-full h-full">
      <div className=" flex justify-between items-center px-4 py-2">
        <p>插件管理</p>
        <Segmented
          value={type}
          onChange={(value) => {
            setType(value);
          }}
          options={[
            {
              label: <Trans>全部</Trans>,
              value: "all",
            },
            {
              label: <Trans>下载中</Trans>,
              value: "downloading",
            },
            {
              label: <Trans>已安装</Trans>,
              value: "downloaded",
            },
          ]}
        />
      </div>
      <Separator />
      <div ref={divRef} className="p-4">
        <div className="w-full flex gap-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t`搜索`}
            prefix={<SearchIcon className="w-4 h-4" />}
            allowClear
          />
        </div>
      </div>

      <div className={cn("w-full", type === "all" ? "block" : "hidden")}>
        <AllModel {...props} />
      </div>
      {/* <div
        className={cn("w-full", type === "downloading" ? "block" : "hidden")}
      >
        <DownloadingPlugin search={debouncedSearch} width={size?.width ?? 0} />
      </div>
      <div className={cn("w-full", type === "downloaded" ? "block" : "hidden")}>
        <DownloadedPlugin search={debouncedSearch} width={size?.width ?? 0} />
      </div> */}
    </div>
  );
};
