import { DC } from "./constants";
import { Fragments } from "./secret-formula/fragments";
import { IC11Production } from "./infinity-challenges";

const BASE_REPLICANTI_CHANCE = new Decimal(0.2);
const BASE_REPLICANTI_INTERVAL = DC.E3;
const REPLICANTI_GALAXY_BASE_BITS = 1024;
const REPLICANTI_GALAXY_MID_SLOPE = 3072 / 85;
const REPLICANTI_GALAXY_MID_END_BITS = 2048 + REPLICANTI_GALAXY_MID_SLOPE * 1350;
const FRAGMENT_REPLICANTI_SLOWDOWN_START = Decimal.pow(2, 1024);

function replicantiGalaxyRequirementLog2(nextGalaxy) {
  if (!Fragments.isUnlocked) return new Decimal(REPLICANTI_GALAXY_BASE_BITS);
  const adjustedGalaxy = Decimal.max(nextGalaxy.sub(Fragments.replicantiGalaxyScalingStart).add(15), 15);
  if (adjustedGalaxy.lte(15)) return new Decimal(REPLICANTI_GALAXY_BASE_BITS);
  if (adjustedGalaxy.lte(100)) {
    const progress = adjustedGalaxy.sub(15).div(85);
    return new Decimal(REPLICANTI_GALAXY_BASE_BITS).times(DC.D1.add(progress.pow(3)));
  }
  if (adjustedGalaxy.lte(1000)) {
    const progress = adjustedGalaxy.sub(100).div(900);
    return new Decimal(2048).add(new Decimal(REPLICANTI_GALAXY_MID_SLOPE * 900)
      .times(progress.add(progress.pow(2).div(2))));
  }
  const progress = adjustedGalaxy.sub(1000).div(1000);
  return new Decimal(REPLICANTI_GALAXY_MID_END_BITS).add(new Decimal(REPLICANTI_GALAXY_MID_SLOPE * 2000)
    .times(progress.add(progress.pow(2)).add(progress.pow(3).div(3))));
}

// Slowdown parameters for replicanti growth, interval will increase by scaleFactor for every scaleLog10
// OoM past the cap (default is 308.25 (log10 of 1.8e308), 1.2, Number.MAX_VALUE)
export const ReplicantiGrowth = {
  get slowdownStart() {
    const baseStart = Fragments.isUnlocked ? FRAGMENT_REPLICANTI_SLOWDOWN_START : replicantiCap();
    const fragmentShift = TimeStudy(192).canBeApplied ? Fragments.effectiveAmount.clampMin(1) : DC.D1;
    return baseStart.pow(TimeStudy(33).effectOrDefault(1)).times(fragmentShift);
  },
  get scaleLog10() {
    return Math.log10(Number.MAX_VALUE) * TimeStudy(34).effectOrDefault(1);
  },
  get scaleFactor() {
    if (PelleStrikes.eternity.hasStrike && Replicanti.amount.gte(DC.E2000)) return 10;
    if (Pelle.isDoomed) return 2;
    const baseFactor = Fragments.isUnlocked ? 2 : AlchemyResource.cardinality.effectValue;
    return TimeStudy(192).canBeApplied ? Decimal.pow(baseFactor, 0.75) : baseFactor;
  }
};

// Internal function to add RGs; called both from within the fast replicanti code and from the function
// used externally. Only called in cases of automatic RG and does not actually modify replicanti amount
function addReplicantiGalaxies(newGalaxies) {
  if (newGalaxies.gte(0)) {
    player.replicanti.galaxies = player.replicanti.galaxies.add(newGalaxies);
    player.requirementChecks.eternity.noRG = false;
    const keepResources = Pelle.isDoomed
      ? PelleUpgrade.replicantiGalaxyEM40.canBeApplied
      : EternityMilestone.replicantiNoReset.isReached;
    if (!keepResources) {
      player.dimensionBoosts = DC.D0;
      softReset(0, true, true);
    }
  }
}

