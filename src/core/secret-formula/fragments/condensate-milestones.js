import { DC } from "../../constants";

export function galacticThresholdDelay(level) {
  const triangular = level.times(level.add(1)).div(2);
  return triangular.times(triangular);
}

export const condensateRepeatMilestones = [
  {
    id: "fragmentEfficiency",
    title: "Refined Translation",
    description: level => {
      const preTranslation = format(Decimal.pow(level.add(1), 2), 2, 2);
      const translated = format(level.times(0.1).add(1), 3, 3);
      return `Fragment gain x${preTranslation} before Translation; translated gain ^${translated}.`;
    }
  },
  {
    id: "condensationFormula",
    base: 5,
    title: "Condensation Theory",
    description: level => {
      // The divisor stops at 64, so this is always safe to render as a Number.
      const reduction = level.clampMax(31).times(64).toNumber();
      return `Condensate divisor: /${formatInt(2048 - reduction)}.`;
    }
  },
  {
    id: "rgScalingStart",
    base: 16,
    title: "Galactic Threshold",
    description: level => `Replicanti Galaxy scaling starts ${formatInt(galacticThresholdDelay(level))} later.`
  },
];

// Each row groups the single-purchase upgrades which affect the same system.
// This lets new Drains add their own row without changing the grid's column count.
export const condensateMilestoneRows = [
  [
    {
      id: "antimatterResonance",
      title: "Antimatter Resonance",
      requirement: new Decimal(512),
      isImplemented: true,
      description: "Time Study 101 uses Effective Replicanti."
    },
    {
      id: "infiniteResonance",
      title: "Infinite Resonance",
      requirement: new Decimal(8192),
      isImplemented: true,
      description: "Time Study 21 uses Effective Replicanti."
    },
    {
      id: "temporalConstellation",
      title: "Temporal Constellation",
      requirement: new Decimal(1e5),
      isImplemented: true,
      description: "Time Study 103's Replicanti Galaxies are strengthened by Galaxy power."
    }
  ],
  [
    {
      id: "preserveStabilizeDecay",
      title: "Decay Anchor",
      requirement: DC.D3,
      isImplemented: true,
      description: "Retain Stabilize Decay progress when condensing."
    },
    {
      id: "allDrainChance",
      title: "Convergent Chance",
      requirement: new Decimal(75),
      isImplemented: true,
      description: "Stabilize Decay's Replicanti Chance uses all Drain progress."
    },
    {
      id: "decayDuration",
      title: "Lingering Decay",
      requirement: new Decimal(200),
      isImplemented: true,
      description: "Fragment Decay lasts 5 times longer."
    }
  ],
  [
    {
      id: "preservePowerThroughTime",
      title: "Power Anchor",
      requirement: new Decimal(128),
      isImplemented: true,
      description: "Retain Power Through Time progress when condensing."
    },
    {
      id: "allDrainPower",
      title: "Convergent Power",
      requirement: new Decimal(256),
      isImplemented: true,
      description: "Power Through Time's Infinity Dimension purchase-cap effect uses all Drain progress."
    },
    {
      id: "improveTickspeedTransfer",
      title: "Temporal Conduction",
      requirement: new Decimal(2048),
      isImplemented: true,
      description: "Power Through Time's Tickspeed transfer uses log base 4."
    }
  ],
  [
    {
      id: "preserveThirdDrain",
      title: "Eternity Anchor",
      requirement: new Decimal(1000),
      isImplemented: true,
      description: "Retain third Drain progress when condensing."
    },
    {
      id: "allDrainEternity",
      title: "Convergent Eternity",
      requirement: new Decimal(10000),
      isImplemented: true,
      description: "Third Drain's 40% and 75% rewards use all Drain progress."
    },
    {
      id: "autoFragments",
      title: "Fragment Automation",
      requirement: new Decimal(1e6),
      isImplemented: true,
      description: "Automatically gain 1% of current Big Crunch Fragment gain per second."
    }
  ]
];

const repeatMilestoneById = id => condensateRepeatMilestones.find(milestone => milestone.id === id);
const milestoneById = id => condensateMilestoneRows.flat().find(milestone => milestone.id === id);
const refinedTranslationLevelCache = [];

function refinedTranslationRequirement(level) {
  if (level.lte(1)) return DC.D1;
  if (level.lte(14)) {
    // Exact integer multiplication avoids pow's rounding at the early thresholds.
    let requirement = DC.D1;
    for (let i = 1; i < level.toNumber(); i++) requirement = requirement.times(level);
    return requirement;
  }
  return level.pow(level.sub(1));
}

function refinedTranslationLevel(total) {
  if (total.lt(1)) return DC.D0;
  if (total.lt(2)) return DC.D1;
  const cached = refinedTranslationLevelCache.find(entry => entry.total.eq(total));
  if (cached) return cached.level;
  const target = total.ln();
  let level = target.div(target.ln().clampMin(1)).add(1).clampMin(2);
  // Solve (level - 1) * ln(level) = ln(total), then check integer thresholds.
  for (let i = 0; i < 12; i++) {
    const logLevel = level.ln();
    const step = level.sub(1).times(logLevel).sub(target)
      .div(logLevel.add(1).sub(DC.D1.div(level)));
    level = level.sub(step).clampMin(2);
  }
  level = level.floor();
  if (refinedTranslationRequirement(level).gt(total)) level = level.sub(1);
  if (refinedTranslationRequirement(level.add(1)).lte(total)) level = level.add(1);
  refinedTranslationLevelCache.unshift({ total: new Decimal(total), level });
  if (refinedTranslationLevelCache.length > 3) refinedTranslationLevelCache.pop();
  return level;
}

export function condensateRepeatMilestoneLevel(id, total) {
  const milestone = repeatMilestoneById(id);
  if (!milestone || total.lt(1)) return DC.D0;
  if (id === "fragmentEfficiency") return refinedTranslationLevel(total);
  const level = total.log10().div(Math.log10(milestone.base)).floor();
  return milestone.startsAtOne ? level.add(1) : level;
}

export function condensateRepeatMilestoneNextRequirement(id, level) {
  const milestone = repeatMilestoneById(id);
  if (id === "fragmentEfficiency") return refinedTranslationRequirement(level.add(1));
  return Decimal.pow(milestone.base, milestone.startsAtOne ? level : level.add(1));
}

export function hasCondensateMilestone(id, total) {
  const milestone = milestoneById(id);
  return milestone?.requirement ? total.gte(milestone.requirement) : false;
}
