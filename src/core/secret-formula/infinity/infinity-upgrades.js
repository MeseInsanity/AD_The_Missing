import { DC } from "../../constants";
import { effectiveGalaxyCount } from "../../tickspeed";
import { Fragments } from "../fragments";

function dimInfinityMult() {
  return Currency.infinitiesTotal.value.times(0.2).plus(1);
}
function chargedDimInfinityMult() {
  return Decimal.log10(Decimal.max(1, Currency.infinitiesTotal.value.pLog10()))
    .mul(Math.sqrt(Ra.pets.teresa.level) / 150).add(1);
}

function fastestInfinitySoftcapStart() {
  const fragmentStrength = Math.max(Fragments.fastestInfinitySoftcap.effect().toNumber() - 1, 0);
  // Solve (1800 / t)^0.423 + 1 = 8, then let Fragments move that start point toward faster times.
  const baseSoftcapStart = new Decimal(1800).div(Decimal.pow(7, 1 / 0.423));
  return baseSoftcapStart.div(Decimal.pow(5, fragmentStrength));
}

function isFastestInfinitySoftcapped() {
  return Time.bestInfinity.totalSeconds.lt(fastestInfinitySoftcapStart());
}

function bestInfinityTimeMult() {
  const seconds = Time.bestInfinity.totalSeconds.max(1e-300);
  const rawMultiplier = Decimal.pow(new Decimal(1800).div(seconds), 0.423).add(1);
  const softcapStart = fastestInfinitySoftcapStart();
  if (seconds.gte(softcapStart)) return rawMultiplier;
  const softcapValue = Decimal.pow(new Decimal(1800).div(softcapStart), 0.423).add(1);
  const overflow = softcapStart.div(seconds).max(1).log10();
  return softcapValue.times(overflow.div(5).add(1));
}

function galaxySacrificeMultiplier() {
  return effectiveGalaxyCount().clampMax(30).times(0.05).add(1);
}

function galaxySacrificePower() {
  const galaxyStrength = effectiveGalaxyCount().add(1).log10().div(2).clampMax(1);
  return galaxyStrength.times(0.1 * Math.sqrt(Ra.pets.teresa.level / 2)).add(1);
}

function dimBoostBuy10Multiplier() {
  return DimBoost.totalBoosts.max(1).log10().div(8).clampMax(1).times(0.1).add(1);
}

function chargedDimBoostBuy10Power() {
  const boostStrength = DimBoost.totalBoosts.max(1).log10().div(8).clampMax(1);
  return boostStrength.times(1 + Math.pow(Ra.pets.teresa.level / 2, 2)).add(1);
}

function sacrificeTickspeedMultiplier() {
  const sacrificeLog = Sacrifice.totalBoost.max(1).log10();
  if (!InfinityChallenge(2).isCompleted) {
    return sacrificeLog.div(7).clampMax(1).times(0.35).add(1);
  }
  return sacrificeLog.sub(90).div(210).clampMin(0).clampMax(1).times(0.15).add(1.35);
}