// Function called externally for gaining RGs, which adjusts replicanti amount before calling the function
// which actually adds the RG. Called externally both automatically and manually
export function replicantiGalaxy(auto) {
  if (RealityUpgrade(6).isLockingMechanics) {
    if (!auto) RealityUpgrade(6).tryShowWarningModal();
    return;
  }
  if (!Replicanti.galaxies.canBuyMore) return;
  const galaxyGain = Replicanti.galaxies.gain;
  if (galaxyGain.lt(1)) return;
  player.replicanti.timer = DC.D0;
  if (Achievement(132).isUnlocked && !Pelle.isDoomed) {
    if (!Fragments.isUnlocked) {
      Replicanti.amount = Decimal.pow10(
        Replicanti.amount.max(1).log10().sub(galaxyGain.mul(LOG10_MAX_VALUE))
      ).clampMin(1);
      addReplicantiGalaxies(galaxyGain);
      return;
    }
    // Effective Replicanti determines the Galaxy threshold, while the stored amount remains raw Replicanti.
    // Spending one Galaxy threshold in effective space therefore costs fewer raw Replicanti as Fragments grow.
    const fragmentBoost = Fragments.effectiveAmount.clampMin(1);
    const rawCost = Replicanti.galaxies.nextRequirement.div(fragmentBoost).clampMin(1);
    Replicanti.amount = Replicanti.amount.div(rawCost).clampMin(1);
  } else {
    Replicanti.amount = DC.D1;
  }
  addReplicantiGalaxies(galaxyGain);
}

// Only called on manual RG requests
export function replicantiGalaxyRequest() {
  if (!Replicanti.galaxies.canBuyMore) return;
  if (RealityUpgrade(6).isLockingMechanics) RealityUpgrade(6).tryShowWarningModal();
  else if (player.options.confirmations.replicantiGalaxy) Modal.replicantiGalaxy.show();
  else replicantiGalaxy(false);
}

function replicantiReproductionAmount(amount, chance) {
  const guaranteedCopies = chance.floor();
  const fractionalChance = chance.sub(guaranteedCopies);
  return amount.times(guaranteedCopies).plus(binomialDistribution(amount, fractionalChance));
}

// IC11 must advance Replicanti at each individual Replicate boundary so that its AD multiplier has the same
// time ordering in foreground and batched ticks. This mirrors the ordinary one-tick reproduction path.
function replicateOnce() {
  Replicanti.amount = Replicanti.amount.plus(replicantiReproductionAmount(Replicanti.amount, Replicanti.chance));
  if (!Replicanti.isUncapped) Replicanti.amount = Decimal.min(replicantiCap(), Replicanti.amount);
}

// Produces replicanti quickly below e308, will auto-bulk-RG if production is fast enough
// Returns the remaining unused gain factor
function fastReplicantiBelow308(log10GainFactor, isAutobuyerActive) {
  // Fragment-adjusted Galaxy thresholds cannot use the raw logarithmic bulk inverse below. Let the normal
  // post-loop Galaxy request handle them one at a time so its effective threshold and reduced raw cost agree.
  const shouldBuyRG = isAutobuyerActive && !RealityUpgrade(6).isLockingMechanics && Fragments.effectiveAmount.lte(1);
  // More than e308 galaxies per tick causes the game to die, and I don't think it's worth the performance hit of
  // Decimalifying the entire calculation.  And yes, this can and does actually happen super-lategame.
  const uncappedAmount = DC.E1.pow(log10GainFactor.plus(Replicanti.amount.max(1).log10()));
  // Checking for uncapped equaling zero is because Decimal.pow returns zero for overflow for some reason
  if (log10GainFactor.gt(Number.MAX_VALUE) || uncappedAmount.eq(0)) {
    if (shouldBuyRG) {
      addReplicantiGalaxies(Replicanti.galaxies.max.sub(player.replicanti.galaxies));
    }
    Replicanti.amount = replicantiCap();
    // Basically we've used nothing.
    return log10GainFactor;
  }

  if (!shouldBuyRG) {
    const remainingGain = log10GainFactor.minus(replicantiCap().max(1).log10()
      .sub(Replicanti.amount.max(1).log10())).clampMin(0);
    Replicanti.amount = Decimal.min(uncappedAmount, replicantiCap());
    return remainingGain;
  }

  const gainNeededPerRG = DC.NUMMAX.max(1).log10();
  const replicantiExponent = log10GainFactor.add(Replicanti.amount.max(1).log10());
  const toBuy = Decimal.floor(Decimal.min(replicantiExponent.div(gainNeededPerRG),
    Replicanti.galaxies.max.sub(player.replicanti.galaxies)));
  const maxUsedGain = gainNeededPerRG.times(toBuy).add(replicantiCap().max(1).log10())
    .sub(Replicanti.amount.max(1).log10());
  const remainingGain = log10GainFactor.minus(maxUsedGain).clampMin(0);
  Replicanti.amount = Decimal.pow10(replicantiExponent.sub(gainNeededPerRG.times(toBuy)))
    .clampMax(replicantiCap());
  addReplicantiGalaxies(toBuy);
  return remainingGain;
}

