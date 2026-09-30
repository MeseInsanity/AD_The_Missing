import { DC } from "./constants";
import { GameMechanicState } from "./game-mechanics";

const NC11_MATTER_PENALTY_EXPONENT = 0.15;
const NC11_MATTER_GROWTH_SCALING_TIME = 1;
const NC11_MATTER_GROWTH_BASE = DC.E1;
const NC11_ANNIHILATION_BONUS_PER_MATTER_OOM = 0.005;

export function normalChallenge11MatterPenalty() {
  const annihilationBonus = (player.chall11Pow ?? DC.D1).clampMin(1);
  return Currency.matter.value.max(1).pow(new Decimal(NC11_MATTER_PENALTY_EXPONENT).div(annihilationBonus));
}

export function updateNormalAndInfinityChallenges(diff) {
  if (NormalChallenge(11).isRunning) {
    player.chall11MatterGrowthTime = (player.chall11MatterGrowthTime ?? DC.D0).add(diff);
  }

  if (NormalChallenge(11).isRunning || InfinityChallenge(6).isRunning) {
    const matterActivationTier = 2;
    const matterCanActivate = AntimatterDimension(matterActivationTier).amount.neq(0);
    if (matterCanActivate) {
      Currency.matter.bumpTo(1);
      if (NormalChallenge(11).isRunning) {
        const timeScale = NC11_MATTER_GROWTH_BASE.pow(
          (player.chall11MatterGrowthTime ?? DC.D0).div(1000 * NC11_MATTER_GROWTH_SCALING_TIME)
        );
        Currency.matter.add(AntimatterDimension(2).totalAmount.times(diff.div(1000)).times(timeScale));
      } else {
        // These caps are values which occur at approximately e308 IP
        const cappedBase = Decimal.clampMax(DimBoost.totalBoosts, 400).div(200).add(1.05)
          .add(Decimal.clampMax(player.galaxies, 100).div(100));
        Currency.matter.multiply(Decimal.pow(cappedBase, diff.div(20)));
      }
    }
    if (Currency.matter.gt(Currency.antimatter.value) && NormalChallenge(11).isRunning && !Player.canCrunch) {
      const values = [Currency.antimatter.value, Currency.matter.value];
      player.chall11MatterAnnihilations = (player.chall11MatterAnnihilations ?? 0) + 1;
      const annihilationBonus = values[1].max(1).log10()
        .times(NC11_ANNIHILATION_BONUS_PER_MATTER_OOM).add(1);
      player.chall11Pow = (player.chall11Pow ?? DC.D1).times(annihilationBonus);
      player.chall11MatterGrowthTime = DC.D0;
      softReset(0, true, true);
      Modal.message.show(`Your ${format(values[0], 2, 2)} antimatter was annihilated
        by ${format(values[1], 2, 2)} matter.`, { closeEvent: GAME_EVENT.BIG_CRUNCH_AFTER }, 1);
    }
  }

  if (NormalChallenge(6).isRunning) {
    player.chall2Pow = player.chall2Pow.times(DC.D0_5.pow(diff.div(4000)));
  }

  if (NormalChallenge(5).isRunning) {
    player.chall5Pow = (player.chall5Pow ?? DC.D1).add(diff.div(4000)).clampMax(1);
  }

  if (InfinityChallenge(2).isRunning) {
    if (player.ic2Count >= 400) {
      if (AntimatterDimension(8).amount.gt(0)) {
        sacrificeReset();
      }
      player.ic2Count %= 400;
    } else {
      // Do not change to diff, as this may lead to a sacrifice softlock with high gamespeed
      player.ic2Count += Math.clamp(Date.now() - player.lastUpdate, 1, 21600000);
    }
  }
}

export function normalChallenge10PurchasesRemaining() {
  if (!NormalChallenge(10).isRunning) return Infinity;
  if (NormalChallenge(10).config.purchaseLimit === null) return Infinity;
  return Math.max(0, NormalChallenge(10).config.purchaseLimit - (player.chall10Purchases ?? 0));
}

export function recordNormalChallenge10Purchases(count) {
  if (!NormalChallenge(10).isRunning) return;
  if (NormalChallenge(10).config.purchaseLimit === null) return;
  player.chall10Purchases = Math.min(
    NormalChallenge(10).config.purchaseLimit,
    (player.chall10Purchases ?? 0) + count
  );
}

class NormalChallengeState extends GameMechanicState {
  get isQuickResettable() {
    return this.config.isQuickResettable;
  }

  get isRunning() {
    const isPartOfIC1 = this.id !== 9 && this.id !== 12;
    return player.challenge.normal.current === this.id || (isPartOfIC1 && InfinityChallenge(1).isRunning);
  }

