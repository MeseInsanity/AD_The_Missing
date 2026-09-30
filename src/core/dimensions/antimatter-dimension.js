import { DC } from "../constants";
import {
  normalChallenge10PurchasesRemaining,
  normalChallenge11MatterPenalty,
  recordNormalChallenge10Purchases
} from "../normal-challenges";
import { effectiveGalaxyCount } from "../tickspeed";

import { DimensionState } from "./dimension";

const NC9_BASE_COSTS = [null, DC.E1, DC.D1, DC.D1, DC.D1, DC.D1, DC.D1, DC.D1, DC.D1];
const NC9_BASE_COST_MULTIPLIERS = [
  null,
  DC.E3,
  DC.E4,
  DC.E4,
  DC.E4,
  DC.E4,
  DC.E4,
  DC.E4,
  Decimal.pow(10, 3.5)
];

function ruleBreakingInfinityUpgradeMultiplier(effect) {
  return NormalChallenge.isRuleBreaking ? effect.pow(DC.D0_5) : effect;
}

function ruleBreakingAchievementMultiplier(effect) {
  const multiplier = new Decimal(effect);
  return NormalChallenge.isRuleBreaking ? multiplier.pow(DC.D0_5) : multiplier;
}

// Multiplier applied to all Antimatter Dimensions, regardless of tier. This is cached using a Lazy
// and invalidated every update.
export function antimatterDimensionCommonMultiplier() {
  let multiplier = DC.D1;

  multiplier = multiplier.times(Achievements.power);

  if (!EternityChallenge(9).isRunning) {
    multiplier = multiplier.times(Currency.infinityPower.value.pow(InfinityDimensions.powerConversionRate).max(1));
  }
  const infinityUpgradeMultiplier = Effects.product(
    InfinityUpgrade.totalTimeMult,
    InfinityUpgrade.dim18mult,
    InfinityUpgrade.thisInfinityTimeMult,
    InfinityUpgrade.unspentIPMult,
    InfinityUpgrade.unspentIPMult.chargedEffect,
    InfinityUpgrade.bestInfinityTimeDimensions
  );
  multiplier = multiplier.times(ruleBreakingInfinityUpgradeMultiplier(infinityUpgradeMultiplier));

  const achievementMultiplier = Effects.product(
    Achievement(48),
    Achievement(56),
    Achievement(65),
    Achievement(72),
    Achievement(73),
    Achievement(74),
    Achievement(76),
    Achievement(84),
    Achievement(91),
    Achievement(92)
  );
  multiplier = multiplier.times(ruleBreakingAchievementMultiplier(achievementMultiplier));

  multiplier = multiplier.timesEffectsOf(
      BreakInfinityUpgrade.totalAMMult,
      TimeStudy(91),
    TimeStudy(101),
    TimeStudy(161),
    TimeStudy(193),
    InfinityChallenge(3),
    InfinityChallenge(3).reward,
    InfinityChallenge(8),
    EternityChallenge(10),
    AlchemyResource.dimensionality,
    PelleUpgrade.antimatterDimensionMult
  );

  multiplier = multiplier.dividedByEffectOf(InfinityChallenge(6));
  multiplier = multiplier.times(getAdjustedGlyphEffect("powermult"));
  multiplier = multiplier.times(Currency.realityMachines.value.powEffectOf(AlchemyResource.force));

  if (Pelle.isDoomed) multiplier = multiplier.dividedBy(10);

  return multiplier;
}

