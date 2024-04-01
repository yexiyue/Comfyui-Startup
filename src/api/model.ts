export type Model = {
  name: string;
  type: string;
  base: string;
  save_path: string;
  description: string;
  reference: string;
  filename: string;
  url: string;
};

export type ModelList = {
  models: Model[];
};
