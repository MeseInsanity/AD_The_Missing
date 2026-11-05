import { DC } from "./constants";
import { Currency } from "./currency";

/**
 * @abstract
 */
export class TimeTheoremPurchaseType {
  /**
  * @abstract
  */
  get amount() { throw new NotImplementedError(); }

  /**
  * @abstract
  */
  set amount(value) { throw new NotImplementedError(); }

  add(amount) { this.amount = this.amount.add(amount); }

  /**
  * @abstract
  */
  get currency() { throw new NotImplementedError(); }

  get cost() { return this.costBase.times(this.costIncrement.pow(this.amount)); }

  /**
   * @abstract
   */
  get costBase() { throw new NotImplementedError(); }

  /**
   * @abstract
   */
  get costIncrement() { throw new NotImplementedError(); }

  get bulkPossible() {
    if (Perk.ttFree.canBeApplied) {
      return this.currency.value.divide(this.cost).max(1).log10().div(this.costIncrement.max(1).log10()).add(1).floor();
    }
    return Decimal.affordGeometricSeries(this.currency.value, this.cost, this.costIncrement, 0);
  }

  // Note: This is actually just the cost of the largest term of the geometric series. If buying EP without the
  // perk that makes them free, this will be incorrect, but the EP object already overrides this anyway
  bulkCost(amount) {
    return this.cost.times(this.costIncrement.pow(amount.sub(1)));
  }

  purchase(bulk = false) {
    if (Currency.timeTheorems.gte(115) && Pelle.isDoomed) PelleStrikes.ECs.trigger();
    if (!this.canAfford) return false;

    if (!bulk) {
      if (!Perk.ttFree.canBeApplied && this.currency.layer <= 1) this.currency.subtract(this.cost);
      Currency.timeTheorems.add(1);
      this.add(1);
      player.requirementChecks.reality.noPurchasedTT = false;
      if (Currency.timeTheorems.gte(115) && Pelle.isDoomed) PelleStrikes.ECs.trigger();
      return true;
    }
    const canBuy = this.currency.value.sub(this.costBase)
      .clampMin(this.costIncrement.recip()).log(this.costIncrement);
    let amntPur = canBuy.sub(this.amount).floor();
    // We can definitely afford x - 1
    amntPur = amntPur.sub(1).max(0);
    Currency.timeTheorems.add(amntPur);
    this.add(amntPur);
    if (!Perk.ttFree.canBeApplied && this.currency.layer <= 1 && amntPur.neq(0)) this.currency.subtract(this.cost);
    // Can we afford another? If not, just return that we definitely bought some already
    if (this.currency.lt(this.cost) && amntPur.neq(0)) return true;
    Currency.timeTheorems.add(1);
    if (!Perk.ttFree.canBeApplied && this.currency.layer <= 1) this.currency.subtract(this.cost);
    this.add(1);
    player.requirementChecks.reality.noPurchasedTT = false;
    if (Currency.timeTheorems.gte(115) && Pelle.isDoomed) PelleStrikes.ECs.trigger();
    return true;
  }

  get canAfford() {
    return this.currency.gte(this.cost) && !player.eternities.eq(0);
  }

  reset() {
    this.amount = DC.D0;
  }
}

// AM/IP prices change growth rates; purchases use the stored purchase count across every segment.
class ScalingTimeTheoremPurchaseType extends TimeTheoremPurchaseType {
  costAt(amount) {
    const exponents = this.costExponents;
    const last = exponents.length - 1;
    const exponent = amount.lt(last)
      ? new Decimal(exponents[amount.toNumber()])
      : amount.sub(last).times(this.finalExponentIncrement).add(exponents[last]);
    return Decimal.pow10(exponent);
  }

  get cost() { return this.costAt(this.amount); }

