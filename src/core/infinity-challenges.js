import { DC } from "./constants";
import { GameMechanicState } from "./game-mechanics";

export const IC5Focus = {
  // Temporary name retained while the reverse Galaxy-ladder probe is iterated.
  get lowestUnlockedTier() {
    return Decimal.max(1, DC.D8.sub(player.galaxies)).toNumber();
  },

  isDimensionUnlocked(tier) {
    return tier >= this.lowestUnlockedTier;
  },

  get highestLockedTier() {
    return Math.max(0, this.lowestUnlockedTier - 1);
  }
};

export const IC9Annihilation = {
  resourceValue(value) {
    return Decimal.isFinite(value) && value.gt(0) ? value : DC.D1;
  },

  get antimatter() {
    return this.resourceValue(Currency.antimatter.value);
  },

  get matter() {
    return this.resourceValue(Currency.matter.value);
  },

  get residualRatio() {
    const ratio = player.challenge.infinity.ic9ResidualRatio ?? DC.D1;
    return Decimal.isFinite(ratio) && ratio.gte(1) ? ratio : DC.D1;
  },

  get higherSideProductionExponent() {
    const residualLog = this.residualRatio.log10();
    // The residual imbalance is deliberately a soft-capped exponent penalty.
    // This preserves the last Annihilate's asymmetry without stalling a source chain.
    const penalty = residualLog.div(residualLog.add(100)).times(0.05);
    return Decimal.isFinite(penalty) ? DC.D1.sub(penalty) : DC.D1;
  },

  sanitizeResources() {
    if (!Decimal.isFinite(Currency.antimatter.value) || Currency.antimatter.value.lte(0)) {
      Currency.antimatter.value = DC.D1;
    }
    if (!Decimal.isFinite(Currency.matter.value) || Currency.matter.value.lte(0)) {
      Currency.matter.value = DC.D1;
    }
  },

  productionExponentForTier(tier) {
    if (!InfinityChallenge(9).isRunning) return DC.D1;
    const producesAntimatter = tier % 2 === 1;
    const residualResource = player.challenge.infinity.ic9ResidualResource ?? 0;
    const exponent = (producesAntimatter && residualResource === 1) || (!producesAntimatter && residualResource === 2)
      ? this.higherSideProductionExponent
      : DC.D1;
    return Decimal.isFinite(exponent) && exponent.gte(0) ? exponent : DC.D1;
  },

  applyProductionExponent(production, tier) {
    if (!Decimal.isFinite(production) || production.lte(0)) return DC.D0;
    return production.pow(this.productionExponentForTier(tier));
  },

  get continuumValue() {
    // Annihilation pays out from the weaker resource's absolute amount. The ratio is only
    // used for the production-balance penalty; using it here incorrectly rewards imbalance.
    const lowerResource = Decimal.min(this.antimatter, this.matter);
    const costScale = AntimatterDimension(8).costScale;
    const continuum = costScale.getContinuumValue(lowerResource, DC.E1);
    return Decimal.isFinite(continuum) && continuum.gte(0) ? continuum : DC.D0;
  },

  galaxyCountForContinuum(continuum) {
    if (continuum.lte(0)) return DC.D0;
    // The continuum inversion uses the Buy 10 cost scale, so convert its result
    // back into individual AD8 purchases before comparing against Galaxy requirements.
    const galaxyEquivalentAD8 = continuum.times(10);
    const highestWholeGalaxy = Galaxy.buyableGalaxies(galaxyEquivalentAD8, DC.D0);
    // This is the number already reached. Interpolate from that Galaxy's own
    // requirement to the next one; subtracting one here pins the result to
    // whole Galaxies until the following threshold is crossed.
    const lowerGalaxy = highestWholeGalaxy;
    const lowerRequirement = lowerGalaxy.eq(0) ? DC.D0 : Galaxy.requirementAt(lowerGalaxy.sub(1)).amount;
    const upperRequirement = Galaxy.requirementAt(lowerGalaxy).amount;
    const progress = galaxyEquivalentAD8.sub(lowerRequirement).div(upperRequirement.sub(lowerRequirement))
      .clampMin(0).clampMax(1);
    return lowerGalaxy.add(progress);
  },

  get galaxyGain() {
    return this.galaxyCountForContinuum(this.continuumValue).sub(player.galaxies).clampMin(0);
  },

  get previousContinuum() {
    return player.challenge.infinity.ic9PreviousContinuum ?? DC.D0;
  },

  get canAnnihilate() {
    return InfinityChallenge(9).isRunning && this.continuumValue.gt(this.previousContinuum);
  },

  divideCurrencies() {
    const divisor = Decimal.min(this.antimatter, this.matter);
    Currency.antimatter.value = this.antimatter.div(divisor);
    Currency.matter.value = this.matter.div(divisor);
  },

  captureResidualImbalance() {
    const antimatterIsHigher = this.antimatter.gte(this.matter);
    const higher = antimatterIsHigher ? this.antimatter : this.matter;
    const lower = antimatterIsHigher ? this.matter : this.antimatter;
    player.challenge.infinity.ic9ResidualRatio = higher.div(lower);
    player.challenge.infinity.ic9ResidualResource = antimatterIsHigher ? 1 : 2;
  }
};

