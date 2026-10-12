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
    description: `all Normal Challenge restrictions are active at once, with the exception of the
      Budget Cuts (C10) and Sixth Sense (C12) Challenges.`,
    goal: new Decimal("1e380"),
    isQuickResettable: true,
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
      formatEffect: value => formatPow(value, 2, 2),
    },
    unlockAM: DC.E9000,
  },
  {
    id: 6,
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
    description: () =>
      `exponentially rising matter divides the multiplier on all of your Antimatter Dimensions
      once you have at least ${formatInt(1)} 2nd Antimatter Dimension.`,
    goal: DC.D2E22222,
    isQuickResettable: true,
    effect: () => Currency.matter.value.clampMin(1),
    formatEffect: value => `/${format(value, 1, 2)}`,
    reward: {
      description: "Infinity Dimension multiplier based on tickspeed",
      effect: () => Tickspeed.perSecond.pow(0.0005),
      formatEffect: value => formatX(value, 2, 2)
    },
    unlockAM: DC.E22500,
  },
  {
    id: 8,
    description: () => {
      // Copied from DimBoost.power; this is the base amount before any multipliers. Post-eternity this isn't
      // necessarily 2.5x by the time the player sees this challenge; it's probably most accurate to say what it
      // currently is, and this phrasing avoids 10x ➜ 10x with the old description.
      const mult = Effects.max(
        2,
        InfinityUpgrade.dimboostMult,
        InfinityChallenge(8).reward,
        TimeStudy(81)
      );
      return `you cannot buy Antimatter Galaxies. Base Dimension Boost multiplier is increased to a maximum
        of ${formatX(10)}. (Current base multiplier: ${formatX(mult, 2, 1)})`;
    },
    goal: DC.E10000,
    isQuickResettable: false,
    effect: 10,
    reward: {
      description: () => `Dimension Boost multiplier is increased to a minimum of ${formatX(4)}`,
      effect: 4
    },
    unlockAM: DC.E23000,
  },
  {
    id: 9,
    description: () =>
      `AD production rapidly and continually drops over time. Purchasing Antimatter Dimension or Tickspeed
        upgrades sets production back to ${formatPercents(1)} before it starts dropping again.`,
    goal: DC.E27000,
    isQuickResettable: true,
    effect: () => DC.D0_8446303389034288.pow(
      Decimal.max(0, player.records.thisInfinity.time.sub(player.records.thisInfinity.lastBuyTime))),
    reward: {
      description:
        "You get a multiplier to AD 2-7 based on 1st and 8th AD multipliers.",
      effect: () => AntimatterDimension(1).multiplier.times(AntimatterDimension(8).multiplier).pow(0.02),
      formatEffect: value => formatX(value, 2, 2)
    },
    unlockAM: DC.E28000,
  },
  {
    id: 10,
    description: "This Infinity Challenge has not been designed yet.",
    goal: DC.BEMAX,
    isQuickResettable: false,
    reward: {
      description: "Reserved for a future Infinity Challenge.",
    },
    unlockAM: DC.E30000,
  },
  {
    id: 11,
    description: "This Infinity Challenge has not been designed yet.",
    goal: DC.BEMAX,
    isQuickResettable: false,
    reward: {
      description: "Reserved for a future Infinity Challenge.",
    },
    unlockAM: DC.E32000,
  },
  {
    id: 12,
    description: "This Infinity Challenge has not been designed yet.",
    goal: DC.BEMAX,
    isQuickResettable: false,
    reward: {
      description: "Reserved for a future Infinity Challenge.",
    },
    unlockAM: DC.E34000,
  },
];
