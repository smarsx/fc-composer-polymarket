import { PolygonClient } from "./client";
import { SAFE_PROXY_ADDRESS } from "./constants";
import { SafeProxy } from "./safeProxy";

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

export async function getComputedAddress(
  address: string
): Promise<`0x${string}`> {
  // ignoring magic link method rn. only metamask proxies.
  // https://polygonscan.com/address/0xaacfeea03eb1561c4e67d661e40682bd20e3541b#code
  // https://polygonscan.com/address/0xaB45c5A4B0c941a2F231C04C3f49182e1A254052
  const client = PolygonClient();
  const computed = await client.readContract({
    address: SAFE_PROXY_ADDRESS,
    functionName: "computeProxyAddress",
    args: [address as `0x${string}`],
    abi: SafeProxy,
  });

  if (!computed || computed == "0x") {
    throw new Error(`failed to compute proxy address for ${address}`);
  }

  return computed;
}
