import { DC } from "../../constants";

const NC10_PURCHASE_LIMIT = 9000;

// I tried to make it relatively simple to add more locks; the idea is that you give it a value here
// and then it's all handled in the backend
// If you need to lock a challenge, set lockedAt to a new Decimal variable reflective of a desired number of Infinities
// They will always be unlocked post-eternity

export const normalChallenges = [
  {
    id: 1,
    legacyId: 1,
    title: "Hello, Infinity",
    isQuickResettable: false,
    description() {
      return PlayerProgress.eternityUnlocked()
        ? "reach Infinity for the first time outside of a challenge."
        : "reach Infinity for the first time.";
    },
    name: "1st Antimatter Dimension Autobuyer",
    reward: "Upgradeable 1st Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 2,
    legacyId: 2,
    title: "Ticking Point",
    isQuickResettable: false,
    description: "Tickspeed strengthens 1st AD, but disables other Buy 10 multipliers.",
    name: "2nd Antimatter Dimension Autobuyer",
    reward: "Upgradeable 2nd Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 3,
    legacyId: 3,
    title: "Recursive Growth",
    isQuickResettable: false,
    description: "Dimension Boosts are getting weaker, but each AD purchase strengthens its own Buy 10 multiplier.",
    name: "3rd Antimatter Dimension Autobuyer",
    reward: "Upgradeable 3rd Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 4,
    legacyId: 8,
    title: "Heavy Lifting",
    isQuickResettable: false,
    description: "Tickspeed is much weaker, but Dimension Boosts are stronger.",
    name: "4th Antimatter Dimension Autobuyer",
    reward: "Upgradeable 4th Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 5,
    legacyId: 6,
    title: "Sacrificial Cycle",
    isQuickResettable: false,
    description: "ADs weaken as they grow. Sacrifice briefly restores their power.",
    name: "5th Antimatter Dimension Autobuyer",
    reward: "Upgradeable 5th Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 6,
    legacyId: 10,
    title: "Purchase Pressure",
    isQuickResettable: false,
    description: "Any purchases give a penalty to Tickspeed, which decays over time.",
    name: "6th Antimatter Dimension Autobuyer",
    reward: "Upgradeable 6th Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 7,
    legacyId: 9,
    title: "Last One Standing",
    isQuickResettable: false,
    description: "Tickspeed weakens Buy 10 multipliers, except for the last purchased AD.",
    name: "7th Antimatter Dimension Autobuyer",
    reward: "Upgradeable 7th Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 8,
    legacyId: 11,
    title: "Brute Force",
    isQuickResettable: false,
    description: "Galaxies are disabled. Buy 10 and Dimension Boost multipliers are weakened.",
    name: "8th Antimatter Dimension Autobuyer",
    reward: "Upgradeable 8th Antimatter Dimension Autobuyer",
    lockedAt: DC.D0,
  },
  {
    id: 9,
    legacyId: 5,
    title: "Supply Chain",
    isQuickResettable: true,
    description: "ADs, except 1st AD, cost the previous tier. Antimatter never accumulates. Sacrifice reduces 8th AD costs, while lower-tier purchases empower the tier above.",
    name: "Tickspeed Autobuyer",
    reward: "Upgradeable Tickspeed Autobuyer",
    lockedAt: DC.D8,
  },
  {
    id: 10,
    legacyId: 4,
    title: "Budget Cuts",
    isQuickResettable: false,
    description: () => NC10_PURCHASE_LIMIT === null
      ? "AD and Tickspeed purchases are unrestricted."
      : `AD and Tickspeed purchases are limited to ${formatInt(NC10_PURCHASE_LIMIT)} total.`,
    purchaseLimit: NC10_PURCHASE_LIMIT,
    name: "Automated Dimension Boosts",
    reward: "Dimension Boosts Autobuyer",
    lockedAt: DC.D8,
  },
  {
    id: 11,
    legacyId: 12,
    title: "Matter Resistance",
    isQuickResettable: true,
    description: "2nd ADs produce Matter, which grows faster over time and weakens all ADs. Each annihilation permanently reduces this penalty.",
    name: "Automated Antimatter Galaxies",
    reward: "Antimatter Galaxies Autobuyer",
    lockedAt: DC.D8,
  },
  {
    id: 12,
    legacyId: 7,
    title: "Sixth Sense",
    isQuickResettable: false,
    description: () => `there are only ${formatInt(6)} ADs. Dimension Boost ` +
      "and Antimatter Galaxy costs are modified.",
    name: "Automated Big Crunches",
    reward: "Big Crunches Autobuyer",
    lockedAt: DC.D8,
  }
];
