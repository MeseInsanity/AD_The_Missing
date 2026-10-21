import { DC } from "./constants";
import { EternityChallenge } from "./eternity-challenge";
import { Fragments } from "./secret-formula/fragments";
import { IC5Focus } from "./infinity-challenges";

class DimBoostRequirement {
  constructor(tier, amount, { cost = null, usesBought = false } = {}) {
    this.tier = tier;
    this.amount = amount;
    this.cost = cost;
    this.usesBought = usesBought;
  }

  get isSatisfied() {
    const dimension = AntimatterDimension(this.tier);
    if (this.cost) return dimension.cost.gte(this.cost);
    return (this.usesBought ? dimension.bought : dimension.totalAmount).gte(this.amount);
  }
}

export class DimBoost {
  static get power() {
    if (InfinityChallenge(7).isRunning) {
      return DC.D1.add(player.galaxies.times(0.5)).powEffectOf(InfinityChallenge(12).reward);
    }

    const infinityUpgradeBase = new Decimal(InfinityUpgrade.dimboostMult.effectOrDefault(DC.D2))
      .add(EternityUpgrade.achievementDimBoost.effectOrDefault(0));
    const adjustedInfinityUpgradeBase = NormalChallenge.isRuleBreaking
      ? DC.D2.times(infinityUpgradeBase.div(DC.D2).pow(DC.D0_5))
      : infinityUpgradeBase;
    const currentInfinityMultiplier = new Decimal(
      InfinityUpgrade.currentInfinitySacrificeDimBoost.effectOrDefault(DC.D1)
    );
    const adjustedCurrentInfinityMultiplier = NormalChallenge.isRuleBreaking
      ? currentInfinityMultiplier.pow(DC.D0_5)
      : currentInfinityMultiplier;
    let boost = new Decimal(Effects.max(
      2,
      InfinityChallenge(7).reward,
      TimeStudy(81)
    )).max(adjustedInfinityUpgradeBase)
      .timesEffectsOf(
        TimeStudy(83),
        TimeStudy(231),
        Achievement(124),
        Achievement(142),
        GlyphEffect.dimBoostPower,
        PelleRifts.recursion.milestones[0]
      ).times(
        adjustedCurrentInfinityMultiplier
      ).powEffectsOf(
        InfinityUpgrade.dimboostMult.chargedEffect,
        InfinityUpgrade.currentInfinitySacrificeDimBoost.chargedEffect
      );
    boost = boost.times(Achievement(22).effectOrDefault(1));
    if (GlyphAlteration.isAdded("effarig")) boost = boost.pow(getSecondaryGlyphEffect("effarigforgotten"));
    if (NormalChallenge(3).isRunning) {
      const decayExponent = Math.pow(15 / 16, DimBoost.purchasedBoosts.toNumber());
      boost = boost.pow(decayExponent);
    }
    if (NormalChallenge(4).isRunning) boost = boost.pow(2.5);
    if (NormalChallenge(8).isRunning) boost = boost.pow(DC.D0_65);
    return boost.powEffectOf(InfinityChallenge(12).reward);
  }

  static multiplierToNDTier(tier) {
    const normalBoostMult = DimBoost.power.pow(this.purchasedBoosts.add(1).sub(tier)).clampMin(1);
    const imaginaryBoostMult = DimBoost.power.times(ImaginaryUpgrade(24).effectOrDefault(1))
      .pow(this.imaginaryBoosts).clampMin(1);
    return normalBoostMult.times(imaginaryBoostMult);
  }

  static get maxDimensionsUnlockable() {
    return NormalChallenge(12).isRunning ? 6 : 8;
  }

  static get canUnlockNewDimension() {
    return DimBoost.purchasedBoosts.add(4).lt(DimBoost.maxDimensionsUnlockable);
  }

  static get maxBoosts() {
    if (Ra.isRunning) {
      // Ra makes boosting impossible. Note that this function isn't called
      // when giving initial boosts, so the player will still get those.
      return DC.D0;
    }
    return DC.BEMAX;
  }