export const infinityUpgrades = {
  bestInfinityTimeDimensions: {
    id: "bestInfinityTimeDimensions",
    cost: 8,
    checkRequirement: () => InfinityUpgrade.dim18mult.isBought,
    description: "Antimatter Dimensions are stronger based on your fastest Infinity time",
    effect: () => bestInfinityTimeMult(),
    formatEffect: value => `${formatX(value, 2, 2)}${isFastestInfinitySoftcapped() ? " (Softcapped)" : ""}`,
    charged: {
      description: "Antimatter Dimensions gain a power effect based on your fastest Infinity time and Teresa level",
      effect: () => Decimal.log10(bestInfinityTimeMult()).div(8).clampMax(1)
        .times(0.16 * Math.sqrt(Ra.pets.teresa.level / 2)).add(1),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  currentInfinityGalaxiesSacrifice: {
    id: "currentInfinityGalaxiesSacrifice",
    cost: 2,
    checkRequirement: () => InfinityUpgrade.thisInfinityTimeMult.isBought,
    description: "Sacrifice is stronger based on Galaxies in the current Infinity",
    effect: () => galaxySacrificeMultiplier(),
    formatEffect: value => formatX(value, 2, 2),
    charged: {
      description: "Sacrifice gains a power effect based on Galaxies in the current Infinity and Teresa level",
      effect: () => galaxySacrificePower(),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  currentInfinityBoostsBuy10: {
    id: "currentInfinityBoostsBuy10",
    cost: 32,
    checkRequirement: () => InfinityUpgrade.currentInfinitySacrificeTickspeed.isBought,
    description: "Buy 10 Multiplier is stronger based on Dimension Boosts in the current Infinity",
    effect: () => dimBoostBuy10Multiplier(),
    formatEffect: value => formatX(value, 3, 3),
    charged: {
      description: "Buy 10 Multiplier gains a power effect based on Dimension Boosts and Teresa level",
      effect: () => chargedDimBoostBuy10Power(),
      formatEffect: value => formatPow(value, 3, 3)
    }
  },
  currentInfinitySacrificeTickspeed: {
    id: "currentInfinitySacrificeTickspeed",
    cost: 16,
    checkRequirement: () => InfinityUpgrade.currentInfinityGalaxiesSacrifice.isBought,
    description: "Tickspeed is stronger based on Sacrifice in the current Infinity",
    effect: () => sacrificeTickspeedMultiplier(),
    formatEffect: value => formatX(value, 2, 2),
    charged: {
      description: "Tickspeed is further strengthened based on Sacrifice and Teresa level",
      effect: () => sacrificeTickspeedMultiplier().pow(1 + Math.sqrt(Ra.pets.teresa.level / 2)),
      formatEffect: value => formatX(value, 2, 2)
    }
  },
  totalTimeMult: {
    id: "timeMult",
    cost: 1,
    description: "Antimatter Dimensions gain a multiplier based on time played",
    effect: () => Decimal.pow(Time.totalTimePlayed.totalMinutes.div(2), 0.15),
    formatEffect: value => formatX(value, 2, 2),
    charged: {
      description: "Antimatter Dimensions gain a power effect based on time played and Teresa level",
      effect: () =>
        Decimal.log10(Decimal.log10(Time.totalTimePlayed.totalMilliseconds))
          .times(Decimal.pow(Ra.pets.teresa.level, 0.5)).div(150).add(1),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  dim18mult: {
    id: "18Mult",
    cost: 2,
    checkRequirement: () => InfinityUpgrade.totalTimeMult.isBought,
    description: "Antimatter Dimensions gain a multiplier based on Infinities",
    effect: () => dimInfinityMult(),
    formatEffect: value => formatX(value, 1, 1),
    charged: {
      description: "Antimatter Dimensions gain a power effect based on Infinities and Teresa level",
      effect: () => chargedDimInfinityMult(),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  dim27mult: {
    id: "27Mult",
    cost: 1,
    checkRequirement: () => InfinityUpgrade.buy10Mult.isBought,
    description: "2nd and 7th Antimatter Dimensions gain a multiplier based on Infinities",
    effect: () => dimInfinityMult(),
    formatEffect: value => formatX(value, 1, 1),
    charged: {
      description: "2nd and 7th Antimatter Dimensions gain a power effect based on Infinities and Teresa level",
      effect: () => chargedDimInfinityMult(),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  dim36mult: {
    id: "36Mult",
    cost: 1,
    checkRequirement: () => InfinityUpgrade.dim18mult.isBought,
    description: "3rd and 6th Antimatter Dimensions gain a multiplier based on Infinities",
    effect: () => dimInfinityMult(),
    formatEffect: value => formatX(value, 1, 1),
    charged: {
      description: "3rd and 6th Antimatter Dimensions gain a power effect based on Infinities and Teresa level",
      effect: () => chargedDimInfinityMult(),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  dim45mult: {
    id: "45Mult",
    cost: 1,
    checkRequirement: () => InfinityUpgrade.dim27mult.isBought,
    description: "4th and 5th Antimatter Dimensions gain a multiplier based on Infinities",
    effect: () => dimInfinityMult(),
    formatEffect: value => formatX(value, 1, 1),
    charged: {
      description: "4th and 5th Antimatter Dimensions gain a power effect based on Infinities and Teresa level",
      effect: () => chargedDimInfinityMult(),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  resetBoost: {
    id: "resetBoost",
    cost: 32,
    checkRequirement: () => InfinityUpgrade.dimboostMult.isBought,
    description: () =>
      `Decrease the number of Dimensions needed for Dimension Boosts and Antimatter Galaxies by ${formatInt(9)}`,
    effect: 9,
    charged: {
      description: () => "Decrease Dimension Boost requirement based on Teresa level",
      effect: () => 1 / (1 + Math.sqrt(Ra.pets.teresa.level) / 10),
      formatEffect: value => `${formatX(value, 4, 4)}`
    }
  },
  buy10Mult: {
    id: "dimMult",
    cost: 2,
    description: () => `Increase the multiplier for buying ${formatInt(10)} Antimatter Dimensions`,
    effect: () => 1.1,
    formatEffect: () => `${formatX(2, 0, 1)} ➜ ${formatX(2.2, 0, 1)}`,
    charged: {
      description: () => `The multiplier for buying ${formatInt(10)} Antimatter Dimensions gains ` +
        "a power effect based on Teresa level",
      effect: () => 1 + Ra.pets.teresa.level / 200,
      formatEffect: value => formatPow(value, 3, 3)
    }
  },
  galaxyBoost: {
    id: "galaxyBoost",
    cost: 1024,
    checkRequirement: () => InfinityUpgrade.resetBoost.isBought,
    description: "All Galaxies are twice as strong",
    effect: 2,
    charged: {
      description: "All Galaxies are stronger based on Teresa level",
      effect: () => 2 + Math.sqrt(Ra.pets.teresa.level) / 100,
      formatEffect: value => `+${formatPercents(value - 1)}`
    }
  },
  thisInfinityTimeMult: {
    id: "timeMult2",
    cost: 1,
    description: "Antimatter Dimensions gain a multiplier based on time spent in current Infinity",
    effect: () => Decimal.max(Decimal.pow(Time.thisInfinity.totalMinutes.div(4), 0.25), 1),
    formatEffect: value => formatX(value, 2, 2),
    charged: {
      description:
        "Antimatter Dimensions gain a power effect based on time spent in current Infinity and Teresa level",
      effect: () =>
        Decimal.log10(Decimal.log10(Time.thisInfinity.totalMilliseconds.add(100)))
          .times(Math.sqrt(Ra.pets.teresa.level)).div(150).add(1),
      formatEffect: value => formatPow(value, 4, 4)
    }
  },
  unspentIPMult: {
    id: "unspentBonus",
    cost: 256,
    checkRequirement: () => InfinityUpgrade.bestInfinityTimeDimensions.isBought,
    description: "Antimatter Dimensions gain a multiplier based on unspent Infinity Points",
    effect: () => Currency.infinityPoints.value.dividedBy(2).pow(1.5).plus(1).pow(0.25),
    formatEffect: value => formatX(value, 2, 2),
    charged: {
      description: "Antimatter Dimensions gain a multiplier based on unspent Infinity Points, powered by Teresa level",
      effect: () => Currency.infinityPoints.value.dividedBy(2).pow(Math.sqrt(Ra.pets.teresa.level) * 1.5).plus(1)
        .pow(0.25),
      formatEffect: value => formatX(value, 2, 2)
    }
  },
  dimboostMult: {
    id: "resetMult",
    cost: 4,
    checkRequirement: () => InfinityUpgrade.buy10Mult.isBought,
    description: "Increase Dimension Boost multiplier",
    effect: () => 2.5,
    formatEffect: () => `${formatX(2, 0, 1)} ➜ ${formatX(2.5, 0, 1)}`,
    charged: {
      description: "Dimension Boost multiplier gains a power effect based on Teresa level",
      effect: () => 1 + Ra.pets.teresa.level / 200,
      formatEffect: value => formatPow(value, 3, 3)
    }
  },
  ipGen: {
    id: "passiveGen",
    cost: 10,
    checkRequirement: () => InfinityUpgrade.dimboostMult.isBought,
    description: () => `Passively generate Infinity Points ${formatInt(10)} times slower than your fastest Infinity`,
    // Cutting corners: this is not actual effect, but it is totalIPMult that is displyed on upgrade
    effect: () => (Teresa.isRunning || V.isRunning || Pelle.isDoomed ? DC.D0 : GameCache.totalIPMult.value),
    formatEffect: value => {
      if (Teresa.isRunning || V.isRunning) return "Disabled in this reality";
      if (Pelle.isDoomed) return "Disabled";
      if (player.records.bestInfinity.time.gte(DC.BEMAX.log10())) return "Too slow to generate";
      return `${format(value, 2)} every ${Time.bestInfinity.times(DC.E1).toStringShort()}`;
    },
    charged: {
      description: () =>
        `Gain Reality Machines each real-time second proportional to amount gained on Reality,
        increasing with Teresa level`,
      effect: () => Decimal.mul(Math.pow(Ra.pets.teresa.level, 2),
        Ra.unlocks.continuousTTBoost.effects.autoPrestige.effectOrDefault(1)),
      formatEffect: value => formatX(value, 2, 1)
    }
  },
  skipReset1: {
    id: "skipReset1",
    cost: 10,
    description: () =>
      `Start every reset with ${formatInt(1)} Dimension Boost, automatically unlocking the 5th Antimatter Dimension`,
  },
  skipReset2: {
    id: "skipReset2",
    cost: 20,
    checkRequirement: () => InfinityUpgrade.skipReset1.isBought,
    description: () =>
      `Start every reset with ${formatInt(2)} Dimension Boosts, automatically unlocking the 6th Antimatter Dimension`,
  },
  skipReset3: {
    id: "skipReset3",
    cost: 40,
    checkRequirement: () => InfinityUpgrade.skipReset2.isBought,
    description: () =>
      `Start every reset with ${formatInt(3)} Dimension Boosts, automatically unlocking the 7th Antimatter Dimension`,
  },
  skipResetGalaxy: {
    id: "skipResetGalaxy",
    cost: 80,
    checkRequirement: () => InfinityUpgrade.skipReset3.isBought,
    description: () =>
      `Start every reset with ${formatInt(4)} Dimension Boosts, automatically unlocking the 8th Antimatter Dimension;
      and an Antimatter Galaxy`,
  },
  ipOffline: {
    id: "ipOffline",
    cost: 1000,
    checkRequirement: () => Achievement(41).isUnlocked,
    description: () => (player.options.offlineProgress
      ? `Only while offline, gain ${formatPercents(0.5)} of your best IP/min without using Max All`
      : "This upgrade would give offline Infinity Point generation, but offline progress is currently disabled"),
    effect: () => (player.options.offlineProgress
      ? player.records.thisEternity.bestIPMsWithoutMaxAll.times(TimeSpan.fromMinutes(1).totalMilliseconds.div(2))
      : DC.D0),
    isDisabled: () => !player.options.offlineProgress,
    formatEffect: value => `${format(value, 2, 2)} IP/min`,
  },
  ipMult: {
    id: "ipMult",
    cost: () => InfinityUpgrade.ipMult.cost,
    checkRequirement: () => Achievement(41).isUnlocked,
    costCap: DC.E6E6,
    costIncreaseThreshold: DC.E3E6,
    description: () => `Multiply Infinity Points from all sources by ${formatX(2)}`,
    // Normally the multiplier caps at e993k or so with 3300000 purchases, but if the cost is capped then we just give
    // an extra e7k to make the multiplier look nice
    effect: () => (player.IPMultPurchases.gte(3300000) ? DC.E1E6 : DC.D2.pow(player.IPMultPurchases)),
    cap: () => Effarig.eternityCap ?? DC.E1E6,
    formatEffect: value => formatX(value, 2, 2),
  }
};
