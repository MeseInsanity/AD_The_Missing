import { AutobuyerState } from "./autobuyer";

export class RebuyableBreakUpgradeAutobuyerState extends AutobuyerState {
  get data() {
    return player.auto.rebuyableBreakUpgrades;
  }

  get name() {
    return "Rebuyable Break Infinity Upgrades";
  }

  get isUnlocked() {
    return EternityMilestone.autobuyerRebuyableBreakUpgrades.isReached;
  }

  get hasUnlimitedBulk() {
    return true;
  }

  tick() {
    for (const upgrade of Object.values(BreakInfinityUpgrade)) {
      if (upgrade?.config?.rebuyable && upgrade.canBeBought) upgrade.purchase();
    }
  }
}
