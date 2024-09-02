import type { NextApiRequest, NextApiResponse } from "next";
import { DEPLOYMENT_URL } from "@/lib/constants";
import { insertPositions } from "@/lib/sql";
import { getPositions } from "@/lib/position";
import { fetchQuestionsByConditions } from "@/lib/question";
import { generateProxiesQueryString, getComputedAddress } from "@/lib/proxy";
import { getAddressesFromFid } from "@/lib/fid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComposerActionFormResponse | ComposerActionMetadata>
) {
  switch (req.method) {
    case "GET":
      res.status(200).json({
        type: "composer",
        name: "Polymarket Flex",
        icon: "checkbox",
        description: "Flex a Polymarket Position",
        imageUrl: `${DEPLOYMENT_URL}/logo.svg`,
        aboutUrl: "https://github.com/smarsx/fc-composer-polymarket",
        action: {
          type: "post",
        },
      });
    case "POST":
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
      const promises = addresses.map(getComputedAddress);
      const proxies = await Promise.all(promises);

      // get positions given proxy addresses
      const mpromises = proxies.map(getPositions);
      const positions = (await Promise.all(mpromises)).filter(
        (c) => c !== null
      );
      if (!positions || positions.length === 0) {
        return res.status(200).json({
          type: "form",
          title: "error",
          url: `${DEPLOYMENT_URL}/error?code=556`,
        });
      }

      // extract condition_ids
      const conditionIds = positions.flatMap((p) =>
        p.map((p2) => p2.conditionId)
      );

      // fill in position titles from gamma api
      const questionMap = await fetchQuestionsByConditions(conditionIds);
      if (!questionMap) {
        return res.status(200).json({
          type: "form",
          title: "error",
          url: `${DEPLOYMENT_URL}/error?code=500`,
        });
      }

      const finalPositions = positions.flat().map((p) => ({
        ...p,
        src: questionMap[p.conditionId].src,
        title: questionMap[p.conditionId].question,
      }));

      // store positions
      await insertPositions(finalPositions);

      res.status(200).json({
        type: "form",
        title: "pm-flex",
        url: `${DEPLOYMENT_URL}/?${generateProxiesQueryString(proxies)}`,
      });
    default:
      res.status(405).end();
  }
}