  get isOnlyActiveChallenge() {
    return player.challenge.normal.current === this.id;
  }

  get isUnlocked() {
    if (PlayerProgress.eternityUnlocked()) return true;
    if (this.id === 0) return true;
    const requiredCompletions = this.config.lockedAt.toNumber();
    return NormalChallenges.all.countWhere(challenge => challenge.isCompleted) >= requiredCompletions;
  }

  get isDisabled() {
    return Pelle.isDoomed;
  }

  get lockedAt() {
    return GameDatabase.challenges.normal[this.id].lockedAt;
  }

  requestStart() {
    if (!Tab.challenges.isUnlocked) return;
    if (GameEnd.creditsEverClosed) return;
    if (!player.options.confirmations.challenges) {
      this.start();
      return;
    }
    Modal.startNormalChallenge.show(this.id);
  }

  start() {
    if (this.id === 1 || this.isOnlyActiveChallenge) return;
    if (!Tab.challenges.isUnlocked) return;
    // Forces big crunch reset but ensures IP gain, if any.
    bigCrunchReset(true, true);
    player.challenge.normal.current = this.id;
    // The forced Big Crunch above happens before this challenge becomes active, so apply challenge-specific
    // starting antimatter rules after setting the current challenge.
    if (this.id === 11) Currency.antimatter.reset();
    if (this.id === 7) player.postC4Tier = 0;
    if (this.id === 5) {
      player.chall5Pow = DC.D1;
      player.chall5Sacrifices = 0;
    }
    player.challenge.infinity.current = 0;
    if (Enslaved.isRunning && EternityChallenge(6).isRunning && this.id === 12) {
      EnslavedProgress.challengeCombo.giveProgress();
      Enslaved.quotes.ec6C10.show();
    }
    if (!Enslaved.isRunning) Tab.dimensions.antimatter.show();
  }

  get isCompleted() {
    return (player.challenge.normal.completedBits & (1 << this.id)) !== 0;
  }

  complete() {
    player.challenge.normal.completedBits |= 1 << this.id;
    // Since breaking infinity maxes even autobuyers that aren't unlocked,
    // it's possible to get r52 or r53 from completing a challenge
    // and thus unlocking an autobuyer.
    Achievement(52).tryUnlock();
    Achievement(53).tryUnlock();

    // Completing a challenge unlocks an autobuyer even if not purchased with antimatter, but we still
    // need to clear the notification because otherwise it sticks there forever. Any other methods of
    // unlocking autobuyers (such as Existentially Prolong) should also go through this code path
    TabNotification.newAutobuyer.clearTrigger();
    GameCache.cheapestAntimatterAutobuyer.invalidate();
  }

  get goal() {
    if (Enslaved.isRunning && Enslaved.BROKEN_CHALLENGES.includes(this.id)) {
      return DC.E1E15;
    }
    return DC.NUMMAX;
  }

  updateChallengeTime() {
    const bestTimes = player.challenge.normal.bestTimes;
    if (player.records.thisInfinity.time.gte(bestTimes[this.id - 2])) {
      return;
    }
    player.challenge.normal.bestTimes[this.id - 2].copyFrom(player.records.thisInfinity.time);
    GameCache.challengeTimeSum.invalidate();
    GameCache.worstChallengeTime.invalidate();
  }

  exit() {
    player.challenge.normal.current = 0;
    if (this.id === 5) player.chall5Sacrifices = 0;
    bigCrunchReset(true, false);
    if (!Enslaved.isRunning) Tab.dimensions.antimatter.show();
  }
}

/**
 * @param {number} id
 * @return {NormalChallengeState}
 */
export const NormalChallenge = NormalChallengeState.createAccessor(GameDatabase.challenges.normal);

/**
 * @returns {NormalChallengeState}
 */
Object.defineProperty(NormalChallenge, "current", {
  get: () => (player.challenge.normal.current > 0
    ? NormalChallenge(player.challenge.normal.current)
    : undefined),
});

Object.defineProperty(NormalChallenge, "isRuleBreaking", {
  get: () => NormalChallenge.current?.id >= 9,
});

Object.defineProperty(NormalChallenge, "isRunning", {
  get: () => player.challenge.normal.current !== 0,
});

export const NormalChallenges = {
  /**
   * @type {NormalChallengeState[]}
   */
  all: NormalChallenge.index.compact(),
  completeAll() {
    for (const challenge of NormalChallenges.all) challenge.complete();
  },
  clearCompletions() {
    player.challenge.normal.completedBits = 0;
  }
};
