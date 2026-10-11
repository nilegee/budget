/** Icon keys live apart from the drawings so pure logic can pick them without touching JSX. */
export const CATEGORY_ICONS = [
  "bike", "dining", "cart", "car", "fuel", "bulb", "home", "book", "pulse", "film",
  "bag", "repeat", "plane", "gift", "grid", "coffee", "paw", "phone", "dumbbell", "scissors"
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

const BY_NAME: [RegExp, CategoryIcon][] = [
  [/deliver|talabat|noon food|careem food/i, "bike"],
  [/restaurant|dining|eat out|cafe|brunch/i, "dining"],
  [/coffee|starbucks|tea/i, "coffee"],
  [/grocer|supermarket|food/i, "cart"],
  [/transport|taxi|uber|salik|parking|metro|bus|car\b/i, "car"],
  [/fuel|petrol|gas/i, "fuel"],
  [/utilit|dewa|electric|water|internet|bill/i, "bulb"],
  [/rent|mortgage|home|house/i, "home"],
  [/school|kid|edu|tuition|book/i, "book"],
  [/health|doctor|pharm|clinic|medical/i, "pulse"],
  [/entertain|cinema|movie|game|fun/i, "film"],
  [/shop|cloth|fashion/i, "bag"],
  [/subscr|netflix|spotify|member/i, "repeat"],
  [/travel|flight|hotel|trip|holiday/i, "plane"],
  [/gift|donat|charity|zakat|sadaqa/i, "gift"],
  [/pet|vet/i, "paw"],
  [/phone|mobile|telecom/i, "phone"],
  [/gym|fitness|sport/i, "dumbbell"],
  [/salon|hair|barber|beauty/i, "scissors"]
];

export const iconForName = (name: string): CategoryIcon => BY_NAME.find(([re]) => re.test(name))?.[1] ?? "grid";

const EMOJI_MAP: Record<string, CategoryIcon> = {
  "🛵": "bike", "🍽️": "dining", "🛒": "cart", "🚕": "car", "⛽": "fuel", "💡": "bulb", "🏠": "home", "🎒": "book",
  "🩺": "pulse", "🎬": "film", "🛍️": "bag", "🔁": "repeat", "✈️": "plane", "🎁": "gift", "🧩": "grid", "☕": "coffee",
  "🐾": "paw", "📱": "phone", "🏋️": "dumbbell", "💇": "scissors"
};
export const iconFromEmoji = (e?: string): CategoryIcon | undefined => (e ? EMOJI_MAP[e] : undefined);
