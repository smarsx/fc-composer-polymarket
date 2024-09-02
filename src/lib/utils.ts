import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPct(profits: number, valueBought: number): string {
  return Math.max(-100, (profits / valueBought) * 100).toFixed(2);
}