function normalChallenge5MultiplierExponent(tier) {
  const dimensionLog = AntimatterDimension(tier).amount.max(1).log10();
  const sacrificeExtension = Sacrifice.totalBoost.sub(200).div(800).clampMin(0).clampMax(1);
  const penaltyScale = DC.D1.add(sacrificeExtension).times(50);
  const penaltyExponent = DC.D1.div(DC.D1.add(dimensionLog.div(penaltyScale).pow(4)));
  const elapsedProgress = (player.chall5Pow ?? DC.D1).clampMin(0).clampMax(1);
  const sacrificeCount = player.chall5Sacrifices ?? 0;
  const maximumRelief = Math.pow(0.95, Math.max(0, sacrificeCount - 1));
  const timedRelief = elapsedProgress.lt(1)
    ? DC.D0_5.pow(elapsedProgress.times(8))
    : DC.D0;
  const activeRelief = timedRelief.times(maximumRelief);
  return DC.D1.sub(DC.D1.sub(penaltyExponent).times(DC.D1.sub(activeRelief)));
}

export function getDimensionFinalMultiplierUncached(tier) {
  if (tier < 1 || tier > 8) throw new Error(`Invalid Antimatter Dimension tier ${tier}`);
  if (NormalChallenge(12).isRunning && tier > 6) return DC.D1;
  if (EternityChallenge(11).isRunning) {
    return Currency.infinityPower.value.pow(
      InfinityDimensions.powerConversionRate
    ).max(1).times(DimBoost.multiplierToNDTier(tier));
  }

  let multiplier = DC.D1;

  multiplier = applyNDMultipliers(multiplier, tier);
  multiplier = applyNDPowers(multiplier, tier);

  const glyphDilationPowMultiplier = getAdjustedGlyphEffect("dilationpow");
  if (player.dilation.active || PelleStrikes.dilation.hasStrike) {
    multiplier = dilatedValueOf(multiplier.pow(glyphDilationPowMultiplier));
  } else if (Enslaved.isRunning) {
    multiplier = dilatedValueOf(multiplier);
  }
  multiplier = multiplier.timesEffectOf(DilationUpgrade.ndMultDT);

  if (Effarig.isRunning) {
    multiplier = Effarig.multiplier(multiplier);
  } else if (V.isRunning) {
    multiplier = multiplier.pow(0.5);
  }

  // This power effect goes intentionally after all the nerf effects and shouldn't be moved before them
  if (AlchemyResource.inflation.isUnlocked && multiplier.gte(AlchemyResource.inflation.effectValue)) {
    multiplier = multiplier.pow(1.05);
  }

  if (tier === 1 && NormalChallenge(2).isRunning) {
    const tickspeedPurchases = player.totalTickBought.add(1);
    const purchaseExponent = effectiveGalaxyCount().times(0.0125).add(0.2);
    multiplier = multiplier.pow(tickspeedPurchases.pow(purchaseExponent));
  }

  if (NormalChallenge(5).isRunning) {
    multiplier = multiplier.pow(normalChallenge5MultiplierExponent(tier));
  }

  if (NormalChallenge(11).isRunning) {
    multiplier = multiplier.div(normalChallenge11MatterPenalty());
  }

  return multiplier;
}

