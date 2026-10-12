import { DC } from "../constants";

import { Fragments } from "../secret-formula/fragments";

import { DimensionState } from "./dimension";

const ID5_UNLOCK_REQUIREMENT = DC.E1500;
const ID5_INITIAL_COST = DC.E14;
const ID6_UNLOCK_REQUIREMENT = new Decimal("6.66e6666");
const ID6_INITIAL_COST = new Decimal("1e66");
const ID5_SACRIFICE_HINT_REQUIREMENT = new Decimal("2e13");
const ID5_IP_HINT_REQUIREMENT = DC.E15;
const ID5_STABILITY_REQUIREMENT = DC.E15;
const ID5_STABILITY_BASE = DC.E10;
const ID5_MIN_STABILITY = DC.D0_1;

function id5Stability() {
  if (BreakInfinityUpgrade.sacrificeAutobuyer.isBought || player.records.thisInfinity.id5StabilityReached) return DC.D1;
  const progress = Sacrifice.totalBoost.div(ID5_STABILITY_BASE).max(1).log10()
    .div(ID5_STABILITY_REQUIREMENT.div(ID5_STABILITY_BASE).log10()).clampMax(1);
  return progress.times(DC.D1.sub(ID5_MIN_STABILITY)).add(ID5_MIN_STABILITY);
}

function id5AchievementMultiplier() {
  return Achievement(75).effectOrDefault(DC.D1).pow(id5Stability());
}

export function infinityDimensionCommonMultiplier() {
  let mult = new Decimal(1)
    .timesEffectsOf(
      TimeStudy(82),
      TimeStudy(92),
      TimeStudy(162),
      InfinityChallenge(1).reward,
      InfinityChallenge(7).reward,
      EternityChallenge(4).reward,
      EternityChallenge(9).reward,
      EternityUpgrade.idMultEP,
      EternityUpgrade.idMultEternities,
      EternityUpgrade.idMultICRecords,
      AlchemyResource.dimensionality,
      ImaginaryUpgrade(8),
      PelleRifts.recursion.milestones[1]
    )
    // Achievement 75 awakens alongside ID5 instead of arriving fully formed.
    .times(id5AchievementMultiplier());

  if (Replicanti.areUnlocked && Replicanti.amount.gt(1)) {
    mult = mult.times(replicantiMult());
  }

  return mult;
}

export function toggleAllInfDims() {
  const areEnabled = Autobuyer.infinityDimension(1).isActive;
  for (let i = 1; i < 9; i++) {
    Autobuyer.infinityDimension(i).isActive = !areEnabled;
  }
}

class InfinityDimensionState extends DimensionState {
  constructor(tier) {
    super(() => player.dimensions.infinity, tier);
    const UNLOCK_REQUIREMENTS = [
      undefined,
      DC.E1100,
      DC.E1900,
      DC.E2400,
      DC.E10500,
      ID5_UNLOCK_REQUIREMENT,
      ID6_UNLOCK_REQUIREMENT,
      DC.E54000,
      DC.E60000,
    ];
    this._unlockRequirement = UNLOCK_REQUIREMENTS[tier];
    const COST_MULTS = [null, 10, 1e2, 1e3, 1e4, DC.E14, 1e20, 1e25, 1e30];
    this._costMultiplier = COST_MULTS[tier];
    // Keep all early Infinity Dimension buy-10 multipliers at the common baseline.
    // Later progression will improve this formula through dedicated upgrades.
    const POWER_MULTS = [null, 5, 5, 5, 5, 5, 5, 5, 5];
    this._powerMultiplier = POWER_MULTS[tier];
    const BASE_COSTS = [null, 1, 1e2, 1e4, 1e7, ID5_INITIAL_COST, ID6_INITIAL_COST, 1e250, 1e280];
    this._baseCost = new Decimal(BASE_COSTS[tier]);
    this.ipRequirement = BASE_COSTS[1];
  }

  /** @returns {Decimal} */
  get cost() {
    // Costs are saved on the player object. Use the configured base cost before the
    // first purchase so cost changes apply to existing saves as well as new games.
    return this.purchases.eq(0) ? this.baseCost : this.data.cost;
  }

  /** @param {Decimal} value */
  set cost(value) { this.data.cost = value; }

  get baseAmount() {
    return this.data.baseAmount;
  }

