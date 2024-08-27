import { AIRSTACK_URL } from "./constants";

const airstackKey = process.env.AIRSTACK_PROD_KEY;

export async function getAddressesFromFid(fid: string): Promise<string[]> {
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
