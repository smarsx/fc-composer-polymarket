const positiveEmojis: string[] = ["😎", "👍", "🎉", "🥳"];
const negativeEmojis: string[] = [
  "😢",
  "😞",
  "😔",
  "😠",
  "😡",
  "😭",
  "😩",
  "😰",
  "👎",
  "🤡",
  "💀",
  "💩",
];

export function getRandomPositiveEmoji(): string {
  return positiveEmojis[Math.floor(Math.random() * positiveEmojis.length)];
}

export function getRandomNegativeEmoji(): string {
  return negativeEmojis[Math.floor(Math.random() * negativeEmojis.length)];
}
