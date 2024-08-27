import { GAMMA_BASE_URL } from "./constants";

export async function fetchQuestionsByConditions(
  conditionIds: string[]
): Promise<Record<string, { question: string; src: string }>> {
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
    const questionMap: Record<string, { question: string; src: string }> = {};
    data.markets.forEach((market: any) => {
      questionMap[market.id] = {
        question: market.question,
        src: market.image,
      };
    });

    return questionMap;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
}
