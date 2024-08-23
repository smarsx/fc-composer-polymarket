import { createPublicClient, http } from "viem";
import type { PublicClient } from "viem";
import { polygon } from "viem/chains";
import { SafeProxy } from "@/lib/safeProxy";
import { SAFE_PROXY_ADDRESS } from "./constants";

const polygonKey = process.env.POLYGON_KEY;

const PolygonClient = (): PublicClient => {
  if (!polygonKey || polygonKey == "") {
    throw new Error("failed to load POLYGON_KEY");
  }

  return createPublicClient({
    chain: polygon,
    transport: http(process.env.POLYGON_PROVIDER),
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