// A caller can explicitly select the over-cap interval when estimating the next Replicanti Galaxy.
export function getReplicantiInterval(overCapOverride, intervalIn) {
  let interval = new Decimal(intervalIn || BASE_REPLICANTI_INTERVAL)
    .timesEffectsOf(Achievement(95))
    .dividedByEffectsOf(Achievement(103), InfinityChallenge(11).reward, TimeStudy(22));
  const amount = Replicanti.amount;
  const overCap = overCapOverride === undefined ? amount.gt(replicantiCap()) : overCapOverride;
  const isSlowed = amount.gte(ReplicantiGrowth.slowdownStart);
  if (TimeStudy(133).isBought && !Achievement(138).isUnlocked) {
    interval = interval.times(10);
  }

  if (isSlowed) {
    let increases = (amount.max(1).log10().sub(ReplicantiGrowth.slowdownStart.log10()))
      .div(ReplicantiGrowth.scaleLog10);
    if (PelleStrikes.eternity.hasStrike && amount.gte(DC.E2000)) {
      // The above code assumes in this case there's 10x scaling for every 1e308 increase;
      // in fact, before e2000 it's only 2x.
      increases = increases.sub(Decimal.log10(5).times(DC.E2000.sub(replicantiCap()).max(1).log10())
        .div(ReplicantiGrowth.scaleLog10));
    }
    interval = interval.times(Decimal.pow(ReplicantiGrowth.scaleFactor, increases));
  }

  interval = interval.divide(totalReplicantiSpeedMult(overCap));

  if (V.isRunning) {
    // This is a boost if interval < 1, but that only happens in EC12
    // and handling it would make the replicanti code a lot more complicated.
    interval = interval.pow(2);
  }
  return interval;
}

// This only counts the "external" multipliers - that is, it doesn't count any speed changes due to being over the cap.
// These multipliers are separated out largely for two reasons - more "dynamic" multipliers (such as overcap scaling
// and celestial nerfs) interact very weirdly and the game balance relies on this behavior, and we also use this same
// value in the multiplier tab too
export function totalReplicantiSpeedMult() {
  let totalMult = DC.D1;

  // These are the only effects active in Pelle - the function shortcuts everything else if we're in Pelle
  totalMult = totalMult.times(PelleRifts.decay.effectValue);
  totalMult = totalMult.times(Pelle.specialGlyphEffect.replication);
  if (Pelle.isDisabled("replicantiIntervalMult")) return totalMult;

  const preCelestialEffects = Effects.product(
    TimeStudy(62),
    TimeStudy(213),
    RealityUpgrade(2),
    RealityUpgrade(6),
    RealityUpgrade(23),
  );
  totalMult = totalMult.times(preCelestialEffects);
  if (TimeStudy(132).isBought) {
    totalMult = totalMult.times(Perk.studyPassive.isBought ? 3 : 1.5);
  }

  if (Replicanti.amount.lt(FRAGMENT_REPLICANTI_SLOWDOWN_START) && Achievement(105).isUnlocked) {
    totalMult = totalMult.times(2);
  }
  totalMult = totalMult.times(getAdjustedGlyphEffect("replicationspeed"));
  if (GlyphAlteration.isAdded("replication")) {
    totalMult = totalMult
      .times(Replicanti.amount.max(1).log10().mul(getSecondaryGlyphEffect("replicationdtgain")).clampMin(1));
  }
  totalMult = totalMult.timesEffectsOf(AlchemyResource.replication, Ra.unlocks.continuousTTBoost.effects.replicanti);

  return totalMult.clampMin(1);
}