function applyNDMultipliers(mult, tier) {
  let multiplier = mult.times(GameCache.antimatterDimensionCommonMultiplier.value);

  // Achievement 4-3 extends all first-row rewards to every Antimatter Dimension.
  const firstRowStart = Achievement(43).isUnlocked ? 1 : tier;
  for (let rewardTier = firstRowStart; rewardTier <= 8; rewardTier++) {
    multiplier = multiplier.times(ruleBreakingAchievementMultiplier(Achievement(rewardTier + 10).effectOrDefault(1)));
  }

  let buy10Value;
  if (Laitela.continuumActive) {
    buy10Value = AntimatterDimension(tier).continuumValue.div(10);
  } else {
    buy10Value = Decimal.floor(AntimatterDimension(tier).bought.div(10));
  }

  let buyTenMultiplier = NormalChallenge(2).isRunning && tier > 1
    ? DC.D1
    : AntimatterDimensions.buyTenMultiplier;
  if (NormalChallenge(3).isRunning) {
    const dimensionPurchases = AntimatterDimension(tier).bought.max(1);
    const purchasePower = 0.01 * Math.pow(2, (tier - 1) / 7);
    buyTenMultiplier = buyTenMultiplier.pow(dimensionPurchases.pow(purchasePower));
  }
  if (NormalChallenge(7).isRunning && player.postC4Tier !== tier) {
    const remainingEffect = DC.D1.sub(player.totalTickBought.div(300)).clampMin(0);
    buyTenMultiplier = DC.D1.add(buyTenMultiplier.sub(1).times(remainingEffect));
  }
  multiplier = multiplier.times(Decimal.pow(buyTenMultiplier, buy10Value));
  if (tier > 1 && (NormalChallenge(9).isRunning || Achievement(58).isUnlocked)) {
    const lowerTierBuy10Value = Decimal.floor(AntimatterDimension(tier - 1).bought.div(10));
    let lowerTierPower = NormalChallenge(9).isRunning
      ? new Decimal(0.1)
      : new Decimal(Achievement(58).effectOrDefault(0));
    if (NormalChallenge.isRuleBreaking && !NormalChallenge(9).isRunning) lowerTierPower = lowerTierPower.times(DC.D0_5);
    multiplier = multiplier.times(Decimal.pow(buyTenMultiplier, lowerTierBuy10Value.times(lowerTierPower)));
  }
  multiplier = multiplier.times(DimBoost.multiplierToNDTier(tier));

  if (tier === 1) {
    multiplier = multiplier.timesEffectOf(BreakInfinityUpgrade.currentAMMult);
    const firstDimensionAchievementMultiplier = Effects.product(
      Achievement(28),
      Achievement(31),
      Achievement(68),
      Achievement(71)
    );
    multiplier = multiplier.times(ruleBreakingAchievementMultiplier(firstDimensionAchievementMultiplier))
      .timesEffectOf(TimeStudy(234));
  }
  if (tier === 8) {
    multiplier = multiplier.timesEffectOf(BreakInfinityUpgrade.averageAMMult).times(Sacrifice.totalBoost);
  }

  const tierAchievementMultiplier = Effects.product(
    tier === 8 ? Achievement(23) : null,
    tier < 8 ? Achievement(34) : null,
    tier <= 4 ? Achievement(64) : null
  );
  multiplier = multiplier.times(ruleBreakingAchievementMultiplier(tierAchievementMultiplier)).timesEffectsOf(
    tier < 8 ? TimeStudy(71) : null,
    tier === 8 ? TimeStudy(214) : null,
    tier > 1 && tier < 8 ? InfinityChallenge(8).reward : null
  );
  multiplier = multiplier.clampMin(1);

  return multiplier;
}

function applyNDPowers(mult, tier) {
  let multiplier = mult;
  const glyphPowMultiplier = new Decimal(getAdjustedGlyphEffect("powerpow"));
  const glyphEffarigPowMultiplier = getAdjustedGlyphEffect("effarigdimensions");

  if (InfinityChallenge(4).isRunning && player.postC4Tier !== tier) {
    multiplier = multiplier.pow(InfinityChallenge(4).effectValue);
  }
  if (InfinityChallenge(4).isCompleted) {
    multiplier = multiplier.pow(InfinityChallenge(4).reward.effectValue);
  }

  multiplier = multiplier.pow(glyphPowMultiplier.times(glyphEffarigPowMultiplier).times(Ra.momentumValue));

  multiplier = multiplier
    .powEffectsOf(
      InfinityUpgrade.totalTimeMult.chargedEffect,
      InfinityUpgrade.dim18mult.chargedEffect,
      InfinityUpgrade.thisInfinityTimeMult.chargedEffect,
      InfinityUpgrade.bestInfinityTimeDimensions.chargedEffect,
      AlchemyResource.power,
      Achievement(183),
      PelleRifts.paradox
    );

  multiplier = multiplier.pow(getAdjustedGlyphEffect("curseddimensions"));

  multiplier = multiplier.pow(VUnlocks.adPow.effectOrDefault(1));

  if (PelleStrikes.infinity.hasStrike) {
    multiplier = multiplier.pow(0.5);
  }


  return multiplier;
}

