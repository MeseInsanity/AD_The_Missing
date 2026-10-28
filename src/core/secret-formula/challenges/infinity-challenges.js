import { DC } from "../../constants";

// First accelerated natural-run probe for IC5's reverse Galaxy ladder. The
// rounded requirements make the widening late-phase intervals readable while
// the frontier-based Dimension Boost rule supplies within-phase acceleration.
export const ic5GalaxyRequirements = [
  { tier: 8, amount: new Decimal(1010) },
  { tier: 7, amount: new Decimal("1e480") },
  { tier: 6, amount: new Decimal("1e980") },
  { tier: 5, amount: new Decimal("1e1530") },
  { tier: 4, amount: new Decimal("1e2140") },
  { tier: 3, amount: new Decimal("1e2800") },
  { tier: 2, amount: new Decimal("1e3540") },
  { tier: 1, amount: new Decimal("1e4370") },
  { tier: 1, amount: new Decimal("1e4510") },
];

export const infinityChallenges = [
  {
    id: 1,
    name: "Mixed Up Wall",
    description: `all Normal Challenge restrictions are active at once, with the exception of the
      Budget Cuts (C10) and Sixth Sense (C12) Challenges.`,
    goal: new Decimal("1e380"),
    isQuickResettable: false,
    reward: {
      description: () => `All Infinity Dimensions ${formatX(1.3, 1, 1)}/IC; 1st ID Buy 10 +${format(1.25, 2, 2)}/IC.`,
      effect: () => Math.pow(1.3, InfinityChallenges.completed.length),
      formatEffect: value => {
        const id1Buy10 = 5 + 1.25 * InfinityChallenges.completed.length;
        return `${formatX(value, 1, 1)} / ${formatX(id1Buy10, 2, 2)}`;
      }
    },
    unlockAM: DC.E1000,
  },
  {
    id: 2,
    name: "Pleasure the Gods",
    description: "You can buy only 1 Antimatter Galaxy, but Dimensional Sacrifice uses its improved formula.",
    goal: new Decimal("1e1050"),
    isQuickResettable: false,
    reward: {
      description: () => `Stronger Dimensional Sacrifice
        ${Sacrifice.getSacrificeDescription({ "InfinityChallenge2isCompleted": false })} ➜
        ${Sacrifice.getSacrificeDescription({ "InfinityChallenge2isCompleted": true })}`,
    },
    unlockAM: new Decimal("1e1350"),
  },
  {
    id: 3,
    name: "Blooming Galaxy",
    description: "All Antimatter Dimension multipliers other than Infinity Power and Dimensional Sacrifice are disabled. Antimatter Galaxy requirements are reduced.",
    // Trial goal: compare the long-run clear time with and without the third ID5 purchase.
    goal: new Decimal("3.33e3333"),
    isQuickResettable: false,
    effect: 0,
    reward: {
      description: "Antimatter Galaxy base cost scaling is reduced by 5.",
      effect: 5,
    },
    unlockAM: DC.E4500,
  },
  {
    id: 4,
    name: "Boosting Momentum",
    description: "Tickspeed upgrades have stronger diminishing returns. Each Dimension Boost gained during this\n      Infinity Challenge restores their strength. Galaxy Bulk is disabled.",
    goal: new Decimal("1e3500"),
    isQuickResettable: false,
    effect: DC.D1,
    reward: {
      description: "Gain Free Tickspeed based on current Dimension Boosts and Purchased Tickspeed.",
      effect: () => Decimal.min(64, DimBoost.purchasedBoosts.div(4))
        .times(Decimal.log2(player.totalTickBought.max(2))).sqrt().floor(),
      formatEffect: value => `${formatInt(value)} Free Tickspeed`,
    },
    unlockAM: new Decimal("6.66e6666"),
  },
  {
    id: 5,
    name: "Descending Ladder",
    description: () =>
      `start with only the 8th AD. Each Antimatter Galaxy unlocks one lower Antimatter Dimension.
      Locked Dimensions can produce but cannot be purchased.
      Tickspeed is always available.
      Dimension Boosts reset the current phase but do not change unlocked Dimensions.`,
    goal: new Decimal("1e5300"),
    isQuickResettable: false,
    effect: DC.D0_1,
    reward: {
      description: "2nd through 8th Antimatter Dimension multipliers are raised to",
      effect: 1.05,
      formatEffect: value => ` ${formatPow(value, 2, 2)}`,
      noLabel: true,
      inlineEffect: true,
    },
    unlockAM: DC.E9000,
  },
  {
    id: 6,
    name: "Buyer's Remorse",
    description:
      `buying Antimatter Dimensions 1-4 causes all cheaper AD costs to increase.
      Buying Antimatter Dimensions 5-8 causes all more expensive AD costs to increase.`,
    goal: DC.E10500,
    isQuickResettable: true,
    reward: {
      description: () =>
        `All Galaxies are ${formatPercents(0.0666, 2)} stronger and reduce the requirements for them
        and Dimension Boosts by ${formatInt(1)}`,
      effect: 1.0666
    },
    unlockAM: new Decimal("1e11111"),
  },
  {
    id: 7,
    name: "Galaxy Brain",
    description: () =>
      `Tickspeed purchases are fixed at ${formatX(1.08)}. Galaxies do not affect Tickspeed;
      instead, each Galaxy increases Dimension Boost power by +${format(0.5, 1, 1)}.`,
    goal: new Decimal("1e6500"),
    isQuickResettable: false,
    showCurrentEffect: false,
    effect: () => DC.D1.add(player.galaxies.times(0.5)),
    formatEffect: value => formatX(value, 2, 2),
    reward: {
      description: () => `Dimension Boost multiplier is increased to a minimum of ${formatX(4)}`,
      effect: 4
    },
    unlockAM: new Decimal("1e15000"),
  },
  {
    id: 8,
    name: "Race Against Time",
    description: "All Antimatter Dimension production rapidly and permanently decays over time.",
    goal: new Decimal("1e18500"),
    isQuickResettable: false,
    showCurrentEffect: false,
    effect: () => {
      const elapsedSeconds = Decimal.max(player.records.thisInfinity.time.div(1000), DC.D1);
      return DC.D1.div(elapsedSeconds.pow(elapsedSeconds.pow(2)));
    },
    formatEffect: value => formatX(value, 2, 2),
    reward: {
      description: "ID purchases grant their matching AD virtual Buy 10s, scaled by Infinity Power conversion."
    },
    unlockAM: new Decimal("1e19000"),
  },
  {
    id: 9,
    name: "The Matter of Balance",
    description: "Matter and Antimatter oppose each other. Balance both resources, then Annihilate them for Galaxies.",
    goal: new Decimal("1e7100"),
    isQuickResettable: false,
    showCurrentEffect: false,
    reward: {
      description: "Unlock Replicanti for free."
    },
    unlockAM: new Decimal("1e25000"),
  },
  {
    id: 10,
    name: "No Antimatter What",
    description: "Antimatter never accumulates. Antimatter Dimensions cost Infinity Power. Present Power affects all\n      Infinity Dimensions.",
    goal: new Decimal("2.22e22222"),
    isQuickResettable: false,
    reward: {
      description: "Unlock the 7th Infinity Dimension.",
    },
    unlockAM: DC.E45000,
  },
  {
    id: 11,
    name: "The Product of Chance",
    description: `ADs self-produce between Replicates. Each Replicate multiplies active AD outputs, weighted by
      Replicate Chance, into AM. The ID Replicanti multiplier instead applies to ADs as ^8; IDs are disabled.`,
    goal: new Decimal("1e6420"),
    isQuickResettable: false,
    reward: {
      description: "Replicanti is 3.5x faster before its growth slowdown, and 2x faster afterward.",
      effect: () => (Replicanti.amount.lt(Decimal.pow(2, 1024)) ? 3.5 : 2),
      formatEffect: value => formatX(value, 2, 2),
      hideEffect: true,
    },
    unlockAM: new Decimal("8e62588"),
  },
  {
    id: 12,
    name: "Back to Basics",
    description: `All multipliers except Buy 10, Dimension Boost, Sacrifice, and base Galaxy effects are ^0.05.`,
    goal: new Decimal("1e6200"),
    isQuickResettable: false,
    reward: {
      description: "Buy 10, Dimension Boost, Sacrifice, and Galaxy effects are ^1.01.",
      effect: 1.01,
      formatEffect: value => `^${format(value, 2, 2)}`,
      hideEffect: true,
    },
    unlockAM: DC.E100000,
  },
];
