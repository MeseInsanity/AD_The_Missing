import { DC } from "../../constants";

const PEAK_PERFORMANCE_SACRIFICE_DRAIN_RATE = new Decimal(0.25);
const PEAK_PERFORMANCE_ID4_REFLOW_RATE = new Decimal(0.25);

function rebuyable(config) {
  const effectFunction = config.effect || (x => x);
  const { id, maxUpgrades, name, description, isDisabled, noLabel, onPurchased } = config;
  return {
    rebuyable: true,
    id,
    name,
    cost: () => config.initialCost.mul(Decimal.pow(config.costIncrease, player.infinityRebuyables[config.id])),
    maxUpgrades,
    description,
    effect: () => effectFunction(player.infinityRebuyables[config.id]),
    isDisabled,
    // There isn't enough room in the button to fit the EC reduction and "Next:" at the same time while still
    // presenting all the information in an understandable way, so we only show it if the upgrade is maxed
    formatEffect: config.formatEffect ||
      (value => {
        const afterECText = config.afterEC ? config.afterEC() : "";
        return value.gte(config.maxUpgrades)
          ? `Currently: ${formatX(DC.E1.sub(value))} ${afterECText}`
          : `Currently: ${formatX(DC.E1.sub(value))} | Next: ${formatX(DC.E1.sub(value).sub(1))}`;
      }),
    formatCost: value => format(value, 2, 0),
    noLabel,
    onPurchased
  };
}

function nyi(description, cost = DC.D0, showCost = false) {
  return {
    cost,
    description,
    isNYI: true,
    showNYICost: showCost,
    isAvailableForPurchase: () => false,
    hideEffect: true
  };
}

function infinityIPMultiplier() {
  const progress = Currency.infinitiesTotal.value.max(1).log10().div(Math.log10(2e6));
  if (progress.lte(1)) return Decimal.pow10(progress.times(4));
  const postSoftcapExponent = 4 + 2 * (1 - Math.exp(-2 * progress.sub(1).toNumber()));
  return Decimal.pow10(postSoftcapExponent);
}