function onBuyDimension(tier) {
  if (tier === 1) Tutorial.turnOffEffect(TUTORIAL_STATE.DIM1);
  if (tier === 2) Tutorial.turnOffEffect(TUTORIAL_STATE.DIM2);
  Achievement(10 + tier).unlock();
  Achievement(23).tryUnlock();

  if (player.speedrun.isActive && !player.speedrun.hasStarted) Speedrun.startTimer();

  if (NormalChallenge(6).isRunning) player.chall2Pow = DC.D1;
  if (InfinityChallenge(1).isRunning) {
    AntimatterDimensions.resetAmountUpToTier(tier - 1);
  }

  player.postC4Tier = tier;
  player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
  if (tier !== 8) player.requirementChecks.eternity.onlyAD8 = false;
  if (tier !== 1) player.requirementChecks.eternity.onlyAD1 = false;
  if (tier === 8) player.requirementChecks.infinity.noAD8 = false;
  if (tier === 1) player.requirementChecks.eternity.noAD1 = false;
}

export function buyOneDimension(tier) {
  const dimension = AntimatterDimension(tier);
  if (Laitela.continuumActive || !dimension.isAvailableForPurchase || !dimension.isAffordable ||
    normalChallenge10PurchasesRemaining() < 1) return false;

  const cost = dimension.cost;

  if (tier === 8 && Enslaved.isRunning && AntimatterDimension(8).bought.gte(1)) return false;

  dimension.currencyAmount = dimension.currencyAmount.minus(cost).max(0);

  if (dimension.boughtBefore10.eq(9)) {
    dimension.challengeCostBump();
  }

  dimension.amount = dimension.amount.plus(1);
  dimension.bought = dimension.bought.add(1);
  recordNormalChallenge10Purchases(1);

  if (tier === 1) {
    Achievement(28).tryUnlock();
  }

  onBuyDimension(tier);

  return true;
}

export function buyManyDimension(tier) {
  const dimension = AntimatterDimension(tier);
  if (Laitela.continuumActive || !dimension.isAvailableForPurchase) return false;
  if (NormalChallenge(10).isRunning) return buyMaxDimension(tier, 1);
  if (NormalChallenge(9).isRunning) return buyAsManyAsYouCanBuy(tier);
  if (!dimension.isAffordableUntil10) return false;
  const cost = dimension.costUntil10;

  if (tier === 8 && Enslaved.isRunning) return buyOneDimension(8);

  dimension.currencyAmount = dimension.currencyAmount.minus(cost).max(0);
  dimension.challengeCostBump();
  dimension.amount = dimension.amount.plus(dimension.remainingUntil10);
  dimension.bought = dimension.bought.add(dimension.remainingUntil10);

  onBuyDimension(tier);

  return true;
}

export function buyAsManyAsYouCanBuy(tier) {
  const dimension = AntimatterDimension(tier);
  if (Laitela.continuumActive || !dimension.isAvailableForPurchase || !dimension.isAffordable) return false;
  if (NormalChallenge(10).isRunning) return buyMaxDimension(tier);
  const howMany = dimension.howManyCanBuy;
  const cost = dimension.cost.times(howMany);

  if (tier === 8 && Enslaved.isRunning) return buyOneDimension(8);

  dimension.currencyAmount = dimension.currencyAmount.minus(cost).max(0);
  dimension.challengeCostBump();
  dimension.amount = dimension.amount.plus(howMany);
  dimension.bought = dimension.bought.add(howMany);

  onBuyDimension(tier);

  return true;
}

// This function doesn't do cost checking as challenges generally modify costs, it just buys and updates dimensions
function buyUntilTen(tier) {
  if (Laitela.continuumActive) return;
  const dimension = AntimatterDimension(tier);
  dimension.challengeCostBump();
  dimension.amount = Decimal.round(dimension.amount.plus(dimension.remainingUntil10));
  dimension.bought = dimension.bought.add(dimension.remainingUntil10);
  onBuyDimension(tier);
}