  static get canBeBought() {
    if (DimBoost.purchasedBoosts.gte(this.maxBoosts)) return false;
    if (player.records.thisInfinity.maxAM.gt(Player.infinityGoal) &&
       (!player.break || Player.isInAntimatterChallenge)) return false;
    return true;
  }

  static get lockText() {
    if (DimBoost.purchasedBoosts.gte(this.maxBoosts)) {
      if (InfinityChallenge(5).isRunning) return "Locked (All Antimatter Dimensions unlocked)";
      if (Ra.isRunning) return "Locked (Ra's Reality)";
    }
    return null;
  }

  static get requirement() {
    return this.bulkRequirement(1);
  }

  static get ic5BoostBulk() {
    if (!InfinityChallenge(5).isRunning || !this.requirement.isSatisfied) return DC.D0;

    const frontierBought = AntimatterDimension(IC5Focus.lowestUnlockedTier).bought;
    const chargedMultiplier = InfinityUpgrade.resetBoost.chargedEffect.effectOrDefault(1);
    let unscaledBought = frontierBought.div(chargedMultiplier).add(Effects.sum(InfinityUpgrade.resetBoost));
    if (InfinityChallenge(6).isCompleted) unscaledBought = unscaledBought.add(1);

    const targetBoosts = unscaledBought.lte(20)
      ? DC.D5
      : unscaledBought.sub(20).div(15).add(5).floor();
    let bulk = targetBoosts.sub(this.purchasedBoosts).max(1).floor();

    // Rounding the requirement after all reductions can move the analytical
    // inverse by one. Correct it with at most a few exact checks.
    while (bulk.gt(1) && !this.bulkRequirement(bulk).isSatisfied) bulk = bulk.sub(1);
    while (this.bulkRequirement(bulk.add(1)).isSatisfied) bulk = bulk.add(1);
    return bulk;
  }

  static bulkRequirement(bulk) {
    const targetResets = DimBoost.purchasedBoosts.add(bulk);
    const isIC5 = InfinityChallenge(5).isRunning;
    const tier = isIC5
      ? IC5Focus.lowestUnlockedTier
      : Decimal.min(targetResets.add(3), this.maxDimensionsUnlockable).toNumber();
    let amount = DC.D20;
    const discount = Effects.sum(
      TimeStudy(211),
      TimeStudy(222)
    );
    if (isIC5) {
      // Each Boost resets the frontier's purchases, so these cannot be
      // safely bulk-bought from the count before the first reset.
      amount = amount.add(targetResets.sub(5).max(0).mul(DC.D15));
    } else if (tier === 6 && NormalChallenge(12).isRunning) {
      amount = amount.add(targetResets.sub(3).mul(DC.D20.sub(discount)).round());
    } else if (tier === 8) {
      const scalingIncrease = DC.D15;
      amount = amount.add(targetResets.sub(5).mul(scalingIncrease.sub(discount)).round());
    }
    if (EternityChallenge(5).isRunning) {
      amount = Decimal.pow(targetResets.sub(1), 3).add(targetResets).add(amount).sub(1);
    }

    amount = amount.sub(Effects.sum(InfinityUpgrade.resetBoost));
    if (InfinityChallenge(6).isCompleted) amount = amount.sub(1);

    amount = amount.times(InfinityUpgrade.resetBoost.chargedEffect.effectOrDefault(1));

    amount = Decimal.round(amount);

    return new DimBoostRequirement(tier, amount, {
      usesBought: isIC5 || InfinityChallenge(11).isRunning
    });
  }

