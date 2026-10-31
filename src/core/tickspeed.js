import { antimatterGalaxyJMultiplier, effectiveReplicantiGalaxies, galaxyStrengthMultiplier } from "./galaxy-strength";
import { normalChallenge10PurchasesRemaining, recordNormalChallenge10Purchases } from "./normal-challenges";
import { DC } from "./constants";
import { Fragments } from "./secret-formula/fragments";

export function effectiveBaseGalaxies() {
  const replicantiGalaxies = effectiveReplicantiGalaxies();
  let freeGalaxies = player.dilation.totalTachyonGalaxies;
  freeGalaxies = freeGalaxies.mul(DC.D1.add(Decimal.max(0, Replicanti.amount.max(1).log10().div(1e6))
    .times(AlchemyResource.alternation.effectValue)));
  const antimatterGalaxies = player.galaxies.times(antimatterGalaxyJMultiplier()).add(GalaxyGenerator.galaxies);
  return Decimal.max(antimatterGalaxies.add(replicantiGalaxies).add(freeGalaxies), 0);
}

export function getIC4TickspeedSoftcapCoefficient() {
  const boosts = player.challenge.infinity.dimBoosts ?? DC.D0;
  return Decimal.min(DC.D10, boosts.div(DC.D1_07).pow(DC.D0_3).add(DC.D0_5));
}

// The Galaxy count after all effects which directly strengthen Galaxies.
export function effectiveGalaxyCount() {
  return effectiveBaseGalaxies().times(galaxyStrengthMultiplier());
}

function applyNC6TickspeedPenalty(multiplier) {
  if (!NormalChallenge(6).isRunning) return multiplier;
  const progress = Currency.antimatter.value.clampMin(1).pLog10()
    .div(Decimal.log10(Player.infinityGoal)).clampMin(0).clampMax(1);
  return multiplier.add(DC.D1.sub(multiplier).times(progress).times(player.chall2Pow));
}

function applyNC4TickspeedPenalty(multiplier) {
  return NormalChallenge(4).isRunning ? multiplier.pow(0.4) : multiplier;
}

export function getTickSpeedMultiplier() {
  if (Ra.isRunning) return DC.C1D1_1245;
  if (InfinityChallenge(7).isRunning) return DC.D1.div(1.08);
  const galaxies = effectiveGalaxyCount();

  if (!BreakInfinityUpgrade.galaxyFormula.isBought) {
    const multiplier = DC.D1.div(DC.D1_1245.add(galaxies.times(0.01)));
    return applyNC6TickspeedPenalty(applyNC4TickspeedPenalty(multiplier.powEffectOf(InfinityChallenge(12).reward)));
  }
  const baseMultiplier = DC.C1D1_1245;
  const perGalaxy = DC.D0_965;
  const multiplier = baseMultiplier.times(perGalaxy.pow(galaxies));
  return applyNC6TickspeedPenalty(applyNC4TickspeedPenalty(multiplier.powEffectOf(InfinityChallenge(12).reward)));
}

export function buyTickSpeed() {
  if (!Tickspeed.isAvailableForPurchase || !Tickspeed.isAffordable ||
    normalChallenge10PurchasesRemaining() < 1) return false;

  Tutorial.turnOffEffect(TUTORIAL_STATE.TICKSPEED);
  // IC10 treats Antimatter as a production-rate threshold, not a banked currency.
  if (!InfinityChallenge(10).isRunning) Currency.antimatter.subtract(Tickspeed.cost);
  player.totalTickBought = player.totalTickBought.add(1);
  recordNormalChallenge10Purchases(1);
  player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
  player.requirementChecks.permanent.singleTickspeed++;
  if (NormalChallenge(6).isRunning) player.chall2Pow = DC.D1;
  GameUI.update();
  return true;
}

export function buyMaxTickSpeed() {
  if (!Tickspeed.isAvailableForPurchase || !Tickspeed.isAffordable) return;
  if (NormalChallenge(10).isRunning || InfinityChallenge(10).isRunning) {
    while (buyTickSpeed()) {
      // NC10 needs exact individual-purchase accounting; IC10 does not spend its AM/s threshold.
    }
    return;
  }
  let boughtTickspeed = false;

  Tutorial.turnOffEffect(TUTORIAL_STATE.TICKSPEED);
  const purchases = Tickspeed.costScale.getMaxBought(player.totalTickBought, Currency.antimatter.value, DC.D1, true);
  if (purchases !== null && purchases.quantity.gt(0)) {
    if (purchases.logPrice.eq(player.antimatter.max(1).log10()) && player.dimensions.antimatter[0].amount.eq(0)) {
      purchases.logPrice = Tickspeed.costScale.calculateCost(
        player.totalTickBought.add(purchases.quantity).sub(1));
      if (purchases.quantity.gt(1)) purchases.quantity = purchases.quantity.sub(1);
    }
    Currency.antimatter.subtract(Decimal.pow10(purchases.logPrice));
    player.totalTickBought = player.totalTickBought.add(purchases.quantity);
  }

  // eslint-disable-next-line max-len
  for (let i = 0; i < 5 && (player.antimatter.neq(Tickspeed.cost) && player.dimensions.antimatter[0].amount.neq(0)); i++) {
    buyTickSpeed();
  }

  boughtTickspeed = true;

  if (boughtTickspeed) {
    player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
    if (NormalChallenge(6).isRunning) player.chall2Pow = DC.D1;
  }
  // eslint-disable-next-line max-statements-per-line
  if (player.dimensions.antimatter[0].amount.eq(0)) { Currency.antimatter.bumpTo(100); }
}

