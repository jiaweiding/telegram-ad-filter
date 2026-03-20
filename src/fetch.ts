const BLACKLIST_URL = "https://raw.githubusercontent.com/jiaweiding/telegram-ad-filter/refs/heads/master/blacklist.json";

export async function fetchKeywordList(): Promise<string[]> {
  const response = await fetch(BLACKLIST_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch blacklist: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Blacklist must be a JSON array");
  }

  const keywords = data
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [...new Set(keywords)];
}
