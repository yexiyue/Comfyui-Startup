/// <reference types="vite/client" />
/// <reference types="@lingui/core" />

declare module "*react" {
  const content: any;
  export default content;
}

declare module "*.po" {
  export const messages: Messages;
}