export function replicantiCap() {
  const baseCap = EffarigUnlock.infinity.canBeApplied
    ? Currency.infinitiesTotal.value
      .pow(TimeStudy(31).isBought ? 120 : 30)
      .clampMin(1)
      .times(DC.NUMMAX)
    : DC.NUMMAX;
  return baseCap.plus(Fragments.isUnlocked ? Fragments.effectiveAmount : DC.D0);
}

// eslint-disable-next-line complexity
export function replicantiLoop(diff) {
  if (!player.replicanti.unl) return;
  const replicantiBeforeLoop = Replicanti.amount;
  PerformanceStats.start("Replicanti");
  EventHub.dispatch(GAME_EVENT.REPLICANTI_TICK_BEFORE);
  // This gets the pre-cap interval (above the cap we recalculate the interval).
  const interval = getReplicantiInterval();
  const isUncapped = Replicanti.isUncapped;
  const areRGsBeingBought = Replicanti.galaxies.areBeingBought;

  // Figure out how many ticks to calculate for and roll over any leftover time to the next tick. The rollover
  // calculation is skipped if there's more than 100 replicanti ticks per game tick to reduce round-off problems.
  const startingTimer = player.replicanti.timer;
  let tickCount = Decimal.divide(diff.add(startingTimer), interval);
  const isIC11 = InfinityChallenge(11).isRunning;
  if (isIC11 || tickCount.lt(100)) player.replicanti.timer = tickCount.minus(tickCount.floor()).times(interval);
  else player.replicanti.timer = DC.D0;
  tickCount = tickCount.floor();
  if (isIC11) {
    IC11Production.tickBetweenReplicates({
      diff,
      replicantiInterval: interval,
      startingTimer,
      tickCount,
      onReplicate: replicateOnce
    });
  } else {
    IC11Production.replicate(tickCount);
  }

  const singleTickAvg = Replicanti.amount.times(Replicanti.chance);
  // Note that code inside this conditional won't necessarily run every game tick; when game ticks are slower than
  // replicanti ticks, then tickCount will look like [0, 0, 0, 1, 0, 0, ...] on successive game ticks
  if (!isIC11 && (tickCount.gte(100) || (singleTickAvg.gte(10) && tickCount.gte(1)))) {
    // Fast gain: If we're doing a very large number of ticks or each tick produces a lot, then continuous growth
    // every replicanti tick is a good approximation and less intensive than distribution samples. This path will
    // always happen above 1000 replicanti due to how singleTickAvg is calculated, so the over-cap math is only
    // present on this path
    let postScale = Decimal.log10(ReplicantiGrowth.scaleFactor).div(ReplicantiGrowth.scaleLog10);
    if (V.isRunning) {
      postScale = postScale.mul(2);
    }

    // Note that remainingGain is in log10 terms.
    let remainingGain = tickCount.times(Replicanti.chance.add(1).ln()).times(LOG10_E);
    // It is intended to be possible for both of the below conditionals to trigger.
    if (!isUncapped || Replicanti.amount.lte(replicantiCap())) {
      // Some of the gain is "used up" below e308, but if replicanti are uncapped
      // then some may be "left over" for increasing replicanti beyond their cap.
      remainingGain = fastReplicantiBelow308(remainingGain, areRGsBeingBought);
    }
    if (isUncapped && Replicanti.amount.gte(replicantiCap()) && remainingGain.gt(0)) {
      const slowdownStart = ReplicantiGrowth.slowdownStart;
      if (Replicanti.amount.lt(slowdownStart)) {
        const linearGain = Decimal.min(remainingGain, slowdownStart.log10().sub(Replicanti.amount.max(1).log10()));
        Replicanti.amount = Decimal.pow10(Replicanti.amount.max(1).log10().add(linearGain));
        remainingGain = remainingGain.sub(linearGain);
      }
      if (Replicanti.amount.gte(slowdownStart) && remainingGain.gt(0)) {
        // Recalculate the interval after entering the Real Replicanti slowdown.
        const intervalRatio = getReplicantiInterval().div(interval);
        remainingGain = remainingGain.div(intervalRatio);
        Replicanti.amount = remainingGain.div(LOG10_E).times(postScale).plus(1).ln().div(postScale)
          .add(Replicanti.amount.clampMin(1).ln()).exp();
      }
    }
  } else if (!isIC11 && Replicanti.chance.gte(1) && tickCount.gte(1)) {
    // Above 100% Chance, each Replicanti produces the integer part of Chance deterministically and applies the
    // fractional remainder as an ordinary probability. This exact path is short-lived because it quickly reaches
    // the fast-growth branch, while offline processing uses that branch directly.
    for (let t = 0; t < tickCount.toNumber(); t++) {
      Replicanti.amount = Replicanti.amount.plus(replicantiReproductionAmount(Replicanti.amount, Replicanti.chance));
    }
  } else if (!isIC11 && tickCount.gt(1)) {
    // Multiple ticks but "slow" gain: This happens at low replicanti chance and amount with a fast interval, which
    // can happen often in early cel7. In this case we "batch" ticks together as full doubling events and then draw
    // from a Poisson distribution for how many times to do that. Any leftover ticks are used as binomial samples
    const batchTicks = Replicanti.chance.add(1).log(2).mul(tickCount).floor();
    const binomialTicks = tickCount.sub(batchTicks.div(Replicanti.chance.add(1).log(2)));

    Replicanti.amount = Replicanti.amount.times(DC.D2.pow(poissonDistribution(batchTicks)));
    for (let t = 0; t < binomialTicks.floor().toNumber(); t++) {
      const reproduced = binomialDistribution(Replicanti.amount, Replicanti.chance);
      Replicanti.amount = Replicanti.amount.plus(reproduced);
    }

    // The batching might use partial ticks; we add the rest back to the timer so it gets used next loop
    const leftover = binomialTicks.sub(binomialTicks.floor());
    player.replicanti.timer = player.replicanti.timer.add(interval.times(leftover));
  } else if (!isIC11 && tickCount.eq(1)) {
    // Single tick: Take a single binomial sample to properly simulate replicanti growth with randomness
    const reproduced = binomialDistribution(Replicanti.amount, Replicanti.chance);
    Replicanti.amount = Replicanti.amount.plus(reproduced);
  }

  if (!isUncapped) Replicanti.amount = Decimal.min(replicantiCap(), Replicanti.amount);

  if (Pelle.isDoomed && Replicanti.amount.max(1).log10().sub(replicantiBeforeLoop.max(1).log10()).gt(308)) {
    Replicanti.amount = replicantiBeforeLoop.times(1e308);
  }

  if (areRGsBeingBought && Replicanti.galaxies.canBuyMore) {
    const buyer = Autobuyer.replicantiGalaxy;
    const isAuto = buyer.canTick && buyer.isEnabled;
    // There might be a manual and auto tick simultaneously; pass auto === true iff the autobuyer is ticking and
    // we aren't attempting to manually buy RG, because this controls modals appearing or not
    replicantiGalaxy(isAuto && !Replicanti.galaxies.isPlayerHoldingR);
  }
  player.records.thisReality.maxReplicanti = player.records.thisReality.maxReplicanti
    .clampMin(Replicanti.amount);
  EventHub.dispatch(GAME_EVENT.REPLICANTI_TICK_AFTER);
  PerformanceStats.end();
}

