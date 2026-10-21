import { DC } from "../../constants";

import {
  condensateRepeatMilestoneLevel,
  hasCondensateMilestone
} from "./condensate-milestones";

export const Fragments = {
  discoveryRequirement: Decimal.pow(2, 1024),
  baseDecayDuration: 60,
  maxDecayDuration: 8 * 60 * 60,
  stabilizeDecayTarget: Decimal.pow(2, 1024),
  infinityPowerDrainUnlock: DC.E1000,
  infinityPowerDrainStartExponent: 2048,
  infinityPowerDrainSpan: 4096,
  infinityPowerDrainStart: Decimal.pow(2, 2048),
  infinityPowerDrainTarget: Decimal.pow(2, 6144),
  eternityDrainStart: Decimal.pow(2, 8192),
  eternityDrainTarget: Decimal.pow(2, 32768),
  infinityPowerDrainFirstMilestone: 0.2,
  infinityPowerDrainTickspeedMilestone: 0.55,
  drainRate: 0.01,
  minimumDrainProgressPerSecond: 0.00001,
  baseFragmentGainMultiplier: DC.E4,
  fragmentYieldTransitionStart: 0.02,
  earlyFragmentGainExponent: 75,
  replicantiChanceMilestone: 0.2,
  baseEffectiveAmountSoftcapStartExponent: 512,
  baseEffectiveAmountSoftcapTransitionExponent: 1200,
  maxEffectiveAmountSoftcapStartExponent: 8192,
  maxEffectiveAmountSoftcapTransitionExponent: 19200,
  softcapDelayDuration: 8 * 60 * 60,
  condensateRequirement: Decimal.pow(2, 8192),

  get isUnlocked() {
    return player.fragments?.unlocked ?? false;
  },
  get isDiscoveryPending() {
    return player.fragments?.discoveryPending ?? false;
  },
  get amount() {
    return player.fragments?.amount ?? DC.D0;
  },
  get total() {
    return player.fragments?.total ?? DC.D0;
  },
  get bestFragmentGain() {
    return player.fragments?.bestFragmentGain ?? DC.D0;
  },
  get condensate() {
    return player.fragments?.condensate;
  },
  get isCondensateUnlocked() {
    return this.condensate?.unlocked ?? false;
  },
  get condensateAmount() {
    return this.condensate?.amount ?? DC.D0;
  },
  get totalCondensate() {
    return this.condensate?.total ?? DC.D0;
  },
  get canCondense() {
    return this.isUnlocked && this.amount.gte(this.condensateRequirement);
  },
  get condensateGain() {
    if (!this.canCondense) return DC.D0;
    return Decimal.pow(2, this.amount.log2().sub(8192).div(this.condensateDivisor)).clampMin(1);
  },
  get condensateDivisor() {
    const level = this.condensateRepeatMilestoneLevel("condensationFormula").clampMax(31);
    return new Decimal(2048).sub(level.times(64));
  },
  condensateRepeatMilestoneLevel(id) {
    return condensateRepeatMilestoneLevel(id, this.totalCondensate);
  },
  hasCondensateMilestone(id) {
    return hasCondensateMilestone(id, this.totalCondensate);
  },
  get fragmentEfficiencyLevel() {
    return this.condensateRepeatMilestoneLevel("fragmentEfficiency");
  },
  get firstJLevelMultiplier() {
    return TimeStudy(155).isBought ? 2 : 1;
  },
  get galacticThresholdJLevel() {
    if (!TimeStudy(114).isBought) return DC.D0;
    return this.condensateRepeatMilestoneLevel("rgScalingStart").times(this.firstJLevelMultiplier);
  },
  get galacticThresholdJMultiplier() {
    return DC.D1.add(this.galacticThresholdJLevel.times(0.03));
  },
  get refinedTranslationJLevel() {
    if (!TimeStudy(113).isBought) return DC.D0;
    return this.fragmentEfficiencyLevel.times(this.firstJLevelMultiplier);
  },
  get condensationTheoryJLevel() {
    if (!TimeStudy(112).isBought) return DC.D0;
    return this.condensateRepeatMilestoneLevel("condensationFormula").times(this.firstJLevelMultiplier);
  },
  get infinityDimensionJMultiplier() {
    return Decimal.pow(2, this.refinedTranslationJLevel);
  },
  get freeTickspeedJReduction() {
    const level = this.condensationTheoryJLevel;
    return level.times(0.15).div(level.add(10));
  },
  get replicantiGalaxyScalingStart() {
    const level = this.condensateRepeatMilestoneLevel("rgScalingStart");
    return new Decimal(15).add(level.pow(3));
  },
  get stabilizeDecayDrain() {
    return player.fragments?.drains?.stabilizeDecay;
  },
  get stabilizeDecayFill() {
    return this.stabilizeDecayDrain?.fill ?? DC.D0;
  },
  get infinityPowerDrain() {
    return player.fragments?.drains?.infinityPower;
  },
  get eternityDrain() {
    return player.fragments?.drains?.eternity;
  },
  get infinityPowerDrainFill() {
    return this.infinityPowerDrain?.fill ?? DC.D0;
  },
  get isInfinityPowerDrainUnlocked() {
    return player.fragments?.infinityPowerDrainUnlocked ?? false;
  },
  get isThirdDrainUnlocked() {
    return player.fragments?.thirdDrainUnlocked ?? false;
  },
  get infinityPowerDrainFraction() {
    if (this.infinityPowerDrainFill.lte(this.infinityPowerDrainStart)) return 0;
    return this.infinityPowerDrainFill.log2().sub(this.infinityPowerDrainStartExponent)
      .div(this.infinityPowerDrainSpan).clamp(0, 1).toNumber();
  },
  get isInfinityPowerDrainActive() {
    return this.infinityPowerDrain?.active ?? false;
  },
  get isInfinityPowerDrainComplete() {
    return this.infinityPowerDrainFraction >= 1;
  },
  get eternityDrainFill() {
    return this.eternityDrain?.fill ?? DC.D0;
  },
  get eternityDrainFraction() {
    if (this.eternityDrainFill.lte(this.eternityDrainStart)) return 0;
    return this.eternityDrainFill.log2().log2().sub(13).div(2).clamp(0, 1).toNumber();
  },
  get isThirdDrainActive() {
    return this.eternityDrain?.active ?? false;
  },
  get isThirdDrainComplete() {
    return this.eternityDrainFraction >= 1;
  },
  get infinityDimensionCapProgress() {
    return new Decimal(this.allDrainPowerActive ? this.totalDrainProgress : this.infinityPowerDrainFraction);
  },
  get infinityDimensionCapMultiplier() {
    const progress = this.infinityDimensionCapProgress;
    const exponent = progress.lte(1) ? progress.pow(2) : progress;
    return Decimal.pow(3, exponent);
  },
  get infinityGainMultiplier() {
    const progress = this.infinityPowerDrainFraction;
    if (progress < this.infinityPowerDrainFirstMilestone) return DC.D1;
    return DC.D2.times(Decimal.pow(25, (progress - this.infinityPowerDrainFirstMilestone) /
      (1 - this.infinityPowerDrainFirstMilestone)));
  },
  get infinityDimensionTickspeedMultiplier() {
    if (this.infinityPowerDrainFraction < this.infinityPowerDrainTickspeedMilestone) return DC.D1;
    const logBase = this.hasCondensateMilestone("improveTickspeedTransfer") ? Math.log10(4) : 1;
    return Tickspeed.perSecond.log10().div(logBase).max(1);
  },
  get totalDrainProgress() {
    return this.stabilizeDecayFraction + this.infinityPowerDrainFraction + this.eternityDrainFraction;
  },
  get replicantiChanceProgress() {
    return this.allDrainChanceActive ? this.totalDrainProgress : this.stabilizeDecayFraction;
  },
  get allDrainChanceActive() {
    return this.hasCondensateMilestone("allDrainChance");
  },
  get allDrainPowerActive() {
    return this.hasCondensateMilestone("allDrainPower");
  },
  get eternityGainMultiplier() {
    return new Decimal(1 + 49 * this.eternityDrainFraction);
  },
  get bankedInfinityFraction() {
    if (this.eternityDrainFraction < 0.4) return DC.D0;
    const progress = this.hasCondensateMilestone("allDrainEternity")
      ? this.totalDrainProgress
      : this.eternityDrainFraction;
    return new Decimal(progress).div(20);
  },
  get eternityPointDivisorReduction() {
    const progress = this.hasCondensateMilestone("allDrainEternity")
      ? this.totalDrainProgress
      : this.eternityDrainFraction;
    return progress >= 0.75 ? 30 : 0;
  },
  get hasThirdDrainPassiveIP() {
    return this.isThirdDrainComplete;
  },
  get stabilizeDecayFraction() {
    if (this.stabilizeDecayFill.lte(0)) return 0;
    return this.stabilizeDecayFill.log10().div(this.stabilizeDecayTarget.log10()).clamp(0, 1).toNumber();
  },
  get drainN() {
    return 0.01 + 0.99 * this.stabilizeDecayFraction;
  },
  get fragmentYieldTranslationProgress() {
    const progress = this.stabilizeDecayFraction;
    if (progress <= this.fragmentYieldTransitionStart) return 0;
    if (progress <= this.replicantiChanceMilestone) {
      const earlyProgress = (progress - this.fragmentYieldTransitionStart) /
        (this.replicantiChanceMilestone - this.fragmentYieldTransitionStart);
      return 0.5 * Math.sqrt(earlyProgress);
    }
    return 0.5 + 0.5 * (progress - this.replicantiChanceMilestone) /
      (1 - this.replicantiChanceMilestone);
  },
  get isStabilizeDecayActive() {
    return this.stabilizeDecayDrain?.active ?? false;
  },
  get isStabilizeDecayComplete() {
    return this.stabilizeDecayFraction >= 1;
  },
  drainFraction(drain) {
    if (drain === this.stabilizeDecayDrain) return this.stabilizeDecayFraction;
    if (drain === this.infinityPowerDrain) return this.infinityPowerDrainFraction;
    return this.eternityDrainFraction;
  },
  drainFillAtFraction(drain, fraction) {
    const cappedFraction = Math.clamp(fraction, 0, 1);
    if (drain === this.stabilizeDecayDrain) {
      return Decimal.pow(this.stabilizeDecayTarget, cappedFraction);
    }
    if (drain === this.infinityPowerDrain) {
      return Decimal.pow(2, this.infinityPowerDrainStartExponent + this.infinityPowerDrainSpan * cappedFraction);
    }
    return Decimal.pow(2, Decimal.pow(2, 13 + 2 * cappedFraction));
  },
  get decayDuration() {
    const interpolatedDuration = this.baseDecayDuration +
      (this.maxDecayDuration - this.baseDecayDuration) * this.stabilizeDecayFraction;
    const duration = interpolatedDuration + Achievement(108).effectOrDefault(0);
    const stabilizedDuration = this.hasCondensateMilestone("decayDuration") ? duration * 5 : duration;
    return TimeStudy(152).isBought ? stabilizedDuration / 2500 : stabilizedDuration;
  },
  get decayFactor() {
    if (!this.isUnlocked || this.bestFragmentGain.lte(0) || player.fragments.lastRecordGameTime.eq(0)) return 1;
    const elapsedSeconds = player.records.totalTimePlayed.sub(player.fragments.lastRecordGameTime)
      .div(1000).clampMin(0);
    return Decimal.pow(0.5, elapsedSeconds.div(this.decayDuration));
  },
  get effectiveAmount() {
    return this.applyThirdSoftcap(this.effectiveAmountBeforeThirdSoftcap);
  },
  get effectiveAmountBeforeThirdSoftcap() {
    const amount = this.decayedAmount;
    if (amount.lte(this.effectiveAmountSoftcapStart)) return amount;
    if (amount.lte(this.effectiveAmountSoftcapTransition)) {
      return this.effectiveAmountSoftcapStart.times(
        amount.div(this.effectiveAmountSoftcapStart).pow(this.firstSoftcapPower)
      );
    }
    const transitionValue = this.effectiveAmountSoftcapStart.times(
      this.effectiveAmountSoftcapTransition.div(this.effectiveAmountSoftcapStart).pow(this.firstSoftcapPower)
    );
    return transitionValue.times(amount.div(this.effectiveAmountSoftcapTransition).pow(this.secondSoftcapPower));
  },
  applyThirdSoftcap(amount) {
    const startExponent = this.thirdSoftcapStartExponent;
    const start = this.thirdSoftcapStart;
    if (amount.lte(start)) return amount;

    const compression = this.thirdSoftcapCompression;
    const overflow = amount.log2().sub(startExponent);
    // This double-log form is continuous and has unit slope at the boundary.
    const compressedOverflow = overflow.times(Math.LN2 / compression).add(1).log2().times(compression);
    return Decimal.pow(2, startExponent.add(compressedOverflow));
  },
  get thirdSoftcapStartExponent() {
    const delayMultiplier = TimeStudy(156).isBought ? TimeStudy(154).effectOrDefault(1) : 1;
    return new Decimal(8192).times(delayMultiplier);
  },
  get thirdSoftcapStart() {
    return Decimal.pow(2, this.thirdSoftcapStartExponent);
  },
  get isThirdSoftcapped() {
    return this.effectiveAmountBeforeThirdSoftcap.gt(this.thirdSoftcapStart);
  },
  get thirdSoftcapCompression() {
    return TimeStudy(156).isBought ? 1 / this.replicantiSoftcapStrength : 1;
  },
  get replicantiSoftcapStrength() {
    let strength = 1;
    if (TimeStudy(152).isBought) strength *= 0.25;
    if (TimeStudy(153).isBought) strength *= 0.5;
    return strength;
  },
  get firstSoftcapPower() {
    return 1 - (1 - 32 / 43) * this.replicantiSoftcapStrength;
  },
  get secondSoftcapPower() {
    return 1 - 0.5 * this.replicantiSoftcapStrength;
  },
  get softcapDelayProgress() {
    if (!TimeStudy(154).isBought) return 0;
    return Time.thisEternity.totalSeconds.div(this.softcapDelayDuration).clamp(0, 1).toNumber();
  },
  get effectiveAmountSoftcapStart() {
    const exponent = this.baseEffectiveAmountSoftcapStartExponent +
      (this.maxEffectiveAmountSoftcapStartExponent - this.baseEffectiveAmountSoftcapStartExponent) *
      this.softcapDelayProgress;
    return Decimal.pow(2, exponent);
  },
  get effectiveAmountSoftcapTransition() {
    const exponent = this.baseEffectiveAmountSoftcapTransitionExponent +
      (this.maxEffectiveAmountSoftcapTransitionExponent - this.baseEffectiveAmountSoftcapTransitionExponent) *
      this.softcapDelayProgress;
    return Decimal.pow(2, exponent);
  },
  get decayedAmount() {
    if (!this.isUnlocked || this.amount.lte(0)) return DC.D1;
    return Decimal.pow(this.amount, this.decayFactor).clampMin(1);
  },
  get isEffectiveAmountSoftcapped() {
    return this.decayedAmount.gt(this.effectiveAmountSoftcapStart);
  },
  get effectiveReplicantiBoost() {
    return this.effectiveAmount;
  },
  get effectiveReplicanti() {
    return Replicanti.amount.times(this.effectiveReplicantiBoost);
  },
  get fragmentGain() {
    const replicanti = this.effectiveReplicanti.clampMin(1);
    const earlyProgress = Math.min(this.stabilizeDecayFraction, this.fragmentYieldTransitionStart);
    const baseMultiplier = this.baseFragmentGainMultiplier.times(
      Decimal.pow10(this.earlyFragmentGainExponent * earlyProgress)
    );
    const fragmentEfficiency = this.fragmentEfficiencyLevel;
    const baseGain = replicanti.log10().times(this.drainN).times(baseMultiplier)
      .times(fragmentEfficiency.add(1).pow(2));
    const translation = this.fragmentYieldTranslationProgress;
    // Front-load half of the translation before the Chance milestone without allowing an early full conversion.
    return Decimal.pow(baseGain, 1 - translation).times(Decimal.pow(replicanti, translation))
      .pow(Decimal.pow(1.1, fragmentEfficiency));
  },

  checkForDiscovery() {
    if (this.isUnlocked || this.isDiscoveryPending || Currency.infinityPoints.lt(this.discoveryRequirement)) return;
    player.fragments.discoveryPending = true;
    GameUI.update();
  },
  checkForInfinityPowerDrainUnlock() {
    if (!this.isUnlocked || this.isInfinityPowerDrainUnlocked ||
      Currency.infinityPoints.lt(this.infinityPowerDrainUnlock)) return;
    player.fragments.infinityPowerDrainUnlocked = true;
    GameUI.notify.infinity("Power Through Time unlocked! The second Fragment Drain is now available.", 7000);
    TabNotification.infinityPowerDrainUnlock.tryTrigger();
    GameUI.update();
  },
  unlock() {
    if (this.isUnlocked || !this.isDiscoveryPending) return;
    player.fragments.unlocked = true;
    player.fragments.discoveryPending = false;
    player.fragments.lastRecordGameTime = player.records.totalTimePlayed;
    Achievement(96).unlock();
    Tab.fragments.main.show();
    GameUI.update();
  },
  recordBigCrunch() {
    if (!this.isUnlocked) return;
    const gained = this.fragmentGain;
    player.fragments.amount = player.fragments.amount.add(gained);
    player.fragments.total = player.fragments.total.add(gained);
    Achievement(101).unlock();
    if (gained.gt(this.bestFragmentGain)) {
      player.fragments.bestFragmentGain = new Decimal(gained);
      player.fragments.lastRecordGameTime = player.records.totalTimePlayed;
    }
  },
  condense() {
    if (!this.canCondense) return false;
    const gained = this.condensateGain;
    player.fragments.condensate.unlocked = true;
    player.fragments.thirdDrainUnlocked = true;
    Currency.condensate.add(gained);
    player.fragments.condensate.total = this.totalCondensate.add(gained);
    player.fragments.amount = DC.D0;
    player.fragments.total = DC.D0;
    player.fragments.bestFragmentGain = DC.D0;
    player.fragments.lastRecordGameTime = player.records.totalTimePlayed;
    if (!this.hasCondensateMilestone("preserveStabilizeDecay")) {
      this.stabilizeDecayDrain.fill = DC.D0;
    }
    if (!this.hasCondensateMilestone("preservePowerThroughTime")) {
      this.infinityPowerDrain.fill = DC.D0;
    }
    if (!this.hasCondensateMilestone("preserveThirdDrain")) {
      this.eternityDrain.fill = DC.D0;
    }
    for (const drain of Object.values(player.fragments.drains)) drain.active = false;
    GameUI.notify.info(`Condensed ${format(gained, 2, 2)} Condensate.`, 7000);
    Tab.fragments.condensate.show();
    GameUI.update();
    return true;
  },
  toggleStabilizeDecayDrain() {
    if (!this.isUnlocked || this.isStabilizeDecayComplete) return;
    this.toggleDrain(this.stabilizeDecayDrain, "Stabilize Decay");
  },
  toggleInfinityPowerDrain() {
    if (!this.isInfinityPowerDrainUnlocked || this.isInfinityPowerDrainComplete) return;
    this.toggleDrain(this.infinityPowerDrain, "Power Through Time");
  },
  toggleThirdDrain() {
    if (!this.isThirdDrainUnlocked || this.isThirdDrainComplete) return;
    this.toggleDrain(this.eternityDrain, "Power of Eternity");
  },
  toggleDrain(drain, name) {
    if (drain.active) {
      drain.active = false;
      GameUI.update();
      return;
    }
    const activeDrain = [this.stabilizeDecayDrain, this.infinityPowerDrain, this.eternityDrain]
      .find(candidate => candidate?.active);
    if (activeDrain) {
      if (player.fragments.lockDrainSwitching) {
        GameUI.notify.error("Only one Fragment Drain can be active; disable Drain Lock before switching.");
        return;
      }
      activeDrain.active = false;
      GameUI.notify.error(`Only one Fragment Drain can be active; ${name} paused the previous Drain.`);
    }
    drain.active = true;
    GameUI.update();
  },
  fillDrains(realDiff) {
    if (!this.isUnlocked || this.amount.lte(0)) return;
    const activeDrains = [this.stabilizeDecayDrain, this.infinityPowerDrain, this.eternityDrain]
      .filter(drain => drain?.active);
    const [drain] = activeDrains;
    for (const inactiveDrain of activeDrains.slice(1)) inactiveDrain.active = false;
    if (!drain) return;
    if (!this.canDrainProgress(drain)) return;
    let target = this.eternityDrainTarget;
    if (drain === this.stabilizeDecayDrain) target = this.stabilizeDecayTarget;
    if (drain === this.infinityPowerDrain) target = this.infinityPowerDrainTarget;
    const remaining = target.minus(drain.fill);
    if (remaining.lte(0)) {
      drain.active = false;
      return;
    }
    // `realDiff` is a Decimal in the game loop. Keep the decay factor in Decimal space so simulated time never
    // stops mattering after an arbitrary duration cap.
    const elapsedSeconds = realDiff.div(1000);
    const afterDrain = this.amount.times(Decimal.pow(1 - this.drainRate, elapsedSeconds));
    const currentFraction = this.drainFraction(drain);
    const nextFraction = elapsedSeconds.gte(1 / this.drainRate)
      ? 1
      : currentFraction + elapsedSeconds.toNumber() * this.drainRate;
    const maxFillForProgress = this.drainFillAtFraction(drain, nextFraction);
    const progressLimitedSpent = maxFillForProgress.minus(drain.fill).clampMin(0);
    const spent = Decimal.min(Decimal.min(this.amount.minus(afterDrain), remaining), progressLimitedSpent);
    if (spent.lte(0)) return;
    player.fragments.amount = this.amount.minus(spent);
    drain.fill = drain.fill.plus(spent);
    if (drain === this.stabilizeDecayDrain) {
      if (this.stabilizeDecayFraction >= this.fragmentYieldTransitionStart) Achievement(102).unlock();
      if (this.decayDuration >= 4 * 60 * 60) Achievement(105).unlock();
      if (this.isStabilizeDecayComplete) drain.active = false;
    } else if (drain === this.infinityPowerDrain && this.isInfinityPowerDrainComplete) {
      drain.active = false;
    } else if (drain === this.eternityDrain && this.isThirdDrainComplete) {
      drain.active = false;
    }
  },
  canDrainProgress(drain) {
    if (!drain || this.amount.lte(0)) return false;
    let target = this.eternityDrainTarget;
    if (drain === this.stabilizeDecayDrain) target = this.stabilizeDecayTarget;
    if (drain === this.infinityPowerDrain) target = this.infinityPowerDrainTarget;
    const remaining = target.minus(drain.fill);
    if (remaining.lte(0)) return false;

    const oneSecondSpent = Decimal.min(this.amount.times(this.drainRate), remaining);
    const currentFraction = this.drainFraction(drain);
    const nextFraction = this.drainFractionAtFill(drain, drain.fill.plus(oneSecondSpent));
    return oneSecondSpent.gte(remaining) || nextFraction - currentFraction > this.minimumDrainProgressPerSecond;
  },
  drainFractionAtFill(drain, fill) {
    if (drain === this.stabilizeDecayDrain) {
      return fill.lte(0) ? 0 : fill.log10().div(this.stabilizeDecayTarget.log10()).clamp(0, 1).toNumber();
    }
    if (drain === this.infinityPowerDrain) {
      return fill.lte(this.infinityPowerDrainStart) ? 0 : fill.log2().sub(this.infinityPowerDrainStartExponent)
        .div(this.infinityPowerDrainSpan).clamp(0, 1).toNumber();
    }
    return fill.lte(this.eternityDrainStart) ? 0 : fill.log2().log2().sub(13).div(2).clamp(0, 1).toNumber();
  },
  gainAutoFragments(realDiff) {
    if (!this.hasCondensateMilestone("autoFragments")) return;
    const gained = this.fragmentGain.times(realDiff).div(100000);
    player.fragments.amount = this.amount.add(gained);
    player.fragments.total = this.total.add(gained);
  },
  galaxyPower: {
    // Reserved for the Fragment Drain's future Galaxy-strength effect.
    effect: () => DC.D1
  },
  fastestInfinitySoftcap: {
    // The base value keeps the default fastest-Infinity softcap. Future Fragments move its start point lower.
    effect: () => DC.D1
  },
  universeGlitchFrequency: {
    // The base value preserves the temporary playtest cadence. Future Fragment totals increase this value.
    effect: () => DC.D1
  },
  ipMultCostScaling: {
    // A future Fragment effect returns a normalized 0-1 strength which softens the post-ee6 IP multiplier cost curve.
    effect: () => DC.D0
  }
};

EventHub.logic.on(GAME_EVENT.GAME_TICK_AFTER, () => {
  Fragments.checkForDiscovery();
  Fragments.checkForInfinityPowerDrainUnlock();
});

EventHub.logic.on(GAME_EVENT.ETERNITY_RESET_BEFORE, () => {
  Fragments.checkForInfinityPowerDrainUnlock();
});