  set baseAmount(value) {
    this.data.baseAmount = value;
  }

  get isUnlocked() {
    if (!this.isVisible) return false;
    // Achievement 4-7 grants the early ID set as a package; individual gates begin at ID5.
    return this.data.isUnlocked || (this.tier <= 4 && InfinityDimensions.areFourChallengesCompleted);
  }

  get isVisible() {
    if (this.tier === 5) return this.antimatterRequirementReached || this.id5HintDiscovered;
    return this.tier <= 4 || InfinityChallenge(4).isUnlocked;
  }

  get id5HintDiscovered() {
    return this.tier === 5 && (player.records.thisEternity.id5SacrificeHint ||
      player.records.thisEternity.maxIP.gte(ID5_IP_HINT_REQUIREMENT));
  }

  get unlockHint() {
    if (this.tier !== 5 || this.isUnlocked || this.antimatterRequirementReached) return "";
    const hasIPHint = player.records.thisEternity.maxIP.gte(ID5_IP_HINT_REQUIREMENT);
    const hasSacrificeHint = player.records.thisEternity.id5SacrificeHint;
    if (hasIPHint && hasSacrificeHint) {
      return "More Antimatter is needed to unlock a New Dimension.";
    }
    if (hasIPHint) {
      return "Something stirs beyond the known dimensions. Perhaps the power of Sacrifice can reach it.";
    }
    if (hasSacrificeHint) {
      return "The power of Sacrifice has reached a New Dimension.";
    }
    return "";
  }

  set isUnlocked(value) {
    this.data.isUnlocked = value;
  }

  get amRequirement() {
    return this._unlockRequirement;
  }

  get antimatterRequirementReached() {
    return player.records.thisEternity.maxAM.gte(this.amRequirement);
  }

  get hasIPUnlock() {
    return this.tier === 1 && !PlayerProgress.eternityUnlocked();
  }

  get ipRequirementReached() {
    return !this.hasIPUnlock || Currency.infinityPoints.value.gte(this.ipRequirement);
  }

  get canUnlock() {
    if (!this.isVisible) return false;
    if (this.tier <= 4) return InfinityDimensions.areFourChallengesCompleted;
    return (Perk.bypassIDAntimatter.canBeApplied || this.antimatterRequirementReached) &&
      this.ipRequirementReached;
  }

  get isAvailableForPurchase() {
    return InfinityDimensions.canBuy() && this.isUnlocked && this.isAffordable && !this.isCapped;
  }

  get isAffordable() {
    return Currency.infinityPoints.gte(this.cost);
  }

  get rateOfChange() {
    const tier = this.tier;
    let toGain = DC.D0;
    if (tier === 8) {
      // We need a extra 10x here (since ID8 production is per-second and
      // other ID production is per-10-seconds).
      EternityChallenge(7).reward.applyEffect(v => toGain = v.times(10));
      if (EternityChallenge(7).isRunning) EternityChallenge(7).applyEffect(v => toGain = v.times(10));
    } else {
      toGain = InfinityDimension(tier + 1).productionPerSecond;
    }
    const current = Decimal.max(this.amount, 1);
    return toGain.times(10).dividedBy(current).times(getGameSpeedupForDisplay());
  }

  get productionPerSecond() {
    if (EternityChallenge(2).isRunning || EternityChallenge(10).isRunning ||
      (Laitela.isRunning && this.tier > Laitela.maxAllowedDimension)) {
      return DC.D0;
    }
    let production = this.amount;
    if (EternityChallenge(11).isRunning) {
      return production;
    }
    if (EternityChallenge(7).isRunning) {
      production = production.times(Tickspeed.perSecond);
    }
    production = production.times(this.multiplier);
    // ID5 and Achievement 75 are deliberately unstable until Sacrifice has built enough power.
    // The production already created before a later reset of Sacrifice remains in the ID4 amount.
    return this.tier === 5 ? production.pow(id5Stability()) : production;
  }