export function replicantiMult() {
  return Decimal.pow(Decimal.log2(Fragments.effectiveReplicanti.clampMin(1)), 2)
    .plusEffectOf(TimeStudy(21))
    .timesEffectOf(TimeStudy(102))
    .clampMin(1)
    .pow(getAdjustedGlyphEffect("replicationpow"));
}

/** @abstract */
class ReplicantiUpgradeState {
  /** @abstract */
  get id() { throw new NotImplementedError(); }
  /** @abstract */
  get value() { throw new NotImplementedError(); }

  /** @abstract */
  set value(value) { throw new NotImplementedError(); }

  /** @abstract */
  get nextValue() { throw new NotImplementedError(); }

  /** @abstract */
  get cost() { throw new NotImplementedError(); }
  /** @abstract */
  set cost(value) { throw new Error("Use baseCost to set cost"); }

  /** @abstract */
  get costIncrease() { throw new NotImplementedError(); }

  get baseCost() { return this.cost; }
  /** @abstract */
  set baseCost(value) { throw new NotImplementedError(); }

  get cap() { return undefined; }
  get isCapped() { return false; }

  /** @abstract */
  get autobuyerMilestone() { throw new NotImplementedError(); }

  get canBeBought() {
    return !this.isCapped && Currency.infinityPoints.gte(this.cost) && player.eterc8repl !== 0;
  }