export const IC11Production = {
  reset() {
    player.challenge.infinity.ic11SelfProductionTimers = Array.repeat(DC.D0, 8);
  },

  get selfProductionTimers() {
    const timers = player.challenge.infinity.ic11SelfProductionTimers;
    if (Array.isArray(timers) && timers.length === 8) return timers;
    this.reset();
    return player.challenge.infinity.ic11SelfProductionTimers;
  },

  tickSelfProduction(diff) {
    if (!InfinityChallenge(11).isRunning) return;
    const tickspeedLog = Tickspeed.perSecond.max(1).log10().max(1);
    const timers = this.selfProductionTimers;
    for (let tier = 1; tier <= 8; tier++) {
      const dimension = AntimatterDimension(tier);
      if (dimension.amount.lte(0)) {
        timers[tier - 1] = DC.D0;
        continue;
      }
      const interval = new Decimal(tier).div(tickspeedLog).times(1000);
      const elapsed = new Decimal(timers[tier - 1]).plus(diff);
      const productionCount = elapsed.div(interval).floor();
      timers[tier - 1] = elapsed.sub(productionCount.times(interval));
      if (productionCount.gt(0)) {
        dimension.amount = dimension.amount.plus(dimension.bought.times(dimension.multiplier).times(productionCount));
      }
    }
  },

  tickBetweenReplicates({ diff, replicantiInterval, startingTimer, tickCount, onReplicate }) {
    if (!InfinityChallenge(11).isRunning) return;
    let remaining = new Decimal(diff);
    let untilReplicate = replicantiInterval.sub(startingTimer).clampMin(0);
    // Game-loop diff is capped at one day and Replicanti intervals are bounded, so this is safe to materialize.
    const replicates = tickCount.toNumber();
    for (let replicate = 0; replicate < replicates; replicate++) {
      if (Currency.antimatter.gte(Player.infinityGoal)) return;
      const segment = Decimal.min(remaining, untilReplicate);
      this.tickSelfProduction(segment);
      remaining = remaining.sub(segment);
      this.replicate(DC.D1);
      if (Currency.antimatter.gte(Player.infinityGoal)) return;
      onReplicate();
      untilReplicate = replicantiInterval;
    }
    this.tickSelfProduction(remaining);
    if (AntimatterDimension(1).amount.gt(0)) player.requirementChecks.eternity.noAD1 = false;
  },

  replicate(tickCount) {
    if (!InfinityChallenge(11).isRunning || tickCount.lte(0) || Currency.antimatter.gte(Player.infinityGoal)) return;
    const chance = Replicanti.chance.clampMin(0).clampMax(1);
    const failureChance = DC.D1.sub(chance);
    let expectedOutput = DC.D1;
    let activeTiers = 0;
    for (const dimension of AntimatterDimensions.all) {
      if (dimension.amount.lte(0)) continue;
      const successfulOutput = dimension.amount.times(dimension.multiplier);
      expectedOutput = expectedOutput.times(failureChance.plus(successfulOutput.times(chance)));
      activeTiers++;
    }
    if (activeTiers === 0) return;
    const allFailureOutput = failureChance.pow(activeTiers);
    Currency.antimatter.add(expectedOutput.sub(allFailureOutput).times(tickCount));
    if (Currency.antimatter.gte(Player.infinityGoal)) {
      Currency.antimatter.value = new Decimal(Player.infinityGoal);
    }
  }
};

export function tryCompleteInfinityChallenges() {
  if (EternityMilestone.autoIC.isReached) {
    const toComplete = InfinityChallenges.all.filter(x => x.isUnlocked && !x.isCompleted);
    for (const challenge of toComplete) challenge.complete();
  }
}

class InfinityChallengeRewardState extends GameMechanicState {
  constructor(config, challenge) {
    super(config);
    this._challenge = challenge;
  }

  get isEffectActive() {
    return this._challenge.isCompleted;
  }
}

class InfinityChallengeState extends GameMechanicState {
  constructor(config) {
    super(config);
    this._reward = new InfinityChallengeRewardState(config.reward, this);
  }

  get unlockAM() {
    return this.config.unlockAM;
  }

  get isUnlocked() {
    return player.records.thisEternity.maxAM.gte(this.unlockAM) || (Achievement(135).isUnlocked && !Pelle.isDoomed) ||
      (PelleUpgrade.keepInfinityChallenges.canBeApplied && Pelle.cel.records.totalAntimatter.gte(this.unlockAM));
  }

  get isRunning() {
    return player.challenge.infinity.current === this.id;
  }

  requestStart() {
    if (!this.isUnlocked) return;
    if (GameEnd.creditsEverClosed) return;
    if (!player.options.confirmations.challenges) {
      this.start();
      return;
    }
    Modal.startInfinityChallenge.show(this.id);
  }

