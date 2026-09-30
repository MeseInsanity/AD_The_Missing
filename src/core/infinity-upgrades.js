import { GameMechanicState, SetPurchasableMechanicState } from "./game-mechanics";
import { DC } from "./constants";
import { Fragments } from "./secret-formula/fragments";

class ChargedInfinityUpgradeState extends GameMechanicState {
  constructor(config, upgrade) {
    super(config);
    this._upgrade = upgrade;
  }

  get isEffectActive() {
    return this._upgrade.isBought && this._upgrade.isCharged;
  }
}

export class InfinityUpgradeState extends SetPurchasableMechanicState {
  constructor(config) {
    super(config);
    if (config.charged) {
      this._chargedEffect = new ChargedInfinityUpgradeState(config.charged, this);
    }
  }

  get currency() {
    return Currency.infinityPoints;
  }

  get set() {
    return player.infinityUpgrades;
  }

  get isAvailableForPurchase() {
    return this.config.checkRequirement?.() ?? true;
  }

  get isEffectActive() {
    return this.isBought && !this.isCharged;
  }

  get chargedEffect() {
    return this._chargedEffect;
  }

  purchase() {
    if (super.purchase()) {
      this.config.onPurchased?.();
      // This applies the 4th column of infinity upgrades retroactively
      if (this.config.id.includes("skip")) skipResetsIfPossible();
      EventHub.dispatch(GAME_EVENT.INFINITY_UPGRADE_BOUGHT);
      return true;
    }
    if (this.canCharge) {
      this.charge();
      EventHub.dispatch(GAME_EVENT.INFINITY_UPGRADE_CHARGED);
      return true;
    }
    return false;
  }

  get hasChargeEffect() {
    return this.config.charged !== undefined;
  }

  get isCharged() {
    return player.celestials.ra.charged.has(this.id);
  }

  get canCharge() {
    return this.isBought &&
      this.hasChargeEffect &&
      !this.isCharged &&
      Ra.chargesLeft !== 0 &&
      !Pelle.isDisabled("chargedInfinityUpgrades");
  }

  charge() {
    player.celestials.ra.charged.add(this.id);
  }

  disCharge() {
    player.celestials.ra.charged.delete(this.id);
  }
}

export function totalIPMult() {
  if (Effarig.isRunning && Effarig.currentStage === EFFARIG_STAGES.INFINITY) {
    return DC.D1;
  }
  let ipMult = DC.D1
    .timesEffectsOf(
      TimeStudy(41),
      TimeStudy(51),
      TimeStudy(141),
      TimeStudy(142),
      TimeStudy(143),
      Achievement(33),
      Achievement(85),
      Achievement(93),
      Achievement(116),
      Achievement(125),
      Achievement(141).effects.ipGain,
      InfinityUpgrade.ipMult,
      BreakInfinityUpgrade.infinityIPMult,
      DilationUpgrade.ipMultDT,
      GlyphEffect.ipMult
    );
  ipMult = ipMult.times(Replicanti.amount.powEffectOf(AlchemyResource.exponential));
  return ipMult;
}

export function disChargeAll() {
  const upgrades = [
    InfinityUpgrade.totalTimeMult,
    InfinityUpgrade.dim18mult,
    InfinityUpgrade.dim36mult,
    InfinityUpgrade.resetBoost,
    InfinityUpgrade.buy10Mult,
    InfinityUpgrade.dim27mult,
    InfinityUpgrade.dim45mult,
    InfinityUpgrade.galaxyBoost,
    InfinityUpgrade.thisInfinityTimeMult,
    InfinityUpgrade.unspentIPMult,
    InfinityUpgrade.dimboostMult,
    InfinityUpgrade.ipGen,
    InfinityUpgrade.bestInfinityTimeDimensions,
    InfinityUpgrade.currentInfinityTickspeedSacrifice,
    InfinityUpgrade.currentInfinityBoostsBuy10,
    InfinityUpgrade.currentInfinitySacrificeDimBoost
  ];
  for (const upgrade of upgrades) {
    if (upgrade.isCharged) {
      upgrade.disCharge();
    }
  }
  player.celestials.ra.disCharge = false;
  EventHub.dispatch(GAME_EVENT.INFINITY_UPGRADES_DISCHARGED);
}