  purchase() {
    if (!this.canBeBought) return;
    Currency.infinityPoints.subtract(this.cost);
    this.baseCost = Decimal.times(this.baseCost, this.costIncrease);
    this.value = this.nextValue;
    if (EternityChallenge(8).isRunning) player.eterc8repl--;
    GameUI.update();
  }

  autobuyerTick() {
    while (this.canBeBought) {
      this.purchase();
    }
  }
}

export const ReplicantiUpgrade = {
  galaxies: new class ReplicantiGalaxiesUpgrade extends ReplicantiUpgradeState {
    get id() { return 3; }

    get value() { return player.replicanti.boughtGalaxyCap; }
    set value(value) { player.replicanti.boughtGalaxyCap = value; }

    get nextValue() {
      return this.value.add(1);
    }

    get cost() {
      return this.baseCost.dividedByEffectsOf(TimeStudy(233), PelleRifts.vacuum.milestones[1]);
    }

    get baseCost() { return player.replicanti.galCost; }
    set baseCost(value) { player.replicanti.galCost = value; }

    get distantRGStart() {
      return GlyphInfo.replication.sacrificeInfo.effect().add(100);
    }

    get remoteRGStart() {
      return GlyphInfo.replication.sacrificeInfo.effect().add(1000);
    }

    get costIncrease() {
      const galaxies = this.value;
      let increase = EternityChallenge(6).isRunning
        ? DC.E2.pow(galaxies).times(DC.E2)
        : DC.E5.pow(galaxies).times(DC.E25);
      if (galaxies.gte(this.distantRGStart)) {
        increase = increase.times(DC.E50.pow(galaxies.sub(this.distantRGStart).add(5)));
      }
      if (galaxies.gte(this.remoteRGStart)) {
        increase = increase.times(DC.E5.pow(Decimal.pow(galaxies.sub(this.remoteRGStart).add(1), 2)));
      }
      return increase;
    }

    get autobuyerMilestone() {
      return EternityMilestone.autobuyerReplicantiGalaxy;
    }

    get extra() {
      return Effects.max(0, TimeStudy(131)).add(PelleRifts.decay.milestones[2].effectOrDefault(0));
    }

    bulkPurchaseCalc() {
      // Copypasted constants
      const logBase = new Decimal(170);
      const logBaseIncrease = EternityChallenge(6).isRunning ? DC.D2 : new Decimal(25);
      const logCostScaling = EternityChallenge(6).isRunning ? DC.D2 : DC.D5;
      const distantReplicatedGalaxyStart = GlyphInfo.replication.sacrificeInfo.effect().add(100);
      const remoteReplicatedGalaxyStart = GlyphInfo.replication.sacrificeInfo.effect().add(1000);
      const logDistantScaling = new Decimal(50);
      const logRemoteScaling = DC.D5;

      const cur = Currency.infinityPoints.value.times(TimeStudy(233).effectOrDefault(1)).max(1).log10();

      if (logBase.gt(cur)) return;
      let a = logCostScaling.div(2);
      let b = logBaseIncrease.sub(logCostScaling.div(2));
      let c = logBase.sub(cur);
      if (decimalQuadraticSolution(a, b, c).floor().lte(distantReplicatedGalaxyStart)) {
        // eslint-disable-next-line consistent-return
        return decimalQuadraticSolution(a, b, c).floor().add(1);
      }
      a = logCostScaling.add(logDistantScaling).div(2);
      // eslint-disable-next-line max-len
      b = logBaseIncrease.sub(logCostScaling.div(2)).sub(logDistantScaling.times(distantReplicatedGalaxyStart)).add(logDistantScaling.times(4.5));
      // eslint-disable-next-line max-len
      c = cur.neg().add(170).add(distantReplicatedGalaxyStart.pow(2).times(logDistantScaling).div(2)).sub(distantReplicatedGalaxyStart.times(4.5).times(logDistantScaling));
      if (decimalQuadraticSolution(a, b, c).floor().lte(remoteReplicatedGalaxyStart)) {
        // eslint-disable-next-line consistent-return
        return decimalQuadraticSolution(a, b, c).floor().add(1);
      }
      a = logRemoteScaling.div(3);

      b = logCostScaling.add(logDistantScaling).div(2).sub(logRemoteScaling.mul(remoteReplicatedGalaxyStart))
        .add(logRemoteScaling.div(2));

      c = logBaseIncrease.sub(logCostScaling.div(2)).sub(distantReplicatedGalaxyStart.times(logDistantScaling))
        .add(logDistantScaling.times(4.5)).add(remoteReplicatedGalaxyStart.pow(2).mul(logRemoteScaling))
        .sub(remoteReplicatedGalaxyStart.mul(logRemoteScaling));

      const d = cur.neg().add(170).add(distantReplicatedGalaxyStart.pow(2).mul(logDistantScaling).div(2))
        .sub(distantReplicatedGalaxyStart.mul(4.5).mul(logDistantScaling))
        .sub(remoteReplicatedGalaxyStart.pow(3).mul(logRemoteScaling).div(3))
        .add(remoteReplicatedGalaxyStart.pow(2).mul(logRemoteScaling).div(2))
        .sub(remoteReplicatedGalaxyStart.mul(logRemoteScaling).div(6));

      // eslint-disable-next-line consistent-return
      return decimalCubicSolution(a, b, c, d, false).floor().add(1);
    }

    autobuyerTick() {
      // This isn't a hot enough autobuyer to worry about doing an actual inverse.
      const bulk = this.bulkPurchaseCalc();
      if (!bulk || bulk.floor().sub(this.value).lte(0)) return;
      Currency.infinityPoints.subtract(this.baseCostAfterCount(this.value).sub(1));
      this.value = this.value.add(bulk.sub(this.value));
      this.baseCost = this.baseCostAfterCount(this.value);
      // The code is weird and if we add one the whole thing goes out to like double + 1, for no reason, so
      // we will instead just do 1 purchase call instead, which can also prevent us overbuying by 1
    }

    baseCostAfterCount(count) {
      const logBase = new Decimal(170);
      const logBaseIncrease = EternityChallenge(6).isRunning ? 2 : 25;
      const logCostScaling = EternityChallenge(6).isRunning ? 2 : 5;
      const distantReplicatedGalaxyStart = GlyphInfo.replication.sacrificeInfo.effect().add(100);
      const remoteReplicatedGalaxyStart = GlyphInfo.replication.sacrificeInfo.effect().add(1000);
      let logCost = logBase.add(count.times(logBaseIncrease))
        .add((count.times(count.sub(1)).div(2)).times(logCostScaling));
      if (count.gt(distantReplicatedGalaxyStart)) {
        const logDistantScaling = new Decimal(50);
        // When distant scaling kicks in, the price increase jumps by a few extra steps.
        // So, the difference between successive scales goes 5, 5, 5, 255, 55, 55, ...
        const numDistant = count.sub(distantReplicatedGalaxyStart);
        logCost = logCost.add(logDistantScaling.times(numDistant).times(numDistant.add(9)).div(2));
      }
      if (count.gt(remoteReplicatedGalaxyStart)) {
        const logRemoteScaling = DC.D5;
        const numRemote = count.sub(remoteReplicatedGalaxyStart);
        // The formula x * (x + 1) * (2 * x + 1) / 6 is the sum of the first n squares.
        logCost = logCost.add(logRemoteScaling.times(numRemote).times(numRemote.add(1))
          .times(numRemote.times(2).add(1)).div(6));
      }
      return Decimal.pow10(logCost);
    }
  }(),
};

