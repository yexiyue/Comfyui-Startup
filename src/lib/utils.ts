import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化数字为字符串
 *
 * @param num 要格式化的数字
 * @param [decimals=2] 要保留的小数位数
 * @returns 格式化后的字符串
 */
export function formatToBytes(number: number, decimals = 2) {
  /// 定义单位数组
  const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  // 计算数字所在的单位级别
  let i = 0;
  while (number >= 1024 && i < units.length - 1) {
    number /= 1024;
    i++;
  }
  let unit = units[i];

  // 格式化数字，默认保留2位小数
  const formattedNumber = number.toFixed(decimals);

  // 返回格式化后的字符串
  return `${formattedNumber} ${unit}`;
}
