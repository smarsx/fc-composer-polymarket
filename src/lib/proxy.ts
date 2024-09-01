import { DEPLOYMENT_URL } from "./constants";

export function generateProxiesQueryString(proxies: string[]): string {
  return proxies
    .map((proxy) => `proxies=${encodeURIComponent(proxy)}`)
    .join("&");
}

export function getProxiesFromUrl(url: string): string[] {
  const parsedUrl = new URL(url, DEPLOYMENT_URL);
  return parsedUrl.searchParams.getAll("proxies");
}
