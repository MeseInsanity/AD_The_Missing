import { DC } from "../../constants";

export const eternityUpgrades = {
  idMultEP: {
    id: 1,
    cost: 5,
    name: "Eternal Capital",
    description: () => `Infinity Dimension multiplier based on unspent Eternity Points (x+${formatInt(1)})`,
    effect: () => Currency.eternityPoints.value.plus(1),
    formatEffect: value => formatX(value, 2, 1)
  },
  idMultEternities: {
    id: 2,
    cost: 10,
    name: "Endless Recurrence",
    description: () => `Infinity Dimension multiplier based on Eternities
      ((x/${formatInt(200)})^log4(${formatInt(2)}x), softcap at ${format(1e5)} Eternities)`,
    effect() {
      const log4 = Math.log(4);
      const eterPreCap = Currency.eternities.value.min(1e5);
      const base = eterPreCap.div(200).add(1);
      const pow = Decimal.ln(eterPreCap.mul(2).add(1)).div(log4);
      const multPreCap = Decimal.pow(base, pow);
      const eterPostCap = Currency.eternities.value.sub(1e5).max(1);
      const mult1 = eterPostCap.divide(200).plus(1);
      const mult2 = eterPostCap.times(2).plus(1).ln().div(log4);
      const multPostCap = mult1.times(mult2).clampMin(1);
      return multPostCap.times(multPreCap);
    },
    formatEffect: value => formatX(value, 2, 1)
  },
  idMultICRecords: {
    id: 3,
    cost: 5e4,
    name: "Challenge Legacy",
    description: "Infinity Dimension multiplier based on sum of Infinity Challenge times",
    // The cap limits this at a lower value, but we also need an explicit cap here because very old versions have
    // allowed EC12 to make all the challenge records sum to zero (causing a division by zero here)
    effect: () => DC.D2.pow(DC.E1.mul(3).div(Decimal.clampMin(Time.infinityChallengeSum.totalSeconds, 0.1))),
    cap: DC.D2P30D0_61,
    formatEffect: value => formatX(value, 2, 1)
  },
  tdMultAchs: {
    id: 4,
    cost: 1e16,
    name: "Achievement Affinity",
    description: "Your Achievement bonus affects Time Dimensions",
    effect: () => Achievements.power,
    formatEffect: value => formatX(value, 2, 1)
  },
  tdMultTheorems: {
    id: 5,
    cost: 1e40,
    name: "Theorem of Time",
    description: "Time Dimensions are multiplied by your unspent Time Theorems",
    effect: () => Decimal.max(Currency.timeTheorems.value, 1),
    formatEffect: value => formatX(value, 2, 1)
  },
  tdMultRealTime: {
    id: 6,
    cost: 1e50,
    name: "Time Well Spent",
    description: () => (Pelle.isDoomed
      ? "Time Dimensions are multiplied by days played in this Armageddon"
      : "Time Dimensions are multiplied by days played"
    ),
    effect: () => (Pelle.isDoomed ? Time.thisReality.totalDays.add(1) : Decimal.max(Time.totalTimePlayed.totalDays, 1)),
    formatEffect: value => formatX(value, 2, 1)
  },
  currentRunFormula: {
    id: 7,
    cost: 100,
    name: "Present Momentum",
    description: "Improve Current Run Infinity Upgrade formulas",
    hideEffect: true
  },
  costScaling: {
    id: 8,
    cost: 1e3,
    name: "Delayed Escalation",
    description: "Delay Antimatter Dimension and Tickspeed cost scaling based on Eternities",
    effect: () => Currency.eternities.value.max(1).log2().pow(2),
    formatEffect: value => `from e${formatInt(value.add(308).floor())}`
  },
  theoremSacrifice: {
    id: 9,
    cost: 1e4,
    name: "Theorem of Sacrifice",
    description: "Sacrificed 1st ADs are boosted by unspent Time Theorems",
    effect: () => Currency.timeTheorems.value.add(1).pow(8),
    formatEffect: value => formatX(value, 2, 1),
    hideEffect: true
  },
  breakUpgradeFormula: {
    id: 10,
    cost: 1e8,
    name: "Breakthrough Refinement",
    description: "Improve Break Infinity Upgrade formulas",
    hideEffect: true
  },
  achievementDimBoost: {
    id: 11,
    cost: 1e12,
    name: "Earned Momentum",
    description: "Achievement Bonus adds to the Dimension Boost power with greatly reduced effect",
    effect: () => Achievements.power.log2().max(1).log2(),
    hideEffect: true
  },
  replicantiChance: {
    id: 12,
    cost: 1e24,
    name: "Patient Replication",
    description: "Replicanti Chance increases by 100% per hour spent this Eternity",
    effect: () => Time.thisEternity.totalSeconds.div(3600),
    hideEffect: true
  }
};
