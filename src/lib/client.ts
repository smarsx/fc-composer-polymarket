import { createPublicClient, http } from "viem";
import type { PublicClient } from "viem";
import { polygon } from "viem/chains";

const clientUrl = process.env.POLY_CLIENT_URL;

export const PolygonClient = (): PublicClient => {
  if (!clientUrl || clientUrl == "") {
    throw new Error("failed to load POLYGON_KEY");
  }

  return createPublicClient({
    chain: polygon,
    transport: http(clientUrl),
  });
};