export function maxAll() {
  if (Laitela.continuumActive) return;

  player.requirementChecks.infinity.maxAll = true;

  for (let tier = 1; tier < 9; tier++) {
    buyMaxDimension(tier);
  }

  // Do this here because tickspeed might not have been unlocked before
  // (and maxAll might have unlocked it by buying dimensions).
  buyMaxTickSpeed();
}

export function buyMaxDimension(tier, bulk = Infinity) {
  const dimension = AntimatterDimension(tier);
  if (Laitela.continuumActive || !dimension.isAvailableForPurchase) return;
  if (NormalChallenge(10).isRunning) {
    const maxPurchases = bulk === Infinity ? Infinity : new Decimal(bulk).times(10).toNumber();
    for (let purchases = 0; purchases < maxPurchases && buyOneDimension(tier); purchases++) {
      // NC10 needs exact individual-purchase accounting, including partial Buy 10 purchases at the cap.
    }
    return;
  }
  if (!dimension.isAffordableUntil10) return;
  const cost = dimension.costUntil10;
  let bulkLeft = new Decimal(bulk);
  const goal = Player.infinityGoal;
  if (dimension.cost.gt(goal) && Player.isInAntimatterChallenge) return;

  if (tier === 8 && Enslaved.isRunning) {
    buyOneDimension(8);
    return;
  }

  // Buy any remaining until 10 before attempting to bulk-buy
  if (dimension.currencyAmount.gte(cost)) {
    dimension.currencyAmount = dimension.currencyAmount.minus(cost).max(0);
    buyUntilTen(tier);
    bulkLeft = bulkLeft.sub(1);
  }

  if (bulkLeft.lte(0)) return;

  // Buy in a while loop in order to properly trigger abnormal price increases
  if (InfinityChallenge(5).isRunning) {
    while (dimension.isAffordableUntil10 && dimension.cost.lt(goal) && bulkLeft.gt(0)) {
      // We can use dimension.currencyAmount or Currency.antimatter here, they're the same,
      // but it seems safest to use dimension.currencyAmount for consistency.
      dimension.currencyAmount = dimension.currencyAmount.minus(dimension.costUntil10).max(0);
      buyUntilTen(tier);
      bulkLeft = bulkLeft.sub(1);
    }
    return;
  }

  // This is the bulk-buy math, explicitly ignored if abnormal cost increases are active
  const maxBought = dimension.costScale.getMaxBought(
    Decimal.floor(dimension.bought.div(10)).add(dimension.costBumps), dimension.currencyAmount, DC.E1
  );
  if (maxBought === null) {
    return;
  }
  let buying = maxBought.quantity;
  if (buying.gt(bulkLeft)) buying = new Decimal(bulkLeft);
  if (buying.lte(0)) return;
  dimension.amount = dimension.amount.plus(buying.times(10));
  dimension.bought = dimension.bought.add(buying.times(10));
  dimension.currencyAmount = dimension.currencyAmount.minus(Decimal.pow10(maxBought.logPrice)).max(0);
}

class AntimatterDimensionState extends DimensionState {
  constructor(tier) {
    super(() => player.dimensions.antimatter, tier);
    const BASE_COSTS = [null, DC.E1, DC.E2, DC.E4, DC.E6, DC.E9, DC.E13, DC.E18, DC.E24];
    this._baseCost = BASE_COSTS[tier];
    const BASE_COST_MULTIPLIERS = [null, DC.E3, DC.E4, DC.E5, DC.E6, DC.E8, DC.E10, DC.E12, DC.E15];
    this._baseCostMultiplier = BASE_COST_MULTIPLIERS[tier];
    this._nc9BaseCost = NC9_BASE_COSTS[tier];
    this._nc9BaseCostMultiplier = NC9_BASE_COST_MULTIPLIERS[tier];
  }

