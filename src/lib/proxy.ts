import { DEPLOYMENT_URL } from "./constants";

export function generateProxiesQueryString(proxies: string[]): string {
  return proxies
    .map((proxy) => `proxies=${encodeURIComponent(proxy)}`)
    .join("&");
}

export function getProxiesFromUrl(url: string): string[] {
  console.log("context.req.url: ", url);
  const parsedUrl = new URL(`http://${process.env.HOST ?? "localhost"}${url}`);
  console.log("parsed url: ", parsedUrl);
  return parsedUrl.searchParams.getAll("proxies");
}