export const Replicanti = {
  get areUnlocked() {
    return player.replicanti.unl;
  },
  reset() {
    const unlocked = false;
    player.replicanti = {
      unl: unlocked,
      amount: unlocked ? DC.D1 : DC.D0,
      timer: DC.D0,
      boughtGalaxyCap: DC.D0,
      galaxies: DC.D0,
      galCost: DC.E170,
    };
  },
  unlock(freeUnlock = false) {
    const cost = DC.E140.dividedByEffectOf(PelleRifts.vacuum.milestones[1]);
    if (player.replicanti.unl) return;
    if (freeUnlock || Currency.infinityPoints.gte(cost)) {
      if (!freeUnlock) Currency.infinityPoints.subtract(cost);
      player.replicanti.unl = true;
      player.replicanti.timer = DC.D0;
      Replicanti.amount = DC.D1;
    }
  },
  get amount() {
    return Decimal.fromDecimal(player.replicanti.amount);
  },
  set amount(value) {
    player.replicanti.amount = value;
  },
  get chance() {
    return Decimal.max(BASE_REPLICANTI_CHANCE, Fragments.replicantiChanceProgress)
      .add(EternityUpgrade.replicantiChance.effectOrDefault(0));
  },
  get effectiveAmount() {
    return Fragments.effectiveReplicanti;
  },
  galaxies: {
    isPlayerHoldingR: false,
    get bought() {
      return new Decimal(player.replicanti.galaxies);
    },
    get extra() {
      return Decimal.floor((Effarig.bonusRG).add(Effects.sum(
        TimeStudy(225),
        TimeStudy(226)
      )).times(TimeStudy(303).effectOrDefault(1)));
    },
    get total() {
      return this.bought.add(this.extra);
    },
    get max() {
      return ReplicantiUpgrade.galaxies.value.add(ReplicantiUpgrade.galaxies.extra);
    },
    get nextRequirementLog2() {
      return replicantiGalaxyRequirementLog2(this.bought.add(1));
    },
    get nextRequirement() {
      return Decimal.pow(2, this.nextRequirementLog2);
    },
    get canBuyMore() {
      if (!Replicanti.effectiveAmount.gte(this.nextRequirement)) return false;
      return this.bought.lt(this.max);
    },
    get areBeingBought() {
      const buyer = Autobuyer.replicantiGalaxy;
      if (!this.canBuyMore) return false;
      // If the confirmation is enabled, we presume the player wants to confirm each Replicanti Galaxy purchase
      return (buyer.canTick && buyer.isEnabled) ||
        (!player.options.confirmations.replicantiGalaxy && this.isPlayerHoldingR);
    },
    get gain() {
      if (!this.canBuyMore) return DC.D0;
      if (Achievement(132).isUnlocked && !Fragments.isUnlocked) {
        const maxGain = Replicanti.galaxies.max.sub(player.replicanti.galaxies);
        const logReplicanti = Replicanti.effectiveAmount.max(1).log10();
        return Decimal.min(maxGain, Decimal.floor(logReplicanti.div(LOG10_MAX_VALUE)));
      }
      return DC.D1;
    },
  },
  get isUncapped() {
    return TimeStudy(192).isBought || PelleRifts.vacuum.milestones[1].canBeApplied ||
      Fragments.isStabilizeDecayComplete;
  }
};