  get multiplier() {
    const tier = this.tier;
    if (EternityChallenge(11).isRunning) return DC.D1;
    let mult = GameCache.infinityDimensionCommonMultiplier.value
      .timesEffectsOf(
        tier === 1 ? Achievement(94) : null,
        tier === 4 ? TimeStudy(72) : null,
        tier === 1 ? EternityChallenge(2).reward : null
      );
    if (tier === 1) {
      mult = mult.times(BreakInfinityUpgrade.infinitiedMult.effectOrDefault(DC.D1));
    }
    if (tier === 2) {
      mult = mult.times(BreakInfinityUpgrade.slowestChallengeMult.effectOrDefault(DC.D1));
    }
    if (tier === 3) {
      mult = mult.times(BreakInfinityUpgrade.infinityTimeIDMult.effectOrDefault(DC.D1));
    }
    if (tier === 4) mult = mult.times(Sacrifice.reflowMultiplier);
    if (BreakInfinityUpgrade.achievementMult.isBought) {
      const tierExponent = 0.8 / (tier * 2.717857142857143);
      const achievementMultiplier = new Decimal(BreakInfinityUpgrade.achievementMult.effectOrDefault(1));
      mult = mult.times(achievementMultiplier.pow(tierExponent));
    }
    mult = mult.times(Decimal.pow(this.powerMultiplier, Decimal.floor(this.baseAmount.div(DC.E1))));


    if (tier === 1) {
      mult = mult.times(PelleRifts.decay.milestones[0].effectOrDefault(1));
    }


    mult = mult.pow(getAdjustedGlyphEffect("infinitypow"));
    mult = mult.pow(getAdjustedGlyphEffect("effarigdimensions"));
    mult = mult.pow(getAdjustedGlyphEffect("curseddimensions"));
    mult = mult.powEffectOf(AlchemyResource.infinity);
    mult = mult.pow(Ra.momentumValue);
    mult = mult.powEffectOf(PelleRifts.paradox);

    if (player.dilation.active || PelleStrikes.dilation.hasStrike) {
      mult = dilatedValueOf(mult);
    }

    if (Effarig.isRunning) {
      mult = Effarig.multiplier(mult);
    } else if (V.isRunning) {
      mult = mult.pow(0.5);
    }

    if (PelleStrikes.powerGalaxies.hasStrike) {
      mult = mult.pow(0.5);
    }

    return mult;
  }

  get isProducing() {
    const tier = this.tier;
    if (EternityChallenge(2).isRunning ||
      EternityChallenge(10).isRunning ||
      (Laitela.isRunning && tier > Laitela.maxAllowedDimension)) {
      return false;
    }
    return this.amount.gt(0);
  }

  get baseCost() {
    return this._baseCost;
  }

  get costMultiplier() {
    let costMult = new Decimal(this._costMultiplier);
    EternityChallenge(12).reward.applyEffect(v => costMult = Decimal.pow(costMult, v));
    return costMult;
  }

  get powerMultiplier() {
    let multiplier = new Decimal(this._powerMultiplier);
    // ID1 has no lower tier for the purchase cascade to draw from. IC completions instead
    // gradually restore its Buy 10 multiplier from x5 to x20.
    if (this.tier === 1) {
      multiplier = multiplier.add(1.25 * InfinityChallenges.completed.length);
    }
    return multiplier
      .times(this._tier === 8 ? GlyphInfo.infinity.sacrificeInfo.effect() : new Decimal(1))
      .pow(ImaginaryUpgrade(14).effectOrDefault(1));
  }

  get purchases() {
    // Because each ID purchase gives 10 IDs
    return this.data.baseAmount.div(10);
  }

  get purchaseCap() {
    if (Enslaved.isRunning) {
      return DC.D1;
    }
    return InfinityDimensions.capIncrease.add(this.tier === 8
      ? DC.BEMAX
      : InfinityDimensions.basePurchaseCap);
  }

  get isCapped() {
    return this.purchases.gte(this.purchaseCap);
  }

  get hardcapIPAmount() {
    const baseCost = this.tier === 1 ? DC.D1 : this._baseCost;
    return baseCost.times(Decimal.pow(this.costMultiplier, this.purchaseCap));
  }

  resetAmount() {
    this.amount = new Decimal(this.baseAmount);
  }

  fullReset() {
    this.cost = new Decimal(this.baseCost);
    this.amount = DC.D0;
    this.bought = DC.D0;
    this.baseAmount = DC.D0;
    this.isUnlocked = false;
  }

