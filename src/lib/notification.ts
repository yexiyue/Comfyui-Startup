import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  Options,
} from "@tauri-apps/plugin-notification";

export const notification = async (notify: Options | string) => {
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    permissionGranted = (await requestPermission()) == "granted";
  }
  if (permissionGranted) {
    sendNotification(notify);
  }
};