export function resetTickspeed() {
  player.totalTickBought = DC.D0;
}

export const Tickspeed = {

  get isUnlocked() {
    return InfinityChallenge(5).isRunning || AntimatterDimension(2).bought.gt(0) ||
      EternityMilestone.unlockAllND.isReached || PlayerProgress.realityUnlocked();
  },

  get isAvailableForPurchase() {
    return this.isUnlocked &&
      !EternityChallenge(9).isRunning &&
      !Laitela.continuumActive &&
      (player.break || this.cost.lt(DC.NUMMAX));
  },

  get isAffordable() {
    return Currency.antimatter.gte(this.cost);
  },

  get multiplier() {
    return getTickSpeedMultiplier();
  },

  get current() {
    const tickspeed = Effarig.isRunning
      ? Effarig.tickspeed
      : this.baseValue.powEffectOf(DilationUpgrade.tickspeedPower);
    const finalTickspeed = player.dilation.active || PelleStrikes.dilation.hasStrike
      ? dilatedValueOf(tickspeed.recip()).recip()
      : tickspeed;
    return finalTickspeed;
  },

  get cost() {
    return this.costScale.calculateCost(player.totalTickBought);
  },

  get costScale() {
    return new ExponentialCostScaling({
      baseCost: DC.E3,
      baseIncrease: DC.E1,
      costScale: new Decimal(Player.tickSpeedMultDecrease),
      scalingCostThreshold: Decimal.pow10(DC.NUMMAX.log10().add(EternityUpgrade.costScaling.effectOrDefault(0)))
    });
  },

  get continuumValue() {
    if (!this.isUnlocked) return DC.D0;
    const contVal = this.costScale.getContinuumValue(Currency.antimatter.value, DC.D1);
    return contVal ? contVal.times(Laitela.matterExtraPurchaseFactor) : DC.D0;
  },

  get baseValue() {
    return DC.E3.timesEffectsOf(
      Achievement(36),
      Achievement(45),
      Achievement(66),
      Achievement(83)
    )
      .times(getTickSpeedMultiplier().pow(this.totalUpgrades));
  },

  get totalUpgrades() {
    let boughtTickspeed;
    if (Laitela.continuumActive) boughtTickspeed = new Decimal(this.continuumValue);
    else boughtTickspeed = new Decimal(player.totalTickBought);
    const upgrades = boughtTickspeed.plus(player.totalTickGained)
      .plusEffectOf(BreakInfinityUpgrade.bestAMTickspeed)
      .plusEffectOf(InfinityChallenge(4).reward);
    if (!InfinityChallenge(4).isRunning || upgrades.lte(0)) return upgrades;
    const softcapped = upgrades.times(getIC4TickspeedSoftcapCoefficient())
      .times(Decimal.log2(upgrades.max(DC.D2))).sqrt();
    return Decimal.min(upgrades, softcapped);
  },

  get perSecond() {
    return Decimal.divide(1000, this.current);
  },

};


export const FreeTickspeed = {
  BASE_SOFTCAP: new Decimal(3e5),
  GROWTH_RATE: new Decimal(6e-6).add(1),
  GROWTH_EXP: DC.D2,
  tickmult: () => DC.D1.add(Effects.min(1.33, TimeStudy(171)).sub(1))
    .sub(Fragments.freeTickspeedJReduction)
    .mul(Decimal.max(getAdjustedGlyphEffect("cursedtickspeed"), 1)),

  get amount() {
    return player.totalTickGained;
  },

  get softcap() {
    let softcap = FreeTickspeed.BASE_SOFTCAP;
    if (Enslaved.has(ENSLAVED_UNLOCKS.FREE_TICKSPEED_SOFTCAP)) {
      softcap = softcap.add(1e5);
    }
    return softcap;
  },

  get multToNext() {
    if (this.amount.lt(this.softcap)) return new Decimal(this.tickmult());
    return this.tickmult().mul(this.GROWTH_RATE.pow(this.amount.sub(this.softcap)));
  },

  get tickExpo() {
    return new ExponentialCostScaling({
      baseCost: DC.D1,
      baseIncrease: this.tickmult(),
      costScale: FreeTickspeed.GROWTH_RATE,
      purchasesBeforeScaling: FreeTickspeed.softcap
    });
  },

  fromShards(shards) {
    if (shards.lt(1)) {
      return { newAmount: DC.D0, nextShards: DC.D1 };
    }
    const quant = this.tickExpo.getMaxBought(DC.D0, shards, DC.D1);
    return { newAmount: quant.quantity, nextShards: this.tickExpo.calculateCost(quant.quantity.add(1)) };
  }
};