  unlock() {
    if (this.isUnlocked) return true;
    if (!this.canUnlock) return false;
    this.isUnlocked = true;
    EventHub.dispatch(GAME_EVENT.INFINITY_DIMENSION_UNLOCKED, this.tier);
    if (this.tier === 1 && !PlayerProgress.eternityUnlocked()) {
      Tab.dimensions.infinity.show();
    }
    return true;
  }

  // Only ever called from manual actions
  buySingle() {
    if (!this.isUnlocked) return this.unlock();
    if (!this.isAvailableForPurchase) return false;
    if (ImaginaryUpgrade(15).isLockingMechanics) {
      const lockString = this.tier === 1
        ? "purchase a 1st Infinity Dimension"
        : "purchase a Dimension which will produce 1st IDs";
      ImaginaryUpgrade(15).tryShowWarningModal(lockString);
      return false;
    }

    Currency.infinityPoints.purchase(this.cost);
    this.cost = this.cost.eq(0)
      ? this.costMultiplier
      : Decimal.round(this.cost.times(this.costMultiplier));
    // Because each ID purchase gives 10 IDs
    this.amount = this.amount.plus(10);
    this.baseAmount = this.baseAmount.add(10);

    if (EternityChallenge(8).isRunning) {
      player.eterc8ids -= 1;
    }

    return true;
  }

  buyMax(auto) {
    if (!this.isAvailableForPurchase) return false;
    if (ImaginaryUpgrade(15).isLockingMechanics) {
      const lockString = this.tier === 1
        ? "purchase a 1st Infinity Dimension"
        : "purchase a Dimension which will produce 1st IDs";
      if (!auto) ImaginaryUpgrade(15).tryShowWarningModal(lockString);
      return false;
    }

    let boughtFree = false;
    if (this.cost.eq(0)) {
      boughtFree = this.buySingle();
      if (!boughtFree || !this.isAvailableForPurchase) return boughtFree;
    }

    let purchasesUntilHardcap = this.purchaseCap.sub(this.purchases);
    if (EternityChallenge(8).isRunning) {
      purchasesUntilHardcap = Decimal.clampMax(purchasesUntilHardcap, player.eterc8ids);
    }

    const costScaling = new LinearCostScaling(
      Currency.infinityPoints.value,
      this.cost,
      this.costMultiplier,
      purchasesUntilHardcap
    );

    if (costScaling.purchases.lte(0)) return boughtFree;

    Currency.infinityPoints.purchase(costScaling.totalCost);
    this.cost = this.cost.times(costScaling.totalCostMultiplier);
    this.bought = this.bought.plus(costScaling.purchases);
    // Because each ID purchase gives 10 IDs
    this.amount = this.amount.plus(costScaling.purchases.times(10));
    this.baseAmount = DC.E1.times(costScaling.purchases).add(this.baseAmount);

    if (EternityChallenge(8).isRunning) {
      player.eterc8ids -= costScaling.purchases.toNumber();
    }
    return true;
  }
}

/**
 * @function
 * @param {number} tier
 * @return {InfinityDimensionState}
 */
export const InfinityDimension = InfinityDimensionState.createAccessor();

