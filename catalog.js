const item = (id, name, price, type, description, color) => ({
  id,
  name,
  price,
  type,
  description,
  color,
});
export const BASE_JELLIES = [
  item("pink", "ピンク", 0, "jelly", "やさしいピンクの定番ゼリー。", 0),
  item("purple", "むらさき", 0, "jelly", "つやつやラベンダー。", 1),
  item("blue", "水色", 0, "jelly", "空のような水色ゼリー。", 2),
  item("yellow", "きいろ", 0, "jelly", "お日さまカラー。", 3),
  item("green", "ミント", 0, "jelly", "さわやかなミント色。", 4),
  item("orange", "オレンジ", 0, "jelly", "あたたかなオレンジ色。", 5),
];
export const JELLIES = [
  ...BASE_JELLIES,
  item(
    "strawberry",
    "いちごゼリー",
    100,
    "jelly",
    "いちごの種と赤いほっぺの、甘いピンク。",
    6,
  ),
  item(
    "pudding",
    "プリンゼリー",
    250,
    "jelly",
    "カスタードに、とろりカラメル。",
    7,
  ),
  item(
    "soda",
    "ソーダゼリー",
    300,
    "jelly",
    "水色のゼリーに、小さな泡がきらきら。",
    8,
  ),
  item(
    "grape",
    "ぶどうゼリー",
    350,
    "jelly",
    "小さなぶどうを閉じ込めた、つやつや紫。",
    9,
  ),
  item(
    "sakura",
    "さくらゼリー",
    500,
    "jelly",
    "淡い桜色に、ひらひら花びら。",
    10,
  ),
  item(
    "starlight",
    "星空ゼリー",
    800,
    "jelly",
    "青紫のグラデーションに小さなお星さま。",
    11,
  ),
  item(
    "rainbow",
    "レインボーゼリー",
    1200,
    "jelly",
    "パステルの虹を閉じ込めた特別なゼリー。",
    12,
  ),
];
export const ACCESSORIES = [
  ["pink-bow", "ピンクのリボン", 150],
  ["red-bow", "赤いリボン", 150],
  ["flower", "お花の髪飾り", 200],
  ["berry-hat", "いちごの帽子", 300],
  ["bunny", "うさぎの耳", 350],
  ["cat", "ねこの耳", 350],
  ["crown", "キラキラ王冠", 500],
  ["halo", "天使の輪", 600],
  ["wizard", "魔法使いの帽子", 700],
  ["rainbow-bow", "虹色のリボン", 800],
].map(([id, name, price]) =>
  item(
    id,
    name,
    price,
    "accessory",
    "頭の上に、ちいさなときめきを。見た目だけのおしゃれです。",
  ),
);
export const BACKGROUNDS = [
  item(
    "default",
    "スイーツショップ",
    0,
    "background",
    "いつものピンクのお菓子屋さん。",
  ),
  ...[
    [
      "candy",
      "お菓子の国",
      300,
      "キャンディー、クッキー、マカロンのパステルの国。",
    ],
    [
      "berry-castle",
      "いちごのお城",
      500,
      "リボンとハートに包まれた、いちご色のお城。",
    ],
    ["clouds", "ふわふわ雲の国", 600, "水色の空を、虹と雲でおさんぽ。"],
    ["flowers", "お花畑", 700, "ちょうちょが遊ぶ、やさしい光のお花畑。"],
    ["night", "星空の世界", 800, "紫と紺の空に、月と星がきらめく夜。"],
    ["ocean", "海の中", 1000, "泡、貝殻、かわいい魚のパステルブルー。"],
    ["magic", "魔法のお城", 1500, "魔法の光が降りそそぐ、夢のようなお城。"],
  ].map(([id, name, price, description]) =>
    item(id, name, price, "background", description),
  ),
];
export const ITEMS = [...JELLIES, ...ACCESSORIES, ...BACKGROUNDS];
export const BY_ID = Object.fromEntries(ITEMS.map((x) => [x.id, x]));
export const FREE = ITEMS.filter((x) => x.price === 0).map((x) => x.id);
export const FIRST_MISSIONS = [
  ...[
    [3, 30],
    [5, 50],
    [10, 100],
    [15, 200],
    [20, 400],
  ].map(([goal, reward]) => ({
    id: `stack-${goal}`,
    name: goal === 3 ? "ゼリーを初めて3個積む" : `1回のプレイで${goal}個積む`,
    metric: "best",
    goal,
    reward,
  })),
  {
    id: "total-50",
    name: "累計50個積む",
    metric: "stacks",
    goal: 50,
    reward: 200,
  },
  {
    id: "total-100",
    name: "累計100個積む",
    metric: "stacks",
    goal: 100,
    reward: 500,
  },
  {
    id: "first-buy",
    name: "初めてショップで購入する",
    metric: "purchases",
    goal: 1,
    reward: 100,
  },
  {
    id: "first-dress",
    name: "初めて着せ替えする",
    metric: "dresses",
    goal: 1,
    reward: 50,
  },
  {
    id: "first-background",
    name: "初めて背景を変更する",
    metric: "backgrounds",
    goal: 1,
    reward: 50,
  },
];
export const DAILY_MISSIONS = [
  {
    id: "daily-10",
    name: "今日ゼリーを合計10個積む",
    metric: "stacks",
    goal: 10,
    reward: 30,
  },
  {
    id: "daily-30",
    name: "今日ゼリーを合計30個積む",
    metric: "stacks",
    goal: 30,
    reward: 80,
  },
  {
    id: "daily-plays",
    name: "今日3回プレイする",
    metric: "plays",
    goal: 3,
    reward: 50,
  },
  {
    id: "daily-best",
    name: "今日1回で10個積む",
    metric: "best",
    goal: 10,
    reward: 100,
  },
  {
    id: "daily-all",
    name: "今日すべてのデイリーを達成する",
    metric: "all",
    goal: 4,
    reward: 150,
  },
];