export const breakInfinityUpgrades = {
  totalAMMult: {
    id: "totalMult",
    cost: DC.E4,
    name: "Mass Memory",
    description: "Antimatter Dimensions gain a multiplier based on total antimatter produced",
    effect: () => Decimal.pow(player.records.totalAntimatter.max(1).log10().add(1), 0.5),
    formatEffect: value => formatX(value, 2, 2)
  },
  currentAMMult: {
    id: "currentMult",
    cost: DC.E4.mul(5),
    name: "Present Power",
    description: "1st Antimatter Dimension gains a multiplier based on current antimatter",
    effect: () => Decimal.pow(Currency.antimatter.value.max(1).log10().add(1), 3.5),
    formatEffect: value => formatX(value, 2, 2)
  },
  averageAMMult: {
    id: "averageAMMult",
    cost: DC.E5,
    name: "Average Ate",
    description: "8th Antimatter Dimension gains a multiplier based on this Infinity's average antimatter production",
    effect: () => {
      const total = player.records.thisInfinity.totalAntimatter ?? DC.D0;
      const average = total.div(Time.thisInfinity.totalSeconds.max(1));
      return Decimal.pow(average.max(1).log10().add(1), 2.25);
    },
    formatEffect: value => formatX(value, 2, 2)
  },
  bestAMTickspeed: {
    id: "bestAMTickspeed",
    cost: DC.E6,
    name: "Peak Pace",
    description: "Gain free Tickspeed based on your best antimatter from past Infinities",
    effect: () => {
      const bestAM = (player.records.bestInfinity.maxAM ?? DC.D0).max(1);
      const rawTickspeed = bestAM.log10().div(Decimal.log10(Decimal.pow(2, 256)));
      const softcapped = rawTickspeed.lte(308)
        ? rawTickspeed
        : new Decimal(308).times(rawTickspeed.div(308).sqrt());
      return Decimal.floor(softcapped);
    },
    formatEffect: value => `${formatInt(value)} free Tickspeed`
  },
  previousAMSacrifice: {
    id: "previousAMSacrifice",
    cost: DC.E10,
    name: "Back 2 Back",
    description: "Sacrificed Dimensions are strengthened based on antimatter from your previous Infinity",
    effect: () => Decimal.pow((player.records.bestInfinity.lastAM ?? DC.D0).max(1).log10().add(1), 24),
    formatEffect: value => formatX(value, 2, 2),
    hideEffect: true
  },
  galaxyBoost: {
    id: "postGalaxy",
    cost: new Decimal("6.66e13"),
    formatCost: () => "6.66e13",
    name: "Galaxy Glitch",
    scrambleName: true,
    description: "All Galaxies are 66.6% stronger.",
    effect: 5 / 3
  },
  infinitiedMult: {
    id: "infinitiedMult",
    cost: new Decimal("5e9"),
    name: "Infinite Impact",
    description: "1st Infinity Dimension gains a multiplier based on total Infinities",
    effect: () => {
      const infinities = Currency.infinitiesTotal.value.max(1);
      const exponent = Math.min(infinities.log10().toNumber() / 4, 1) * 0.75;
      return infinities.pow(exponent);
    },
    formatEffect: value => formatX(value, 2, 2)
  },
  achievementMult: {
    id: "achievementMult",
    cost: new Decimal("5e7"),
    name: "Achievement Affinity",
    description: "Infinity Dimensions gain an Achievement-based multiplier which diminishes by tier",
    effect: () => Math.max(Math.pow((Achievements.effectiveCount - 30), 3) / 40, 1),
    hideEffect: true
  },
  slowestChallengeMult: {
    id: "challengeMult",
    cost: new Decimal("2e11"),
    name: "Challenge Chronometer",
    description: "2nd Infinity Dimension gains a multiplier based on total NC completion time",
    effect: () => Decimal.clampMin(
      new Decimal(500).div(Time.challengeSum.totalMinutes).sub(1).div(10).add(1),
      1
    ),
    formatEffect: value => formatX(value, 2, 2),
    hasCap: true,
    cap: new Decimal(3e3)
  },
  infinityTimeIDMult: {
    id: "infinityTimeIDMult",
    cost: DC.E15,
    name: "Temporal Tenacity",
    description: "3rd Infinity Dimension gains a rapidly increasing multiplier based on this Infinity's time",
    effect: () => {
      const seconds = Time.thisInfinity.totalSeconds;
      const halfHour = 30 * 60;
      if (seconds.lte(halfHour)) return seconds.times(0.05).add(1);
      if (seconds.lte(2 * 60 * 60)) {
        const elapsed = seconds.sub(halfHour);
        const secondStage = Decimal.min(elapsed, halfHour);
        const thirdStage = Decimal.min(elapsed.sub(halfHour).max(0), halfHour);
        const fourthStage = elapsed.sub(2 * halfHour).max(0);
        return new Decimal(91).add(secondStage.times(0.04)).add(thirdStage.times(0.03)).add(fourthStage.times(0.02));
      }
      const elapsed = seconds.sub(2 * 60 * 60);
      // This begins at x253 after two hours and reaches x2000 after a further six hours.
      const acceleration = 1315 / (6 * 60 * 60) ** 2;
      return new Decimal(253).add(elapsed.times(0.02)).add(elapsed.pow(2).times(acceleration));
    },
    formatEffect: value => formatX(value, 2, 2)
  },
  bestIPminAmp: {
    id: "bestIPminAmp",
    cost: DC.E20,
    name: "Peak Performance",
    description: "Divert Sacrifice power above ×1e10 from AD8 to ID4",
    // The accepted reflow moves equal logarithmic strength from AD8 to ID4.
    sacrificeDrainRate: PEAK_PERFORMANCE_SACRIFICE_DRAIN_RATE,
    id4ReflowRate: PEAK_PERFORMANCE_ID4_REFLOW_RATE,
    effect: PEAK_PERFORMANCE_ID4_REFLOW_RATE,
    formatEffect: () => `${formatPercents(PEAK_PERFORMANCE_SACRIFICE_DRAIN_RATE, 0)} diverted; ` +
      `${formatPercents(PEAK_PERFORMANCE_ID4_REFLOW_RATE, 0)} returned to ID4`
  },
  infinitiedGen: {
    id: "infinitiedGeneration",
    cost: new Decimal(2e7),
    name: "Infinite Inflow",
    description: "Passively generate Infinities based on your fastest Infinity",
    effect: () => player.records.bestInfinity.time,
    formatEffect: value => {
      if (value === Number.MAX_VALUE && !Pelle.isDoomed) return "No Infinity generation";
      let infinities = DC.D1;
      infinities = infinities.timesEffectsOf(
        RealityUpgrade(5),
        RealityUpgrade(7),
        Ra.unlocks.continuousTTBoost.effects.infinity
      );
      infinities = infinities.times(getAdjustedGlyphEffect("infinityinfmult"));
      const timeStr = Time.bestInfinity.totalMilliseconds.lte(50)
        ? `${TimeSpan.fromMilliseconds(new Decimal(100)).toStringShort()} (capped)`
        : `${Time.bestInfinity.times(new Decimal(2)).toStringShort()}`;
      return `${quantify("Infinity", infinities)} every ${timeStr}`;
    }
  },
  autobuyMaxDimboosts: {
    id: "autobuyMaxDimboosts",
    cost: new Decimal(2e9),
    name: "Boost Batch",
    description: "Unlock the buy max Dimension Boost Autobuyer mode"
  },
  galaxyFormula: {
    id: "galaxyFormula",
    cost: DC.E30,
    name: "AWAKENING GALAXY",
    scrambleName: true,
    nameCycle: ["DORMANT GALAXY", "STIRRING GALAXY", "WAKING GALAXY"],
    description: () => (BreakInfinityUpgrade.galaxyFormula.isBought
      ? "Antimatter Galaxies are awakening. Their effect on Tickspeed now scales exponentially."
      : "Antimatter Galaxies are *."),
    scrambleText: ["i̸m̷p̶r̸o̵v̴e̶d̴", "c̸o̷r̶r̷u̶p̸t̸e̵d̶", "u̷n̸s̶e̵a̴l̴e̵d̶", "???"]
  },
  idPurchaseCascade: {
    id: "idPurchaseCascade",
    cost: new Decimal("5e14"),
    name: "Dimensional Dividend",
    description: "Infinity Power builds a dividend which multiplies Infinity Points gained on Big Crunch.",
    hideEffect: true
  },
  achievementFormula: {
    id: "achievementFormula",
    cost: DC.E10,
    name: "Merit Multiplier",
    description: "Improve the base formula of Achievement bonuses",
    hideEffect: true,
    onPurchased: () => Achievements._power.invalidate()
  },
  infinityIPMult: {
    id: "infinityIPMult",
    cost: DC.E7,
    name: "Infinite Interest",
    description: "Infinity Point gain increases based on total Infinities",
    effect: () => infinityIPMultiplier(),
    formatEffect: value => formatX(value, 2, 2)
  },
  instantAutobuyers: {
    id: "instantAutobuyers",
    cost: new Decimal("3e12"),
    name: "Instant Infrastructure",
    description: "Antimatter Dimension and Tickspeed Autobuyers are instant"
  },
  sacrificeAutobuyer: {
    id: "sacrificeAutobuyer",
    cost: DC.E28,
    name: "Sacrificial Servant",
    description: "Unlock the Dimensional Sacrifice Autobuyer"
  },
  galaxyBulk: {
    id: "galaxyBulk",
    cost: DC.E45,
    name: "Galactic Gathering",
    description: "Unlock bulk Antimatter Galaxy purchases"
  },
  tickspeedCostMult: rebuyable({
    id: 0,
    initialCost: DC.E6,
    name: "Tick Compression",
    costIncrease: DC.D5,
    maxUpgrades: DC.D8,
    description: "Reduce post-infinity Tickspeed Upgrade cost multiplier scaling",
    afterEC: () => (EternityChallenge(11).completions > 0
      ? `After EC11: ${formatX(Player.tickSpeedMultDecrease, 2, 2)}`
      : ""
    ),
    noLabel: true,
    onPurchased: () => GameCache.tickSpeedMultDecrease.invalidate()
  }),
  dimCostMult: rebuyable({
    id: 1,
    initialCost: new Decimal(1e7),
    name: "Dimensional Economy",
    costIncrease: new Decimal(100),
    maxUpgrades: new Decimal(7),
    description: "Reduce post-infinity Antimatter Dimension cost multiplier scaling",
    afterEC: () => (EternityChallenge(6).completions > 0
      ? `After EC6: ${formatX(Player.dimensionMultDecrease, 2, 2)}`
      : ""
    ),
    noLabel: true,
    onPurchased: () => GameCache.dimensionMultDecrease.invalidate()
  }),
  ipGen: rebuyable({
    id: 2,
    initialCost: new Decimal(1e7),
    name: "Idle Income",
    costIncrease: DC.E1,
    maxUpgrades: DC.D20,
    effect: value => Player.bestRunIPPM.times(value.div(20)),
    description: () => {
      let generation = `Generate ${format(player.infinityRebuyables[2].mul(5))}%`;
      if (!BreakInfinityUpgrade.ipGen.isCapped) {
        generation += ` ➜ ${format(player.infinityRebuyables[2].add(1).mul(5))}%`;
      }
      return `${generation} of your best IP/min from your last 10 Infinities`;
    },
    isDisabled: effect => effect.eq(0),
    formatEffect: value => `${format(value, 2, 1)} IP/min`,
    noLabel: false
  }),
  criticalIdleIncome: {
    id: "criticalIdleIncome",
    cost: DC.E20,
    name: "Critical Idle Income",
    isAvailableForPurchase: () => BreakInfinityUpgrade.ipGen.isCapped,
    description: () => {
      if (CriticalIdleIncome.isActive) {
        return `Idle Income is ${format(CriticalIdleIncome.multiplier.times(100), 2, 2)}% for
          ${TimeSpan.fromMilliseconds(CriticalIdleIncome.remaining).toStringShort()}`;
      }
      return "Every 700 seconds, roll 1d20. On a natural 20, Idle Income is 7.77 times stronger for 7 seconds";
    },
    hideEffect: true
  },
  idRate: {
    rebuyable: true,
    id: 3,
    name: "Power Transfer",
    maxUpgrades: DC.D68,
    cost: () => {
      const purchases = (player.infinityRebuyables[3] ?? DC.D0).toNumber();
      const initialPurchases = Math.min(purchases, 7);
      let exponent = 5 + initialPurchases * Math.log10(5);
      let remainingPurchases = Math.max(purchases - 7, 0);
      for (let stage = 1; remainingPurchases > 0; stage++) {
        const stagePurchases = Math.min(remainingPurchases, 5);
        exponent += stagePurchases * Math.log10(5 * (stage + 1));
        remainingPurchases -= stagePurchases;
      }
      return Decimal.pow10(exponent);
    },
    isAvailableForPurchase: () => {
      const purchases = player.infinityRebuyables[3] ?? DC.D0;
      const cap = 8 + 5 * Math.min(InfinityChallenges.completed.length, 12);
      return purchases.lt(cap);
    },
    isCapped: () => {
      const purchases = player.infinityRebuyables[3] ?? DC.D0;
      const cap = 8 + 5 * Math.min(InfinityChallenges.completed.length, 12);
      return purchases.gte(cap);
    },
    effect: () => DC.D0_1.times(player.infinityRebuyables[3] ?? DC.D0),
    description: "Increase Infinity Power conversion exponent by 0.1",
    formatEffect: value => {
      const cap = DC.D0_1.times(8 + 5 * Math.min(InfinityChallenges.completed.length, 12));
      const riftEffect = PelleRifts.paradox.milestones[2].effectOrDefault(1);
      const current = InfinityDimensions.basePowerConversionRate.add(value).mul(riftEffect);
      return value.gte(cap)
        ? formatPow(current, 1, 1)
        : `${formatPow(current, 1, 1)} | Next: ${formatPow(current.add(DC.D0_1.times(riftEffect)), 1, 1)}`;
    },
    formatCost: value => format(value, 2, 0),
    noLabel: false
  }
};