// The IP multiplier has three analytically-invertible sections: eight x25 * 5^stage fixed-ratio stages, followed
// by a Fragment-adjustable post-scaling curve.
class InfinityIPMultUpgrade extends GameMechanicState {
  get baseCostExponent() {
    return 3;
  }

  get fragmentStrength() {
    return Math.clamp(Fragments.ipMultCostScaling.effect().toNumber(), 0, 1);
  }

  get firstPostScalingPurchase() {
    return Math.ceil(8192 * Math.log(2) / Math.log(3));
  }

  get maxPurchases() {
    return Math.ceil(1e6 * Math.log(10) / Math.log(3));
  }

  get postScalingEndExponent() {
    const strength = this.fragmentStrength;
    return Math.pow(10, (1 - strength) * Math.log10(2e7) + strength * 6);
  }

  get postScalingPower() {
    return 0.5 + this.fragmentStrength / 2;
  }

  costExponentAt(purchaseCount) {
    const count = Math.max(purchaseCount, 0);
    if (count >= this.firstPostScalingPurchase) {
      const progress = Math.clamp(
        (count - this.firstPostScalingPurchase) / (this.maxPurchases - this.firstPostScalingPurchase), 0, 1
      );
      return 20000 + (this.postScalingEndExponent - 20000) * Math.pow(progress, this.postScalingPower);
    }

    let exponent = this.baseCostExponent;
    for (let stage = 0; stage < 8; stage++) {
      const start = Math.ceil(stage * 1024 * Math.log(2) / Math.log(3));
      const end = Math.ceil((stage + 1) * 1024 * Math.log(2) / Math.log(3));
      const purchases = Math.clamp(count - start, 0, end - start);
      exponent += purchases * Math.log10(25 * 5 ** stage);
    }
    return exponent;
  }

  get cost() {
    return Decimal.pow10(this.costExponentAt(this.purchaseCount.toNumber()));
  }

  get purchaseCount() {
    return player.IPMultPurchases;
  }

  get isCapped() {
    return this.purchaseCount.gte(this.maxPurchases);
  }

  get isBought() {
    return this.isCapped;
  }

  get isRequirementSatisfied() {
    return Achievement(41).isUnlocked;
  }

  get canBeBought() {
    return !Pelle.isDoomed && !this.isCapped && Currency.infinityPoints.gte(this.cost) && this.isRequirementSatisfied;
  }

  purchase(amount = 1) {
    if (!this.canBeBought) return;
    if (!TimeStudy(181).isBought) {
      Autobuyer.bigCrunch.bumpAmount(DC.D3.pow(amount));
    }
    const finalPurchaseCount = this.purchaseCount.add(amount).sub(1).toNumber();
    Currency.infinityPoints.subtract(Decimal.pow10(this.costExponentAt(finalPurchaseCount)));
    player.IPMultPurchases = player.IPMultPurchases.add(amount);
    GameUI.update();
  }

  buyMax() {
    if (!this.canBeBought) return;
    const availableExponent = Currency.infinityPoints.value.log10().toNumber();
    let low = this.purchaseCount.toNumber();
    let high = this.maxPurchases;
    while (low < high) {
      const midpoint = Math.ceil((low + high) / 2);
      if (this.costExponentAt(midpoint - 1) <= availableExponent) low = midpoint;
      else high = midpoint - 1;
    }
    const purchases = low - this.purchaseCount.toNumber();
    if (purchases <= 0) return;
    // The final purchase dominates every section's total cost, so this follows the same Buy Max approximation as EPx5.
    this.purchase(purchases);
  }
}

export const InfinityUpgrade = mapGameDataToObject(
  GameDatabase.infinity.upgrades,
  config => (config.id === "ipMult"
    ? new InfinityIPMultUpgrade(config)
    : new InfinityUpgradeState(config))
);
