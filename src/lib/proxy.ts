export function generateProxiesQueryString(proxies: string[]): string {
  return proxies
    .map((proxy) => `proxies=${encodeURIComponent(proxy)}`)
    .join("&");
}

export function getProxiesFromUrl(url: string): string[] {
  // dont think process.env.HOST is valid when deployed but doesn't matter, just getting the query anyways
  const parsedUrl = new URL(`http://${process.env.HOST ?? "localhost"}${url}`);
  return parsedUrl.searchParams.getAll("proxies");
}