  static get unlockedByBoost() {
    if (DimBoost.lockText !== null) return DimBoost.lockText;
    const boosts = DimBoost.purchasedBoosts;
    const allNDUnlocked = EternityMilestone.unlockAllND.isReached;

    let newUnlock = "";
    if (!allNDUnlocked && boosts.lt(DimBoost.maxDimensionsUnlockable - 4)) {
      newUnlock = `unlock the ${formatInt(boosts.add(5))}th Dimension`;
    } else if (boosts.eq(4) && !NormalChallenge(12).isRunning && !EternityChallenge(3).isRunning) {
      newUnlock = "unlock Sacrifice";
    }

    const formattedMultText = `give a ${formatX(DimBoost.power, 2, 2)} multiplier `;
    let dimensionRange = `to the 1st Dimension`;
    if (boosts.gt(0)) dimensionRange = `to Dimensions 1-${Decimal.min(boosts.add(1), 8)}`;
    if (boosts.gte(DimBoost.maxDimensionsUnlockable - 1)) dimensionRange = `to all Dimensions`;

    let boostEffects;
    if (newUnlock === "") boostEffects = `${formattedMultText} ${dimensionRange}`;
    else boostEffects = `${newUnlock} and ${formattedMultText} ${dimensionRange}`;

    if (boostEffects === "") return "Dimension Boosts are currently useless";
    const areDimensionsKept = Perk.antimatterNoReset.isBought &&
      (!Pelle.isDoomed || PelleUpgrade.dimBoostResetsNothing.isBought);
    if (areDimensionsKept) return boostEffects[0].toUpperCase() + boostEffects.substring(1);
    return `Reset your Dimensions to ${boostEffects}`;
  }

  static get purchasedBoosts() {
    return Decimal.fromDecimal(player.dimensionBoosts.floor());
  }

  static get imaginaryBoosts() {
    return Ra.isRunning
      ? DC.D0
      : ImaginaryUpgrade(12).effectOrDefault(DC.D0).mul(ImaginaryUpgrade(23).effectOrDefault(DC.D1));
  }

  static get totalBoosts() {
    return Decimal.floor(this.purchasedBoosts.add(this.imaginaryBoosts));
  }

  static get startingDimensionBoosts() {
    if (InfinityUpgrade.skipResetGalaxy.isBought) return DC.D4;
    if (InfinityUpgrade.skipReset3.isBought) return DC.D3;
    if (InfinityUpgrade.skipReset2.isBought) return DC.D2;
    if (InfinityUpgrade.skipReset1.isBought) return DC.D1;
    return DC.D0;
  }
}

// eslint-disable-next-line max-params
export function softReset(tempBulk, forcedADReset = false, forcedAMReset = false, enteringAntimatterChallenge = false) {
  if (Currency.antimatter.gt(Player.infinityLimit)) return;
  const bulk = Decimal.min(tempBulk, DimBoost.maxBoosts.sub(player.dimensionBoosts));
  EventHub.dispatch(GAME_EVENT.DIMBOOST_BEFORE, bulk);
  player.dimensionBoosts = (Decimal.max(DC.D0, player.dimensionBoosts.add(bulk)));
  if (InfinityChallenge(4).isRunning && bulk.gt(0)) {
    player.challenge.infinity.dimBoosts = (player.challenge.infinity.dimBoosts ?? DC.D0).add(bulk);
  }
  if (NormalChallenge(5).isRunning && bulk.neq(0)) {
    player.chall5Sacrifices = 0;
    player.chall5Pow = DC.D1;
  }
  resetChallengeStuff();
  const canKeepDimensions = Pelle.isDoomed
    ? PelleUpgrade.dimBoostResetsNothing.canBeApplied
    : (Perk.antimatterNoReset.canBeApplied || Fragments.isInfinityPowerDrainComplete);
  if (forcedADReset || !canKeepDimensions) {
    AntimatterDimensions.reset();
    player.sacrificed = DC.D0;
    resetTickspeed();
  }
  skipResetsIfPossible(enteringAntimatterChallenge);
  const canKeepAntimatter = Pelle.isDoomed
    ? PelleUpgrade.dimBoostResetsNothing.canBeApplied
    : (Achievement(117).isUnlocked || Perk.antimatterNoReset.canBeApplied || Fragments.isInfinityPowerDrainComplete);
  if (!forcedAMReset && canKeepAntimatter) {
    Currency.antimatter.bumpTo(Currency.antimatter.startingValue);
  } else {
    Currency.antimatter.reset();
  }
  EventHub.dispatch(GAME_EVENT.DIMBOOST_AFTER, bulk);
}

