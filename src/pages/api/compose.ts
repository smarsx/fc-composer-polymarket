// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { DEPLOYMENT_URL } from "@/lib/constants";
import { getComputedAddress } from "@/lib/client";
import { insertPositions } from "@/lib/sql";
import { getPositions, PositionsResult } from "@/lib/position";
import { fetchQuestionsByConditions } from "@/lib/question";
import { generateProxiesQueryString } from "@/lib/proxy";
import { getAddressesFromFid } from "@/lib/fid";

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

    // get positions given proxy addresses
    const mpromises = proxies.map(getPositions);
    const positions = await Promise.all(mpromises);

    // extract conditions
    const allPositions = positions.filter(
      (position): position is Exclude<PositionsResult, null> =>
        position !== null
    );
    const conditionIds = allPositions.flatMap((positions) =>
      positions.map((position) => position.conditionId)
    );

    // fill in position titles from gamma api
    // https://gamma-api.polymarket.com/markets
    // https://docs.polymarket.com/?python#example-queries
    const questionMap = await fetchQuestionsByConditions(conditionIds);
    const finalPositions = allPositions.flat().map((position) => ({
      ...position,
      src: questionMap[position.conditionId].src,
      title: questionMap[position.conditionId].question,
    }));

    // save markets to sqlite
    await insertPositions(finalPositions);

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

// query MyQuery {
//   accounts(where: {id:"0x5f01e0886b508a357ac198cbe72af3bf74fe9d3d"}) {
//     marketProfits {
//       profit
//       condition {
//         id
//         payouts
//       }
//     }
//     marketPositions {
//       valueBought
//       valueSold
//       netValue
//       market {
//         condition {
//           id
//         }
//       }
//     }
//   }
// }
