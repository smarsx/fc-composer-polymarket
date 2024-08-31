import { createPublicClient, http } from "viem";
import type { PublicClient } from "viem";
import { polygon } from "viem/chains";
import { SafeProxy } from "@/lib/safeProxy";
import { SAFE_PROXY_ADDRESS } from "./constants";

const clientUrl = process.env.POLY_CLIENT_URL;

const PolygonClient = (): PublicClient => {
  if (!clientUrl || clientUrl == "") {
    throw new Error("failed to load POLYGON_KEY");
  }

  return createPublicClient({
    chain: polygon,
    transport: http(clientUrl),
  });
};

export async function getComputedAddress(
  address: string
): Promise<`0x${string}`> {
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
