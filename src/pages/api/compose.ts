// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  AIRSTACK_URL,
  DEPLOYMENT_URL,
  GAMMA_BASE_URL,
  POLYMARKET_SUBGRAPH_URL,
} from "@/lib/constants";
import { getComputedAddress } from "@/lib/client";
import { Account, GraphQLResponse, MarketPositionsResult } from "@/lib/types";
import { insertAccounts } from "@/lib/sql";

const airstackKey = process.env.AIRSTACK_PROD_KEY;

function generateProxiesQueryString(proxies: string[]): string {
  return proxies
    .map((proxy) => `proxies=${encodeURIComponent(proxy)}`)
    .join("&");
}

async function getAddressesFromFid(fid: string): Promise<string[]> {
  if (!airstackKey || airstackKey == "") {
    throw Error(`failed to load AIRSTACK_PROD_KEY`);
  }

  const query = `
    query GetAddressesFromFid($identity: String!) {
      Socials(
        input: {
          filter: { identity: { _in: [$identity] } }
          blockchain: ethereum
        }
      ) {
        Social {
          userAssociatedAddresses
        }
      }
    }
  `;

  const variables = {
    identity: `fc_fid:${fid}`,
  };

  try {
    const response = await fetch(AIRSTACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: airstackKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.data?.Socials?.Social?.[0]?.userAssociatedAddresses) {
      return data.data.Socials.Social[0].userAssociatedAddresses;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching addresses:", error);
    throw error;
  }
}

async function getMarketPositions(
  proxy: string
): Promise<MarketPositionsResult> {
  proxy = proxy.toLowerCase();
  const query = `
    query GetMarketPositions($proxy: String!) {
      accounts(where: { id: $proxy }) {
        marketProfits {
          scaledProfit
          condition {
            id
            payouts
          }
        }
      }
    }
  `;

  const variables = {
    proxy: proxy.toLowerCase(),
  };

  try {
    const response = await fetch(POLYMARKET_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GraphQLResponse = await response.json();

    if (data.data?.accounts && data.data.accounts.length > 0) {
      // Append the proxy to the account object
      return {
        ...data.data.accounts[0],
        proxy,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching market positions:", error);
    throw error;
  }
}

async function fetchQuestionsByConditions(
  conditionIds: string[]
): Promise<Record<string, string>> {
  const url = new URL("/markets", GAMMA_BASE_URL);

  // Append each condition ID as a separate query parameter
  conditionIds.forEach((id) => {
    url.searchParams.append("condition_ids", id);
  });

  console.log("Requesting URL:", url.toString()); // Log the URL for debugging

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const questionMap: Record<string, string> = {};
    data.markets.forEach((market: any) => {
      questionMap[market.id] = market.question;
    });

    return questionMap;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComposerActionFormResponse | ComposerActionMetadata>
) {
  if (req.method === "POST") {
    const data = req.body;
    const fid = data.untrustedData.fid;
    if (!fid) {
      console.log(`no fid in ${req.body}`);
      console.log("exiting");
      return;
    }

    const addresses = await getAddressesFromFid(fid);
    // get proxy_addresses for addresses
    // ignoring magic link method rn. only metamask proxies.
    // https://polygonscan.com/address/0xaacfeea03eb1561c4e67d661e40682bd20e3541b#code
    // https://polygonscan.com/address/0xaB45c5A4B0c941a2F231C04C3f49182e1A254052
    const promises = addresses.map(getComputedAddress);
    const proxies = await Promise.all(promises);

    // get markets given proxy addresses
    const mpromises = proxies.map(getMarketPositions);
    const markets = await Promise.all(mpromises);

    // extract conditions
    const allMarkets = markets.filter(
      (market): market is Exclude<MarketPositionsResult, null> =>
        market !== null
    );
    const conditions = allMarkets.flatMap((market) =>
      market.marketProfits.map((profit) => profit.condition.id)
    );

    // fill in position titles from gamma api
    // https://gamma-api.polymarket.com/markets
    // https://docs.polymarket.com/?python#example-queries
    const questionMap = await fetchQuestionsByConditions(conditions);
    const finalMarkets: Account[] = allMarkets.map((market) => ({
      ...market,
      marketProfits: market.marketProfits.map((mp) => ({
        ...mp,
        condition: {
          ...mp.condition,
          title: questionMap[mp.condition.id],
        },
      })),
    }));

    // save markets to sqlite
    await insertAccounts(finalMarkets);

    res.status(200).json({
      type: "form",
      title: "pmpost",
      url: `${DEPLOYMENT_URL}?${generateProxiesQueryString(proxies)}`,
    });
  } else if (req.method === "GET") {
    res.status(200).json({
      type: "composer",
      name: "Create Poll",
      icon: "checkbox", // supported list: https://docs.farcaster.xyz/reference/actions/spec#valid-icons
      description: "Create a poll frame",
      aboutUrl: "https://your-app-server.example.com/about",
      imageUrl: "https://your-app-server.example.com/static/logo.png",
      action: {
        type: "post",
      },
    });
  } else {
    res.status(405).end();
  }
}

// "profit": "6892861216",
// "condition": {
//   "id": "0x265366ede72d73e137b2b9095a6cdc9be6149290caa295738a95e3d881ad0865",

//   "valueBought": "100000000",
//   "valueSold": "3913840400",

// 100
// 3913
// 3813

// use (valueSold - valueBought) / valueBought for old position
// for current position ?

// maybe can just use valueBought and profit to get percentChange ?
// use ((valueBought + profit) - valueBought) / valueBought ??