  /**
   * @returns {ExponentialCostScaling}
   */
  get costScale() {
    return new ExponentialCostScaling({
      baseCost: NormalChallenge(9).isRunning ? this._nc9BaseCost : this._baseCost,
      baseIncrease: NormalChallenge(9).isRunning ? this._nc9BaseCostMultiplier : this._baseCostMultiplier,
      costScale: new Decimal(Player.dimensionMultDecrease),
      scalingCostThreshold: DC.NUMMAX
    });
  }

  /**
   * @returns {Decimal}
   */
  get cost() {
    if (NormalChallenge(9).isRunning) {
      const purchases = this.bought.div(DC.E1).floor().add(this.costBumps);
      const cost = this._nc9BaseCost.times(this._nc9BaseCostMultiplier.pow(purchases));
      return this.tier === 8 ? cost.div(Sacrifice.totalBoost) : cost;
    }
    return this.costScale.calculateCost(this.bought.div(DC.E1).floor().add(this.costBumps));
  }

  /** @returns {number} */
  get costBumps() { return this.data.costBumps; }
  /** @param {number} value */
  set costBumps(value) { this.data.costBumps = value; }

  /**
   * @returns {number}
   */
  get boughtBefore10() {
    return this.bought.mod(10);
  }

  /**
   * @returns {number}
   */
  get remainingUntil10() {
    return DC.E1.sub(this.boughtBefore10);
  }

  /**
   * @returns {Decimal}
   */
  get costUntil10() {
    return this.cost.times(this.remainingUntil10);
  }

  get howManyCanBuy() {
    const ratio = this.currencyAmount.dividedBy(this.cost);
    return Decimal.floor(Decimal.max(Decimal.min(ratio, DC.E1.sub(this.boughtBefore10)), 0));
  }

  /**
   * @returns {InfinityUpgrade}
   */
  get infinityUpgrade() {
    switch (this.tier) {
      case 1:
      case 8:
        return InfinityUpgrade.dim18mult;
      case 2:
      case 7:
        return InfinityUpgrade.dim27mult;
      case 3:
      case 6:
        return InfinityUpgrade.dim36mult;
      case 4:
      case 5:
        return InfinityUpgrade.dim45mult;
    }
    return false;
  }

  /**
   * @returns {Decimal}
   */
  get rateOfChange() {
    const tier = this.tier;
    if (tier === 8 || (tier > 3 && EternityChallenge(3).isRunning)) {
      return DC.D0;
    }

    let toGain;
    if (tier === 7 && EternityChallenge(7).isRunning) {
      toGain = InfinityDimension(1).productionPerSecond.times(10);
    } else {
      toGain = AntimatterDimension(tier + 1).productionPerSecond;
    }
    return toGain.times(10).dividedBy(this.amount.max(1)).times(getGameSpeedupForDisplay());
  }

  /**
   * @returns {boolean}
   */
  get isProducing() {
    const tier = this.tier;
    if ((EternityChallenge(3).isRunning && tier > 4) ||
      (NormalChallenge(12).isRunning && tier > 6) ||
      (Laitela.isRunning && tier > Laitela.maxAllowedDimension)) {
      return false;
    }
    return this.totalAmount.gt(0);
  }

  /**
   * @returns {Decimal}
   */
  get currencyAmount() {
    if (NormalChallenge(9).isRunning && this.tier > 1) return AntimatterDimension(this.tier - 1).amount;
    return Currency.antimatter.value;
  }

  /**
   * @param {Decimal} value
   */
  set currencyAmount(value) {
    if (NormalChallenge(9).isRunning && this.tier > 1) {
      AntimatterDimension(this.tier - 1).amount = value;
      return;
    }
    Currency.antimatter.value = value;
  }

  /**
   * @returns {number}
   */
  get continuumValue() {
    if (!this.isAvailableForPurchase) return DC.D0;
    // Nameless limits dim 8 purchases to 1 only
    // Continuum should be no different
    if (this.tier === 8 && Enslaved.isRunning) return DC.D1;
    // It's safe to use dimension.currencyAmount because this is
    // a dimension-only method (so don't just copy it over to tickspeed).
    // We need to use dimension.currencyAmount here because of different costs in NC6.
    const contVal = this.costScale.getContinuumValue(this.currencyAmount, DC.E1);
    return contVal ? contVal.times(Laitela.matterExtraPurchaseFactor) : DC.D0;
  }