  start() {
    if (!this.isUnlocked || this.isRunning) return;
    // Forces big crunch reset but ensures IP gain, if any.
    bigCrunchReset(true, true);
    player.challenge.normal.current = 0;
    player.challenge.infinity.current = this.id;
    if (this.id === 9) {
      const startingResource = Currency.antimatter.value.max(DC.D1);
      Currency.antimatter.value = startingResource;
      Currency.matter.value = startingResource;
      player.challenge.infinity.ic9PreviousContinuum = DC.D0;
      player.challenge.infinity.ic9ResidualRatio = DC.D1;
      player.challenge.infinity.ic9ResidualResource = 0;
    }
    if (this.id === 11) {
      IC11Production.reset();
      Currency.infinityPower.reset();
    }
    if (!Enslaved.isRunning) Tab.dimensions.antimatter.show();
    player.break = true;
  }

  get isCompleted() {
    return (player.challenge.infinity.completedBits & (1 << this.id)) !== 0;
  }

  get ic5AchievementTier() {
    return player.challenge.infinity.ic5AchievementTier ?? 0;
  }

  complete() {
    if (this.id === 5 && this.isRunning) {
      player.challenge.infinity.ic5AchievementTier = Math.max(
        this.ic5AchievementTier,
        IC5Focus.highestLockedTier
      );
      if (AntimatterDimension(8).bought.eq(1) && DimBoost.purchasedBoosts.eq(0) && player.galaxies.eq(0)) {
        Achievement(107).unlock();
      }
    }
    // These are permanent completion rewards, so automatic and bulk completion must grant them too.
    if (this.id === 9) Replicanti.unlock(true);
    player.challenge.infinity.completedBits |= 1 << this.id;
    if (this.id === 10) {
      InfinityDimension(7).isUnlocked = true;
      EventHub.dispatch(GAME_EVENT.INFINITY_DIMENSION_UNLOCKED, 7);
    }
    EventHub.dispatch(GAME_EVENT.INFINITY_CHALLENGE_COMPLETED);
  }

  get isEffectActive() {
    return this.isRunning;
  }

  /**
   * @return {InfinityChallengeRewardState}
   */
  get reward() {
    return this._reward;
  }

  get isQuickResettable() {
    return this.config.isQuickResettable;
  }

  get goal() {
    return this.config.goal;
  }

  updateChallengeTime() {
    const bestTimes = player.challenge.infinity.bestTimes;
    if (bestTimes[this.id - 1].lte(player.records.thisInfinity.time)) {
      return;
    }
    player.challenge.infinity.bestTimes[this.id - 1] = player.records.thisInfinity.time;
    GameCache.infinityChallengeTimeSum.invalidate();
  }

  exit() {
    player.challenge.infinity.current = 0;
    bigCrunchReset(true, false);
    if (!Enslaved.isRunning) Tab.dimensions.antimatter.show();
  }
}

/**
 * @param {number} id
 * @return {InfinityChallengeState}
 */
export const InfinityChallenge = InfinityChallengeState.createAccessor(GameDatabase.challenges.infinity);

/**
 * @returns {InfinityChallengeState}
 */
Object.defineProperty(InfinityChallenge, "current", {
  get: () => (player.challenge.infinity.current > 0
    ? InfinityChallenge(player.challenge.infinity.current)
    : undefined),
});

Object.defineProperty(InfinityChallenge, "isRunning", {
  get: () => InfinityChallenge.current !== undefined,
});

export const InfinityChallenges = {
  /**
   * @type {InfinityChallengeState[]}
   */
  all: InfinityChallenge.index.compact(),
  completeAll() {
    for (const challenge of InfinityChallenges.all) challenge.complete();
  },
  clearCompletions() {
    player.challenge.infinity.completedBits = 0;
  },
  get nextIC() {
    return InfinityChallenges.all.find(x => !x.isUnlocked);
  },
  get nextICUnlockAM() {
    return this.nextIC?.unlockAM;
  },
  /**
   * Displays a notification if the antimatter gained will surpass the next unlockAM requirement.
   * @param value {Decimal} - total antimatter
   */
  notifyICUnlock(value) {
    // Disable the popup if the user will automatically complete the IC.
    if (EternityMilestone.autoIC.isReached) return;
    if (InfinityChallenges.nextIC === undefined) return;
    for (const ic of InfinityChallenges.all) {
      if (ic.isUnlocked || ic.isCompleted) continue;
      if (value.lt(ic.unlockAM)) break;
      // This has a reasonably high likelihood of happening when the player isn't looking at the game, so
      // we also give it a tab notification
      TabNotification.ICUnlock.clearTrigger();
      GameUI.notify.infinity(`You have unlocked Infinity Challenge ${ic.id} — ${ic.config.name}`, 7000);
      TabNotification.ICUnlock.tryTrigger();
    }
  },
  /**
   * @returns {InfinityChallengeState[]}
   */
  get completed() {
    return InfinityChallenges.all.filter(ic => ic.isCompleted);
  }
};
