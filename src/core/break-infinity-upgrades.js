import { RebuyableMechanicState, SetPurchasableMechanicState } from "./game-mechanics";
import { DC } from "./constants";
import { SpeedrunMilestones } from "./speedrun";

export class BreakInfinityUpgradeState extends SetPurchasableMechanicState {
  get currency() {
    return Currency.infinityPoints;
  }

  get set() {
    return player.infinityUpgrades;
  }

  get isAvailableForPurchase() {
    return this.config.isAvailableForPurchase?.() ?? true;
  }

  onPurchased() {
    this.config.onPurchased?.();
    if (this.id === "galaxyFormula") {
      SpeedrunMilestones(7).tryComplete();
    }
    if (this.id === "postGalaxy") {
      PelleStrikes.powerGalaxies.trigger();
    }
  }
}

class RebuyableBreakInfinityUpgradeState extends RebuyableMechanicState {
  get currency() {
    return Currency.infinityPoints;
  }

  get boughtAmount() {
    return player.infinityRebuyables[this.id] ?? DC.D0;
  }

  set boughtAmount(value) {
    player.infinityRebuyables[this.id] = value;
  }

  get isCapped() {
    return this.config.isCapped?.() ?? this.boughtAmount.gte(this.config.maxUpgrades);
  }

  get isAvailableForPurchase() {
    return this.config.isAvailableForPurchase?.() ?? true;
  }

  onPurchased() {
    this.config.onPurchased?.();
  }
}

export const BreakInfinityUpgrade = mapGameDataToObject(
  GameDatabase.infinity.breakUpgrades,
  config => (config.rebuyable
    ? new RebuyableBreakInfinityUpgradeState(config)
    : new BreakInfinityUpgradeState(config))
);