export function skipResetsIfPossible(enteringAntimatterChallenge) {
  if (enteringAntimatterChallenge || Player.isInAntimatterChallenge) return;
  if (InfinityUpgrade.skipResetGalaxy.isBought && player.dimensionBoosts.lt(4)) {
    player.dimensionBoosts = DC.D4;
    if (player.galaxies.lt(1)) player.galaxies = DC.D1;
  } else if (InfinityUpgrade.skipReset3.isBought && player.dimensionBoosts.lt(3)) player.dimensionBoosts = DC.D3;
  else if (InfinityUpgrade.skipReset2.isBought && player.dimensionBoosts.lt(2)) player.dimensionBoosts = DC.D2;
  else if (InfinityUpgrade.skipReset1.isBought && player.dimensionBoosts.lt(1)) player.dimensionBoosts = DC.D1;
}

export function manualRequestDimensionBoost(bulk) {
  if (Currency.antimatter.gt(Player.infinityLimit) || !DimBoost.requirement.isSatisfied) return;
  if (!DimBoost.canBeBought) return;
  if (GameEnd.creditsEverClosed) return;
  if (player.options.confirmations.dimensionBoost) {
    Modal.dimensionBoost.show({ bulk });
    return;
  }
  requestDimensionBoost(bulk);
}

export function requestDimensionBoost(bulk) {
  if (Currency.antimatter.gt(Player.infinityLimit) || !DimBoost.requirement.isSatisfied) return;
  if (!DimBoost.canBeBought) return;
  Tutorial.turnOffEffect(TUTORIAL_STATE.DIMBOOST);
  if (BreakInfinityUpgrade.autobuyMaxDimboosts.isBought && bulk) maxBuyDimBoosts();
  else softReset(1);
}

function maxBuyDimBoosts() {
  if (InfinityChallenge(5).isRunning) {
    const bulk = DimBoost.ic5BoostBulk;
    if (bulk.gt(0)) softReset(bulk);
    return;
  }
  // Boosts that unlock new dims are bought one at a time, unlocking the next dimension
  if (DimBoost.canUnlockNewDimension) {
    if (DimBoost.requirement.isSatisfied) softReset(1);
    return;
  }
  const req1 = DimBoost.bulkRequirement(1);
  if (!req1.isSatisfied) return;
  const req2 = DimBoost.bulkRequirement(2);
  if (!req2.isSatisfied) {
    softReset(1);
    return;
  }

  const tier = DimBoost.maxDimensionsUnlockable;
  let amount = DC.D20;
  const discount = Effects.sum(
    TimeStudy(211),
    TimeStudy(222)
  );
  let multiplierPerDB;
  if (tier === 6) {
    multiplierPerDB = DC.D20.sub(discount);
  } else if (tier === 8) {
    multiplierPerDB = DC.D15.sub(discount);
  }

  amount = amount.sub(Effects.sum(InfinityUpgrade.resetBoost));
  if (InfinityChallenge(6).isCompleted) amount = amount.sub(1);

  multiplierPerDB = multiplierPerDB.times(InfinityUpgrade.resetBoost.chargedEffect.effectOrDefault(1));
  amount = amount.times(InfinityUpgrade.resetBoost.chargedEffect.effectOrDefault(1));

  const dimension = AntimatterDimension(tier);
  const ad = InfinityChallenge(11).isRunning ? dimension.bought : dimension.totalAmount;
  let calcBoosts;
  calcBoosts = ad.sub(amount).div(multiplierPerDB);


  if (EternityChallenge(5).isRunning) {
    calcBoosts = decimalCubicSolution(DC.D1, DC.D1.neg(), multiplierPerDB.add(2), ad.add(18).neg());
  }

  calcBoosts = calcBoosts.add(NormalChallenge(12).isRunning ? 2 : 4);
  // Dimension boosts 1-4 dont use 8th dims, 1-2 dont use 6th dims, so add those extras afterwards.

  // Add one cause (x-b)/i is off by one otherwise
  if (calcBoosts.floor().add(1).lte(DimBoost.purchasedBoosts)) return;
  calcBoosts = calcBoosts.sub(DimBoost.purchasedBoosts);
  const minBoosts = Decimal.min(DC.BEMAX, calcBoosts.floor().add(1));

  softReset(minBoosts);
}