export const InfinityDimensions = {
  /**
   * @type {InfinityDimensionState[]}
   */
  all: InfinityDimension.index.compact(),
  HARDCAP_PURCHASES: new Decimal(2000000),

  get id5Stability() {
    return id5Stability();
  },

  get id5StabilityRequirement() {
    return ID5_STABILITY_REQUIREMENT;
  },

  get isID5StabilityLimited() {
    return InfinityDimension(5).isUnlocked && this.id5Stability.lt(1);
  },

  get hasID5StabilityReached() {
    return !this.isID5PermanentlyStable && InfinityDimension(5).isUnlocked &&
      player.records.thisInfinity.id5StabilityReached;
  },

  get isID5PermanentlyStable() {
    return BreakInfinityUpgrade.sacrificeAutobuyer.isBought;
  },

  get basePurchaseCap() {
    const completions = InfinityChallenges.completed.length;
    if (completions <= 7) {
      return new Decimal(5 + 3 * completions);
    }
    if (completions <= 11) {
      return Decimal.floor(Decimal.pow(4, (completions - 7) / 4).times(25));
    }
    return new Decimal(200);
  },

  get areFourChallengesCompleted() {
    return Achievement(47).isUnlocked && NormalChallenges.all.countWhere(c => c.isCompleted) >= 4;
  },

  unlockNext() {
    if (InfinityDimension(8).isUnlocked) return;
    this.next().unlock();
  },

  next() {
    if (InfinityDimension(8).isUnlocked)
      throw "All Infinity Dimensions are unlocked";
    return this.all.first(dim => !dim.isUnlocked);
  },

  resetAmount() {
    Currency.infinityPower.reset();
    player.records.thisInfinity.id5StabilityReached = false;
    for (const dimension of InfinityDimensions.all) {
      dimension.resetAmount();
    }
  },

  fullReset() {
    for (const dimension of InfinityDimensions.all) {
      dimension.fullReset();
    }
  },

  get capIncrease() {
    return Decimal.floor(Tesseracts.capIncrease());
  },

  get totalDimCap() {
    return this.basePurchaseCap.add(this.capIncrease);
  },

  canBuy() {
    return !EternityChallenge(2).isRunning &&
      !EternityChallenge(10).isRunning &&
      (!EternityChallenge(8).isRunning || player.eterc8ids > 0);
  },

  canAutobuy() {
    return this.canBuy() && !EternityChallenge(8).isRunning;
  },

  tick(diff) {
    for (let tier = 8; tier > 1; tier--) {
      InfinityDimension(tier).produceDimensions(InfinityDimension(tier - 1), diff.div(10));
    }

    if (EternityChallenge(7).isRunning) {
      if (!NormalChallenge(12).isRunning) {
        InfinityDimension(1).produceDimensions(AntimatterDimension(7), diff);
      }
    } else {
      InfinityDimension(1).produceCurrency(Currency.infinityPower, diff);
    }

    player.requirementChecks.reality.maxID1 = player.requirementChecks.reality.maxID1
      .clampMin(InfinityDimension(1).amount);
  },

  tryAutoUnlock() {
    if (!EternityMilestone.autoUnlockID.isReached || InfinityDimension(8).isUnlocked) return;
    for (const dimension of this.all) {
      // If we cannot unlock this one, we can't unlock the rest, either
      if (!dimension.unlock()) break;
    }
  },

  // Called from "Max All" UI buttons and nowhere else
  buyMax() {
    // Try to unlock dimensions
    const unlockedDimensions = this.all.filter(dimension => dimension.unlock());

    // Try to buy single from the highest affordable new dimensions
    unlockedDimensions.slice().reverse().forEach(dimension => {
      if (dimension.purchases === 0) dimension.buySingle();
    });

    // Try to buy max from the lowest dimension (since lower dimensions have bigger multiplier per purchase)
    unlockedDimensions.forEach(dimension => dimension.buyMax(false));
  },

  get basePowerConversionRate() {
    const normalChallengeCompletions = NormalChallenges.all.countWhere(c => c.isCompleted);
    const normalChallengeExponent = DC.D0_05.times(Decimal.pow(2, Math.max(normalChallengeCompletions - 4, 0) / 4));
    const fragmentBonus = Fragments.infinityPowerConversion.effect().sub(DC.D0_01.times(2)).max(0);
    return getAdjustedGlyphEffect("infinityrate").add(normalChallengeExponent).add(fragmentBonus)
      .add(PelleUpgrade.infConversion.effectOrDefault(0));
  },

  get powerConversionRate() {
    return this.basePowerConversionRate.add(BreakInfinityUpgrade.idRate.effectOrDefault(DC.D0))
      .mul(PelleRifts.paradox.milestones[2].effectOrDefault(1));
  }
};

function recordID5SacrificeHint() {
  if (Sacrifice.totalBoost.gte(ID5_SACRIFICE_HINT_REQUIREMENT)) {
    player.records.thisEternity.id5SacrificeHint = true;
  }
  if (Sacrifice.totalBoost.gte(ID5_STABILITY_REQUIREMENT)) {
    player.records.thisInfinity.id5StabilityReached = true;
  }
}

EventHub.logic.on(GAME_EVENT.SACRIFICE_RESET_AFTER, recordID5SacrificeHint);
EventHub.logic.on(GAME_EVENT.GAME_TICK_AFTER, recordID5SacrificeHint);
EventHub.logic.on(GAME_EVENT.GAME_LOAD, recordID5SacrificeHint);