  purchase(bulk = false) {
    if (!bulk) return super.purchase(false);
    let purchased = false;
    const last = this.costExponents.length - 1;
    while (this.amount.lt(last) && this.canAfford) {
      if (!super.purchase(false)) return purchased;
      purchased = true;
    }
    if (!this.canAfford) return purchased;

    let count = this.currency.value.log10().sub(this.cost.log10()).div(this.finalExponentIncrement)
      .floor().add(1).max(1);
    if (this.currency.gte(this.costAt(this.amount.add(count)))) count = count.add(1);
    if (this.currency.lt(this.costAt(this.amount.add(count).sub(1)))) count = count.sub(1);
    if (count.lte(0)) return purchased;
    const lastCost = this.costAt(this.amount.add(count).sub(1));
    Currency.timeTheorems.add(count);
    this.add(count);
    if (!Perk.ttFree.canBeApplied && this.currency.layer <= 1) this.currency.subtract(lastCost);
    player.requirementChecks.reality.noPurchasedTT = false;
    if (Currency.timeTheorems.gte(115) && Pelle.isDoomed) PelleStrikes.ECs.trigger();
    return true;
  }
}

TimeTheoremPurchaseType.am = new class extends ScalingTimeTheoremPurchaseType {
  get amount() { return player.timestudy.amBought; }
  set amount(value) { player.timestudy.amBought = value; }

  get currency() { return Currency.antimatter; }
  // AM reaches roughly three times as many orders of magnitude before Eternity in this mod.
  get costBase() { return DC.E60000; }
  get costIncrement() { return DC.E60000; }
  get costExponents() { return [60000, 120000, 180000, 240000, 300000, 350000, 390000, 420000, 440000]; }
  get finalExponentIncrement() { return 20000; }
}();

TimeTheoremPurchaseType.ip = new class extends ScalingTimeTheoremPurchaseType {
  get amount() { return player.timestudy.ipBought; }
  set amount(value) { player.timestudy.ipBought = value; }

  get currency() { return Currency.infinityPoints; }
  get costBase() { return DC.D1; }
  // IP reaches roughly four times as many orders of magnitude before Eternity in this mod.
  get costIncrement() { return DC.E400; }
  get costExponents() { return [0, 400, 800, 1200, 1600, 2000, 2300, 2500, 2600]; }
  get finalExponentIncrement() { return 100; }
}();

TimeTheoremPurchaseType.ep = new class extends TimeTheoremPurchaseType {
  get amount() { return player.timestudy.epBought; }
  set amount(value) { player.timestudy.epBought = value; }

  get currency() { return Currency.eternityPoints; }
  get costBase() { return DC.D1; }
  get costIncrement() { return DC.D2; }

  bulkCost(amount) {
    if (Perk.ttFree.canBeApplied || this.currency.layer > 1) return this.cost.times(this.costIncrement.pow(amount));
    return this.cost.times(this.costIncrement.pow(amount.sub(1)));
  }
}();

export const TimeTheorems = {
  checkForBuying(auto) {
    if (PlayerProgress.realityUnlocked() || TimeDimension(1).bought.neq(0)) return true;
    if (!auto) Modal.message.show(`You need to buy at least ${formatInt(1)} Time Dimension before you can purchase
      Time Theorems.`, { closeEvent: GAME_EVENT.REALITY_RESET_AFTER });
    return false;
  },

  buyOne(auto = false, type) {
    if (!this.checkForBuying(auto)) return DC.D0;
    if (!TimeTheoremPurchaseType[type].purchase(false)) return DC.D0;
    return DC.D1;
  },

  // This is only called via automation and there's no manual use-case, so we assume auto is true and simplify a bit
  buyOneOfEach() {
    if (!this.checkForBuying(true)) return;
    this.buyOne(true, "am");
    this.buyOne(true, "ip");
    this.buyOne(true, "ep");
  },

  buyMax(auto = false) {
    if (!this.checkForBuying(auto)) return;
    TimeTheoremPurchaseType.am.purchase(true);
    TimeTheoremPurchaseType.ip.purchase(true);
    TimeTheoremPurchaseType.ep.purchase(true);
  },

  totalPurchased() {
    return TimeTheoremPurchaseType.am.amount
      .add(TimeTheoremPurchaseType.ip.amount)
      .add(TimeTheoremPurchaseType.ep.amount);
  },

  calculateTimeStudiesCost() {
    let totalCost = TimeStudy.boughtNormalTS()
      .map(ts => ts.cost)
      .reduce(Decimal.sumReducer, new Decimal());
    const ecStudy = TimeStudy.eternityChallenge.current();
    if (ecStudy !== undefined) {
      totalCost = totalCost.add(ecStudy.cost);
    }
    if (Enslaved.isRunning && player.celestials.enslaved.hasSecretStudy) totalCost = totalCost.sub(100);
    return totalCost;
  }
};