  /**
   * @returns {number}
   */
  get continuumAmount() {
    if (!Laitela.continuumActive) return DC.D0;
    return this.continuumValue.floor();
  }

  /**
   * Continuum doesn't continually update dimension amount because that would require making the code
   * significantly messier to handle it properly. Instead an effective amount is calculated here, which
   * is only used for production and checking for boost/galaxy. Doesn't affect achievements.
   * Taking the max is kind of a hack but it seems to work in all cases. Obviously it works if
   * continuum isn't unlocked. If the dimension is being produced and the continuum is unlocked,
   * the dimension will be being produced in large numbers (since the save is endgame), so the amount
   * will be larger than the continuum and so the continuum is insignificant, which is fine.
   * If the dimension isn't being produced, the continuum will be at least the amount, so
   * the continuum will be used and that's fine. Note that when continuum is first unlocked,
   * both 8d amount and 8d continuum will be nonzero until the next infinity, so taking the sum
   * doesn't work.
   * @param {Decimal} value
   */
  get totalAmount() {
    return this.amount.max(this.continuumAmount);
  }

  /**
    * @returns {boolean}
    */
  get isAffordable() {
    if (Laitela.continuumActive) return false;
    if (!player.break && this.cost.gt(DC.NUMMAX)) return false;
    return this.cost.lte(this.currencyAmount);
  }

  /**
   * @returns {boolean}
   */
  get isAffordableUntil10() {
    if (!player.break && this.cost.gt(DC.NUMMAX)) return false;
    return this.costUntil10.lte(this.currencyAmount);
  }

  get isAvailableForPurchase() {
    if (!EternityMilestone.unlockAllND.isReached && DimBoost.totalBoosts.add(4).lt(this.tier)) return false;
    const hasPrevTier = this.tier === 1 || AntimatterDimension(this.tier - 1).totalAmount.gt(0);
    if (!EternityMilestone.unlockAllND.isReached && !hasPrevTier) return false;
    return this.tier < 7 || !NormalChallenge(12).isRunning;
  }

  reset() {
    this.amount = DC.D0;
    this.bought = DC.D0;
    this.costBumps = DC.D0;
  }

  resetAmount() {
    this.amount = DC.D0;
  }

  challengeCostBump() {
    if (InfinityChallenge(5).isRunning) this.multiplyIC5Costs();
  }

  multiplyIC5Costs() {
    for (const dimension of AntimatterDimensions.all.filter(dim => dim.tier !== this.tier)) {
      if (this.tier <= 4 && dimension.cost.lt(this.cost)) {
        dimension.costBumps = dimension.costBumps.add(1);
      } else if (this.tier >= 5 && dimension.cost.gt(this.cost)) {
        dimension.costBumps = dimension.costBumps.add(1);
      }
    }
  }

  get multiplier() {
    return GameCache.antimatterDimensionFinalMultipliers[this.tier].value;
  }

  get cappedProductionInNormalChallenges() {
    const postBI = true;
    const postBreak = (player.break && !NormalChallenge.isRunning) ||
      InfinityChallenge.isRunning ||
      Enslaved.isRunning;
    if (postBI && postBreak) return DC.BEMAX;
    return postBreak ? DC.BIMAX : DC.E315;
  }

  get productionPerSecond() {
    const tier = this.tier;
    if (Laitela.isRunning && tier > Laitela.maxAllowedDimension) return DC.D0;
    let production = this.totalAmount.times(this.multiplier).times(Tickspeed.perSecond);
    if (tier === 1) {
      if (production.gt(10)) {
        const log10 = production.max(1).log10();
        production = Decimal.pow10(Decimal.pow(log10, getAdjustedGlyphEffect("effarigantimatter")));
      }
    }
    production = production.min(this.cappedProductionInNormalChallenges);
    return production;
  }
}

