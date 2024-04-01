
export type Plugin = {
  author: string;
  description: string;
  files: string[];
  install_type: string;
  pip?: string[];
  reference: string;
  title: string;
};

export type PluginList = {
  custom_nodes: Plugin[];
};
