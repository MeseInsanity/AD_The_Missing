import { RebuyableMechanicState, SetPurchasableMechanicState } from "./game-mechanics";
import { DC } from "./constants";
import { SpeedrunMilestones } from "./speedrun";

const DIVIDEND_INITIAL_THRESHOLD = Decimal.pow10(35);
const DIVIDEND_INITIAL_MULTIPLIER = new Decimal(5);
const DIVIDEND_STEP_MULTIPLIER = new Decimal(1.25);
const DIVIDEND_THRESHOLD_RAMP_START = 256;
const DIVIDEND_THRESHOLD_RAMP_MULTIPLIER = 1.005;
let dominoesDividendEnabled = true;

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

const CRITICAL_IDLE_INCOME_INTERVAL = 700000;
const CRITICAL_IDLE_INCOME_DURATION = 7000;
const CRITICAL_IDLE_INCOME_MULTIPLIER = new Decimal(7.77);

export const CriticalIdleIncome = {
  get data() {
    return player.criticalIdleIncome ??= { elapsed: 0, remaining: 0 };
  },
  get isBought() {
    return BreakInfinityUpgrade.criticalIdleIncome.isBought;
  },
  get isActive() {
    return this.isBought && this.data.remaining > 0;
  },
  get remaining() {
    return this.data.remaining;
  },
  get multiplier() {
    return this.isActive ? CRITICAL_IDLE_INCOME_MULTIPLIER : DC.D1;
  },
  tick(realDiff) {
    if (!this.isBought) return;

    const data = this.data;
    data.remaining = Math.max(0, data.remaining - realDiff);
    data.elapsed += realDiff;
    if (data.elapsed < CRITICAL_IDLE_INCOME_INTERVAL) return;

    const rolls = Math.floor(data.elapsed / CRITICAL_IDLE_INCOME_INTERVAL);
    data.elapsed %= CRITICAL_IDLE_INCOME_INTERVAL;
    for (let roll = 0; roll < rolls; roll++) {
      if (data.remaining > 0) break;
      if (Math.random() >= 1 / 20) continue;
      data.remaining = CRITICAL_IDLE_INCOME_DURATION;
      GameUI.notify.success("Critical Idle Income! Idle Income is 777% for 7 seconds.", 7000);
      break;
    }
  }
};

export const DimensionalDominoes = {
  get isBought() {
    return BreakInfinityUpgrade.idPurchaseCascade.isBought;
  },
  get isEnabled() {
    return this.isBought && dominoesDividendEnabled;
  },
  get dividendCount() {
    const infinityPower = Currency.infinityPower.value;
    if (!this.isEnabled || infinityPower.lt(DIVIDEND_INITIAL_THRESHOLD)) return 0;

    // The old x2 curve is an upper bound on the count after the threshold ramp starts.
    // Search it rather than iterating so long offline runs remain inexpensive.
    let lower = 1;
    let upper = infinityPower.div(DIVIDEND_INITIAL_THRESHOLD).log2().floor().toNumber() + 1;
    while (lower < upper) {
      const candidate = Math.ceil((lower + upper) / 2);
      if (infinityPower.gte(this.thresholdAt(candidate))) lower = candidate;
      else upper = candidate - 1;
    }
    return lower;
  },
  get multiplier() {
    if (this.dividendCount === 0) return DC.D1;
    return DIVIDEND_INITIAL_MULTIPLIER.times(DIVIDEND_STEP_MULTIPLIER.pow(this.dividendCount - 1));
  },
  get nextThreshold() {
    if (!this.isEnabled) return DC.D0;
    return this.thresholdAt(this.dividendCount + 1);
  },
  get hasNextThreshold() {
    return this.isEnabled;
  },
  get nextThresholdRatio() {
    if (!this.isEnabled) return DC.D1;
    return this.nextThreshold.div(Currency.infinityPower.value.max(1));
  },
  get initialMultiplier() {
    return DIVIDEND_INITIAL_MULTIPLIER;
  },
  get stepMultiplier() {
    return DIVIDEND_STEP_MULTIPLIER;
  },
  get thresholdMultiplier() {
    const rampedDividends = Math.max(0, this.dividendCount - DIVIDEND_THRESHOLD_RAMP_START);
    return DC.D2.times(Decimal.pow(DIVIDEND_THRESHOLD_RAMP_MULTIPLIER, rampedDividends));
  },
  thresholdAt(dividendCount) {
    const transitions = dividendCount - 1;
    const rampedTransitions = Math.max(0, transitions - DIVIDEND_THRESHOLD_RAMP_START);
    // Each post-256 threshold costs an additional x1.005 over the preceding threshold multiplier.
    const rampExponent = rampedTransitions * (rampedTransitions + 1) / 2;
    return DIVIDEND_INITIAL_THRESHOLD.times(DC.D2.pow(transitions))
      .times(Decimal.pow(DIVIDEND_THRESHOLD_RAMP_MULTIPLIER, rampExponent));
  },
  setEnabledForTesting(enabled) {
    dominoesDividendEnabled = enabled;
  }
};