/**
 * @function
 * @param {number} tier
 * @return {AntimatterDimensionState}
 */
export const AntimatterDimension = AntimatterDimensionState.createAccessor();

export const AntimatterDimensions = {
  /**
   * @type {AntimatterDimensionState[]}
   */
  all: AntimatterDimension.index.compact(),

  reset() {
    for (const dimension of AntimatterDimensions.all) {
      dimension.reset();
    }
    GameCache.dimensionMultDecrease.invalidate();
  },

  resetAmountUpToTier(maxTier) {
    for (const dimension of AntimatterDimensions.all.slice(0, maxTier)) {
      dimension.resetAmount();
    }
  },

  get buyTenMultiplier() {
    let mult = DC.D2;
    const currentInfinityMultiplier = new Decimal(
      InfinityUpgrade.currentInfinityBoostsBuy10.effectOrDefault(DC.D1)
    );
    const adjustedCurrentInfinityMultiplier = NormalChallenge.isRuleBreaking
      ? currentInfinityMultiplier.pow(DC.D0_5)
      : currentInfinityMultiplier;
    const buy10InfinityMultiplier = new Decimal(InfinityUpgrade.buy10Mult.effectOrDefault(DC.D1));
    const adjustedBuy10InfinityMultiplier = NormalChallenge.isRuleBreaking
      ? buy10InfinityMultiplier.pow(DC.D0_5)
      : buy10InfinityMultiplier;
    mult = mult.times(adjustedCurrentInfinityMultiplier)
      .powEffectsOf(InfinityUpgrade.currentInfinityBoostsBuy10.chargedEffect);

    const achievementBuy10Addition = new Decimal(Achievement(141).effects.buyTenMult.effectOrDefault(0));
    mult = mult.plus(NormalChallenge.isRuleBreaking ? achievementBuy10Addition.div(2) : achievementBuy10Addition)
      .plusEffectsOf(EternityChallenge(3).reward);

    mult = mult.times(adjustedBuy10InfinityMultiplier).times(getAdjustedGlyphEffect("powerbuy10"));

    mult = mult.pow(getAdjustedGlyphEffect("effarigforgotten")).powEffectOf(InfinityUpgrade.buy10Mult.chargedEffect);
    mult = mult.pow(ImaginaryUpgrade(14).effectOrDefault(1));

    if (NormalChallenge(8).isRunning) mult = mult.pow(DC.D0_65);

    return mult;
  },

  tick(diff) {
    // Stop producing antimatter at Big Crunch goal because all the game elements
    // are hidden when pre-break Big Crunch button is on screen.
    const hasBigCrunchGoal = !player.break || Player.isInAntimatterChallenge;
    const isNC9 = NormalChallenge(9).isRunning;
    if (!isNC9 && hasBigCrunchGoal && Currency.antimatter.gte(Player.infinityGoal)) return;

    const maxTierProduced = EternityChallenge(3).isRunning ? 3 : 7;
    for (let tier = maxTierProduced; tier >= 1; --tier) {
      AntimatterDimension(tier + 1).produceDimensions(AntimatterDimension(tier), diff.div(10));
    }
    if (AntimatterDimension(1).amount.gt(0)) {
      player.requirementChecks.eternity.noAD1 = false;
    }
    const hasAnyAntimatterDimension = AntimatterDimensions.all.some(dimension => dimension.amount.gt(0));
    if (isNC9) {
      Currency.antimatter.value = hasAnyAntimatterDimension
        ? AntimatterDimension(1).productionPerSecond
        : DC.E2;
    } else {
      AntimatterDimension(1).produceCurrency(Currency.antimatter, diff);
    }
    // Production may overshoot the goal on the final tick of the challenge
    if (hasBigCrunchGoal) Currency.antimatter.dropTo(Player.infinityGoal);
  }
};
