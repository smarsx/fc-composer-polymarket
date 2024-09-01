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
      return res.status(200).json({
        type: "form",
        title: "error",
        url: `${DEPLOYMENT_URL}/error?code=500`,
      });
    }

    const addresses = await getAddressesFromFid(fid);
    if (!addresses || addresses.length === 0) {
      return res.status(200).json({
        type: "form",
        title: "error",
        url: `${DEPLOYMENT_URL}/error?code=555`,
      });
    }

    // get proxy_addresses for addresses
    // ignoring magic link method rn. only metamask proxies.
    // https://polygonscan.com/address/0xaacfeea03eb1561c4e67d661e40682bd20e3541b#code
    // https://polygonscan.com/address/0xaB45c5A4B0c941a2F231C04C3f49182e1A254052
    const promises = addresses.map(getComputedAddress);
    const proxies = await Promise.all(promises);

    // get positions given proxy addresses
    const mpromises = proxies.map(getPositions);
    const positions = (await Promise.all(mpromises)).filter((r) => r !== null);
    if (!positions || positions.length === 0) {
      return res.status(200).json({
        type: "form",
        title: "error",
        url: `${DEPLOYMENT_URL}/error?code=556`,
      });
    }

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
    if (!questionMap) {
      return res.status(200).json({
        type: "form",
        title: "error",
        url: `${DEPLOYMENT_URL}/error?code=500`,
      });
    }

    const finalPositions = allPositions.flat().map((position) => ({
      ...position,
      src: questionMap[position.conditionId].src,
      title: questionMap[position.conditionId].question,
    }));

    // some positions missing payout[], not sure why? legacy market ? how read yes/no
    const filteredPositions = finalPositions.filter(
      (pos) => pos.payouts !== null
    );

    // save markets to sqlite
    await insertPositions(filteredPositions);

    res.status(200).json({
      type: "form",
      title: "pm-flex",
      url: `${DEPLOYMENT_URL}/?${generateProxiesQueryString(proxies)}`,
    });
  } else if (req.method === "GET") {
    res.status(200).json({
      type: "composer",
      name: "Polymarket Flex",
      icon: "checkbox",
      description: "Flex a Polymarket Position",
      imageUrl: `${DEPLOYMENT_URL}/logo.svg`,
      action: {
        type: "post",
      },
    });
  } else {
    res.status(405).end();
  }
}
