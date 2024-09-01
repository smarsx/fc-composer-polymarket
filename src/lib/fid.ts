import { AIRSTACK_URL } from "./constants";

const airstackKey = process.env.AIRSTACK_PROD_KEY;

export async function getAddressesFromFid(fid: string): Promise<string[]> {
  if (!airstackKey || airstackKey == "") {
    throw Error(`failed to load AIRSTACK_PROD_KEY`);
  }

  const query = `
    query GetAddressesFromFid($identity: Identity!) {
      Socials(
        input: {
          filter: { identity: { _eq: $identity } }
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
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    // Assuming the structure of the response, extract and return the addresses
    return data.data.Socials.Social[0]?.userAssociatedAddresses || [];
  } catch (error) {
    console.error("Error fetching addresses:", error);
    throw error;
  }
}
