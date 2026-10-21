<script>
import CustomizeableTooltip from "@/components/CustomizeableTooltip";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";
import { Fragments } from "@/core/secret-formula/fragments";

export default {
  name: "FragmentsTab",
  components: {
    CustomizeableTooltip,
    PrimaryToggleButton,
  },
  data() {
    return {
      amount: new Decimal(),
      total: new Decimal(),
      bestFragmentGain: new Decimal(),
      effectiveReplicanti: new Decimal(),
      fragmentGain: new Decimal(),
      stabilizeDecayFill: new Decimal(),
      stabilizeDecayTarget: new Decimal(),
      stabilizeDecayFraction: 0,
      fragmentGainTransitionProgress: 0,
      replicantiChance: new Decimal(),
      decayedFragments: new Decimal(),
      effectiveFragmentAmount: new Decimal(),
      isFragmentEffectSoftcapped: false,
      isThirdFragmentEffectSoftcapped: false,
      thirdSoftcapStart: new Decimal(),
      milestoneTooltipLeft: "0px",
      infinityPowerMilestoneTooltipLeft: "0px",
      thirdDrainMilestoneTooltipLeft: "0px",
      isStabilizeDecayActive: false,
      isStabilizeDecayWaiting: false,
      isStabilizeDecayComplete: false,
      decayFactor: 1,
      decayDuration: 0,
      isInfinityPowerDrainUnlocked: false,
      isInfinityPowerDrainActive: false,
      isInfinityPowerDrainWaiting: false,
      isInfinityPowerDrainComplete: false,
      infinityPowerDrainFill: new Decimal(),
      infinityPowerDrainFraction: 0,
      infinityGainMultiplier: new Decimal(),
      infinityDimensionTickspeedMultiplier: new Decimal(),
      infinityDimensionCapMultiplier: new Decimal(),
      infinityDimensionBasePurchaseCap: new Decimal(),
      infinityDimensionPurchaseCap: new Decimal(),
      isThirdDrainUnlocked: false,
      isThirdDrainActive: false,
      isThirdDrainWaiting: false,
      isDrainSwitchLocked: false,
      isThirdDrainComplete: false,
      thirdDrainFill: new Decimal(),
      thirdDrainFraction: 0,
      eternityGainMultiplier: new Decimal(),
      bankedInfinityFraction: new Decimal(),
      drainMilestones: [
        { requirement: 0.02, name: "Yield awakening" },
        { requirement: 0.2, name: "Deep stabilization" },
        { requirement: 1, name: "Uncap Replicanti" }
      ],
      selectedHoverMilestone: { requirement: 0.02, name: "Yield awakening" },
      selectedInfinityPowerMilestone: 0.2,
      selectedThirdDrainMilestone: 0.4,
    };
  },
  computed: {
    decayText() {
      return `^${format(this.decayFactor, 3, 3)}`;
    },
    durationText() {
      return TimeSpan.fromSeconds(this.decayDuration).toStringShort(false);
    },
    tooltipArrowStyle() {
      return {
        borderTop: "0.55rem solid #f3a0c8"
      };
    },
    completedThirdDrainMilestones() {
      return [0.4, 0.75, 1].filter(requirement => this.thirdDrainFraction >= requirement);
    },
    drainStatusLabel() {
      return (complete, active, waiting) => {
        if (complete) return "(Complete)";
        if (waiting) return "(Waiting)";
        return active ? "(Filling)" : "(Idle)";
      };
    },
  },
  mounted() {
    this.updateMilestoneTooltipPosition();
    this.updateThirdDrainMilestoneTooltipPosition();
  },
  methods: {
    update() {
      this.amount.copyFrom(Fragments.amount);
      this.total.copyFrom(Fragments.total);
      this.bestFragmentGain.copyFrom(Fragments.bestFragmentGain);
      this.effectiveReplicanti.copyFrom(Fragments.effectiveReplicanti);
      this.fragmentGain.copyFrom(Fragments.fragmentGain);
      this.stabilizeDecayFill.copyFrom(Fragments.stabilizeDecayFill);
      this.stabilizeDecayTarget.copyFrom(Fragments.stabilizeDecayTarget);
      this.stabilizeDecayFraction = Fragments.stabilizeDecayFraction;
      this.fragmentGainTransitionProgress = Fragments.fragmentYieldTranslationProgress;
      this.replicantiChance.copyFrom(Replicanti.chance);
      this.decayedFragments.copyFrom(Fragments.decayedAmount);
      this.effectiveFragmentAmount.copyFrom(Fragments.effectiveAmount);
      this.isFragmentEffectSoftcapped = Fragments.isEffectiveAmountSoftcapped;
      this.isThirdFragmentEffectSoftcapped = Fragments.isThirdSoftcapped;
      this.thirdSoftcapStart.copyFrom(Fragments.thirdSoftcapStart);
      this.isStabilizeDecayActive = Fragments.isStabilizeDecayActive;
      this.isStabilizeDecayWaiting = this.isStabilizeDecayActive &&
        !Fragments.canDrainProgress(Fragments.stabilizeDecayDrain);
      this.isStabilizeDecayComplete = Fragments.isStabilizeDecayComplete;
      this.decayFactor = Fragments.decayFactor;
      this.decayDuration = Fragments.decayDuration;
      this.isInfinityPowerDrainUnlocked = Fragments.isInfinityPowerDrainUnlocked;
      this.isInfinityPowerDrainActive = Fragments.isInfinityPowerDrainActive;
      this.isInfinityPowerDrainWaiting = this.isInfinityPowerDrainActive &&
        !Fragments.canDrainProgress(Fragments.infinityPowerDrain);
      this.isInfinityPowerDrainComplete = Fragments.isInfinityPowerDrainComplete;
      this.infinityPowerDrainFill.copyFrom(Fragments.infinityPowerDrainFill);
      this.infinityPowerDrainFraction = Fragments.infinityPowerDrainFraction;
      this.infinityGainMultiplier.copyFrom(Fragments.infinityGainMultiplier);
      this.infinityDimensionTickspeedMultiplier.copyFrom(Fragments.infinityDimensionTickspeedMultiplier);
      this.infinityDimensionCapMultiplier.copyFrom(Fragments.infinityDimensionCapMultiplier);
      this.infinityDimensionBasePurchaseCap.copyFrom(InfinityDimensions.basePurchaseCap);
      this.infinityDimensionPurchaseCap.copyFrom(InfinityDimensions.totalDimCap);
      this.isThirdDrainUnlocked = Fragments.isThirdDrainUnlocked;
      this.isThirdDrainActive = Fragments.isThirdDrainActive;
      this.isThirdDrainWaiting = this.isThirdDrainActive && !Fragments.canDrainProgress(Fragments.eternityDrain);
      this.isDrainSwitchLocked = player.fragments.lockDrainSwitching;
      this.isThirdDrainComplete = Fragments.isThirdDrainComplete;
      this.thirdDrainFill.copyFrom(Fragments.eternityDrainFill);
      this.thirdDrainFraction = Fragments.eternityDrainFraction;
      this.eternityGainMultiplier.copyFrom(Fragments.eternityGainMultiplier);
      this.bankedInfinityFraction.copyFrom(Fragments.bankedInfinityFraction);
    },
    toggleStabilizeDecayDrain() {
      Fragments.toggleStabilizeDecayDrain();
    },
    toggleInfinityPowerDrain() {
      Fragments.toggleInfinityPowerDrain();
    },
    toggleThirdDrain() {
      Fragments.toggleThirdDrain();
    },
    setDrainSwitchLock(value) {
      player.fragments.lockDrainSwitching = value;
      this.isDrainSwitchLocked = value;
    },
    hasDrainMilestone(milestone) {
      return this.stabilizeDecayFraction >= milestone.requirement;
    },
    shouldShowCompletedMilestone(milestone) {
      return this.hasDrainMilestone(milestone) && milestone.requirement !== this.drainMilestones[0].requirement &&
        milestone.requirement !== 1;
    },
    milestoneDuration(milestone) {
      const duration = Fragments.baseDecayDuration +
        (Fragments.maxDecayDuration - Fragments.baseDecayDuration) * milestone.requirement;
      return TimeSpan.fromSeconds(duration).toStringShort(false);
    },
    milestoneResourceText(milestone) {
      const requirement = Decimal.pow(this.stabilizeDecayTarget, milestone.requirement);
      return `${formatPercents(milestone.requirement)} (${format(requirement, 2, 2)} Fragments)`;
    },
    milestoneDescriptionText(milestone) {
      if (milestone.requirement === Fragments.fragmentYieldTransitionStart) {
        return `${milestone.name}: Fragment gain begins translating toward Effective Replicanti.`;
      }
      if (milestone.requirement === Fragments.replicantiChanceMilestone) {
        return `${milestone.name}: Replicanti Chance now equals Drain progress.`;
      }
      if (milestone.requirement === 1) {
        return `${milestone.name}: Fragment Decay stabilizes and Replicanti becomes uncapped.`;
      }
      return `${milestone.name}: Fragment Decay half-life reaches ${this.milestoneDuration(milestone)}.`;
    },
    completedMilestoneText(milestone) {
      if (milestone.requirement === Fragments.replicantiChanceMilestone) {
        return `Replicanti Chance: ${formatPercents(this.replicantiChance, 2)}`;
      }
      return this.milestoneDescriptionText(milestone);
    },
    infinityPowerDrainMilestoneText(requirement) {
      if (requirement === 0.2) {
        const multiplier = formatX(this.infinityGainMultiplier, 2, 2);
        return `Infinity Count: Big Crunch and automatic Infinity gain are ${multiplier}.`;
      }
      if (requirement === 0.55) {
        const multiplier = formatX(this.infinityDimensionTickspeedMultiplier, 2, 2);
        return `Tickspeed Transfer: Infinity Dimensions gain ${multiplier} from Tickspeed.`;
      }
      return "Unbroken Boosts: Dimension Boost no longer resets anything.";
    },
    infinityPowerDrainCurrentEffectText(requirement) {
      if (requirement === 0.2) return `Infinity gain: ${formatX(this.infinityGainMultiplier, 2, 2)}`;
      if (requirement === 0.55) {
        return `Infinity Dimensions: ${formatX(this.infinityDimensionTickspeedMultiplier, 2, 2)}`;
      }
      return this.infinityPowerDrainMilestoneText(requirement);
    },
    infinityPowerMilestoneRequirementText(requirement) {
      const exponent = Fragments.infinityPowerDrainStartExponent + Fragments.infinityPowerDrainSpan * requirement;
      return `${formatPercents(requirement)} (${format(Decimal.pow(2, exponent), 2, 2)} Fragments)`;
    },
    nextInfinityPowerDrainMilestone() {
      if (this.infinityPowerDrainFraction < 0.2) return 0.2;
      if (this.infinityPowerDrainFraction < 0.55) return 0.55;
      return 1;
    },
    nextInfinityPowerDrainCost() {
      const milestone = this.nextInfinityPowerDrainMilestone();
      const exponent = Fragments.infinityPowerDrainStartExponent + Fragments.infinityPowerDrainSpan * milestone;
      return Decimal.pow(2, exponent);
    },
    thirdDrainMilestoneText(requirement) {
      if (requirement === 0.4) {
        return `Banked Infinities after Eternity: ${formatPercents(this.bankedInfinityFraction, 3)}`;
      }
      if (requirement === 0.75) return "Eternity Point formula divisor: -30.";
      return "Passive Infinity Point gain: 1% of Big Crunch IP per second.";
    },
    thirdDrainMilestoneTooltipText(requirement) {
      if (requirement === 0.4) {
        return "After Eternity, gain Banked Infinities equal to Drain progress divided by 20.";
      }
      if (requirement === 0.75) return "Make the Eternity Point formula divisor better: 2880 → 2850.";
      return "You gain 1% of your Infinity Points gained on crunch each second.";
    },
    thirdDrainMilestoneRequirementText(requirement) {
      const requiredFragments = Fragments.drainFillAtFraction(Fragments.eternityDrain, requirement);
      return `${formatPercents(requirement)} (${format(requiredFragments, 2, 2)} Fragments)`;
    },
    nextThirdDrainMilestone() {
      if (this.thirdDrainFraction < 0.4) return 0.4;
      if (this.thirdDrainFraction < 0.75) return 0.75;
      return 1;
    },
    nextThirdDrainCost() {
      return Fragments.drainFillAtFraction(Fragments.eternityDrain, this.nextThirdDrainMilestone());
    },
    handleMilestoneRequirementTooltipDisplay(event) {
      const bar = this.$refs.fragmentDrainBar;
      if (!bar) return;
      const mouseX = event.clientX - bar.getBoundingClientRect().x;
      const closest = this.drainMilestones
        .map(milestone => ({
          milestone,
          distance: Math.abs(bar.clientLeft + milestone.requirement * bar.clientWidth - mouseX)
        }))
        .filter(entry => entry.distance < 32)
        .sort((a, b) => a.distance - b.distance)[0];
      if (!closest) return;
      this.selectedHoverMilestone = closest.milestone;
      this.updateMilestoneTooltipPosition();
    },
    handleInfinityPowerMilestoneTooltipDisplay(event) {
      const bar = this.$refs.infinityPowerDrainBar;
      if (!bar) return;
      const mouseX = event.clientX - bar.getBoundingClientRect().x;
      const closest = [0.2, 0.55, 1]
        .map(requirement => ({
          requirement,
          distance: Math.abs(bar.clientLeft + requirement * bar.clientWidth - mouseX)
        }))
        .filter(entry => entry.distance < 32)
        .sort((a, b) => a.distance - b.distance)[0];
      if (!closest) return;
      this.selectedInfinityPowerMilestone = closest.requirement;
      this.updateInfinityPowerMilestoneTooltipPosition();
    },
    handleThirdDrainMilestoneTooltipDisplay(event) {
      const bar = this.$refs.thirdDrainBar;
      if (!bar) return;
      const mouseX = event.clientX - bar.getBoundingClientRect().x;
      const closest = [0.4, 0.75, 1]
        .map(requirement => ({
          requirement,
          distance: Math.abs(bar.clientLeft + requirement * bar.clientWidth - mouseX)
        }))
        .filter(entry => entry.distance < 32)
        .sort((a, b) => a.distance - b.distance)[0];
      if (!closest) return;
      this.selectedThirdDrainMilestone = closest.requirement;
      this.updateThirdDrainMilestoneTooltipPosition();
    },
    updateMilestoneTooltipPosition() {
      const bar = this.$refs.fragmentDrainBar;
      if (!bar) return;
      const position = bar.offsetLeft + bar.clientLeft + this.selectedHoverMilestone.requirement * bar.clientWidth;
      this.milestoneTooltipLeft = `${position}px`;
    },
    updateInfinityPowerMilestoneTooltipPosition() {
      const bar = this.$refs.infinityPowerDrainBar;
      if (!bar) return;
      const position = bar.offsetLeft + bar.clientLeft + this.selectedInfinityPowerMilestone * bar.clientWidth;
      this.infinityPowerMilestoneTooltipLeft = `${position}px`;
    },
    updateThirdDrainMilestoneTooltipPosition() {
      const bar = this.$refs.thirdDrainBar;
      if (!bar) return;
      const position = bar.offsetLeft + bar.clientLeft + this.selectedThirdDrainMilestone * bar.clientWidth;
      this.thirdDrainMilestoneTooltipLeft = `${position}px`;
    },
    tooltipContentClass() {
      return {
        "c-fragment-drain__milestone-tooltip": true,
        "c-fragment-drain__milestone-tooltip--unlocked": this.hasDrainMilestone(this.selectedHoverMilestone)
      };
    },
    infinityPowerTooltipContentClass() {
      return {
        "c-fragment-drain__milestone-tooltip": true,
        "c-fragment-drain__milestone-tooltip--unlocked":
          this.infinityPowerDrainFraction >= this.selectedInfinityPowerMilestone
      };
    },
    thirdDrainTooltipContentClass() {
      return {
        "c-fragment-drain__milestone-tooltip": true,
        "c-fragment-drain__milestone-tooltip--unlocked":
          this.thirdDrainFraction >= this.selectedThirdDrainMilestone
      };
    }
  }
};
</script>

<template>
  <div class="l-fragments-tab">
    <div class="c-fragments-tab__title">
      You have <span class="c-fragments-tab__accent">{{ format(amount, 2, 2) }}</span> Fragments
      <span class="c-fragments-tab__total">({{ format(total, 2, 2) }} total)</span>
    </div>
    <div class="c-fragments-tab__description c-fragments-tab__description--overview">
      On Big Crunch, gain <span class="c-fragments-tab__value">{{ format(fragmentGain, 2, 2) }}</span> Fragments
      from your Effective Replicanti.
      <br>
      Effective Replicanti: <span class="c-fragments-tab__value">{{ format(effectiveReplicanti, 2) }}</span>
      <br>
      Fragment efficiency: <span class="c-fragments-tab__value">{{ decayText }}</span>
      <template v-if="isFragmentEffectSoftcapped">
        <br>
        Fragment Replicanti factor:
        <span class="c-fragments-tab__value">×{{ format(effectiveFragmentAmount, 2) }}</span>
        <br>
        Softcapped from <span class="c-fragments-tab__value">×{{ format(decayedFragments, 2) }}</span>
        <template v-if="isThirdFragmentEffectSoftcapped">
          <br>
          Third Softcap begins at <span class="c-fragments-tab__value">×{{ format(thirdSoftcapStart, 2) }}</span>
        </template>
      </template>
      <br>
      Your best Fragment gain is <span class="c-fragments-tab__value">{{ format(bestFragmentGain, 2) }}</span>.
    </div>
    <div class="c-fragment-drain-group">
      <div class="c-fragment-drain__description">
        Only one Drain can be active at a time; switching preserves deposited progress.
        Drains up to 1% of current Fragments and fills up to 1% each second.
        They wait until progress reaches 0.001%/s.
        <div class="c-fragment-drain__lock">
          <PrimaryToggleButton
            :value="isDrainSwitchLocked"
            label="Drain Lock:"
            on="Locked"
            off="Switchable"
            @input="setDrainSwitchLock"
          />
        </div>
      </div>
      <div class="c-fragment-drain">
        <div class="c-fragment-drain__status c-fragment-drain__status--effect">
          <div class="c-fragment-drain__header">
            Stabilize Decay
          </div>
          <div class="c-fragment-drain__effect">
            Current half-life: {{ durationText }}
          </div>
          <div
            v-if="stabilizeDecayFraction >= drainMilestones[0].requirement"
            class="c-fragment-drain__effect"
          >
            Formula Translated: {{ formatPercents(fragmentGainTransitionProgress, 2) }}
          </div>
          <template v-for="milestone in drainMilestones">
            <div
              v-if="shouldShowCompletedMilestone(milestone)"
              :key="milestone.requirement"
              class="c-fragment-drain__effect"
            >
              {{ completedMilestoneText(milestone) }}
            </div>
          </template>
        </div>
        <div class="c-fragment-drain__center">
          <button
            ref="fragmentDrainBar"
            class="c-fragment-drain__bar"
            :class="{ 'c-fragment-drain__bar--active': isStabilizeDecayActive }"
            :disabled="isStabilizeDecayComplete"
            @click="toggleStabilizeDecayDrain"
            @mousemove="handleMilestoneRequirementTooltipDisplay"
          >
            <span
              class="c-fragment-drain__fill"
              :style="{ width: `${stabilizeDecayFraction * 100}%` }"
            />
            <span
              v-for="milestone in drainMilestones"
              :key="milestone.requirement"
              class="c-fragment-drain__milestone-line"
              :class="{ 'c-fragment-drain__milestone-line--unlocked': hasDrainMilestone(milestone) }"
              :style="{ left: `calc(${milestone.requirement * 100}% - 0.1rem)` }"
            />
            <span class="c-fragment-drain__label">
              {{ formatPercents(stabilizeDecayFraction, 3) }}
              {{ drainStatusLabel(isStabilizeDecayComplete, isStabilizeDecayActive, isStabilizeDecayWaiting) }}
            </span>
          </button>
          <CustomizeableTooltip
            class="c-fragment-drain__milestone-hover-container"
            :tooltip-class="tooltipContentClass()"
            :tooltip-arrow-style="tooltipArrowStyle"
            :tooltip-arrow-position-style="{ left: milestoneTooltipLeft }"
            :left="`calc(${selectedHoverMilestone.requirement * 100}% - 0.1rem)`"
            top="0"
            content-class="c-fragment-drain__milestone-hover-area"
          >
            <template #tooltipContent>
              {{ milestoneResourceText(selectedHoverMilestone) }}
              <br>
              <br>
              {{ milestoneDescriptionText(selectedHoverMilestone) }}
            </template>
          </CustomizeableTooltip>
        </div>
        <div class="c-fragment-drain__status c-fragment-drain__status--resource">
          <div class="c-fragment-drain__header">
            Stabilize Decay
          </div>
          <div>Total Filled: {{ format(stabilizeDecayFill, 2, 2) }}</div>
        </div>
      </div>
    </div>
    <div
      v-if="isInfinityPowerDrainUnlocked"
      class="c-fragment-drain-group"
    >
      <div class="c-fragment-drain">
        <div class="c-fragment-drain__status c-fragment-drain__status--effect">
          <div class="c-fragment-drain__header">
            Power Through Time
          </div>
          <div class="c-fragment-drain__effect">
            ID Purchase Cap: {{ formatInt(infinityDimensionBasePurchaseCap) }} →
            {{ formatInt(infinityDimensionPurchaseCap) }}
            ({{ formatX(infinityDimensionCapMultiplier, 3, 3) }})
          </div>
          <div
            v-if="infinityPowerDrainFraction >= 0.2"
            class="c-fragment-drain__effect"
          >
            {{ infinityPowerDrainCurrentEffectText(0.2) }}
          </div>
          <div
            v-if="infinityPowerDrainFraction >= 0.55"
            class="c-fragment-drain__effect"
          >
            {{ infinityPowerDrainCurrentEffectText(0.55) }}
          </div>
        </div>
        <div class="c-fragment-drain__center">
          <button
            ref="infinityPowerDrainBar"
            class="c-fragment-drain__bar"
            :class="{ 'c-fragment-drain__bar--active': isInfinityPowerDrainActive }"
            :disabled="isInfinityPowerDrainComplete"
            @click="toggleInfinityPowerDrain"
            @mousemove="handleInfinityPowerMilestoneTooltipDisplay"
          >
            <span
              class="c-fragment-drain__fill"
              :style="{ width: `${infinityPowerDrainFraction * 100}%` }"
            />
            <span
              v-for="requirement in [0.2, 0.55, 1]"
              :key="requirement"
              class="c-fragment-drain__milestone-line"
              :class="{ 'c-fragment-drain__milestone-line--unlocked': infinityPowerDrainFraction >= requirement }"
              :style="{ left: `calc(${requirement * 100}% - 0.1rem)` }"
            />
            <span class="c-fragment-drain__label">
              {{ formatPercents(infinityPowerDrainFraction, 3) }}
              {{ drainStatusLabel(
                isInfinityPowerDrainComplete, isInfinityPowerDrainActive, isInfinityPowerDrainWaiting
              ) }}
            </span>
          </button>
          <CustomizeableTooltip
            class="c-fragment-drain__milestone-hover-container"
            :tooltip-class="infinityPowerTooltipContentClass()"
            :tooltip-arrow-style="tooltipArrowStyle"
            :tooltip-arrow-position-style="{ left: infinityPowerMilestoneTooltipLeft }"
            :left="`calc(${selectedInfinityPowerMilestone * 100}% - 0.1rem)`"
            top="0"
            content-class="c-fragment-drain__milestone-hover-area"
          >
            <template #tooltipContent>
              {{ infinityPowerMilestoneRequirementText(selectedInfinityPowerMilestone) }}
              <br>
              <br>
              {{ infinityPowerDrainMilestoneText(selectedInfinityPowerMilestone) }}
            </template>
          </CustomizeableTooltip>
        </div>
        <div class="c-fragment-drain__status c-fragment-drain__status--resource">
          <div class="c-fragment-drain__header">
            Power Through Time
          </div>
          <div>Total Filled: {{ format(infinityPowerDrainFill, 2, 2) }}</div>
          <div>Next milestone: {{ format(nextInfinityPowerDrainCost(), 2, 2) }}</div>
        </div>
      </div>
    </div>
    <div
      v-if="isThirdDrainUnlocked"
      class="c-fragment-drain-group"
    >
      <div class="c-fragment-drain">
        <div class="c-fragment-drain__status c-fragment-drain__status--effect">
          <div class="c-fragment-drain__header">
            Power of Eternity
          </div>
          <div class="c-fragment-drain__effect">
            Eternities gain: {{ formatX(eternityGainMultiplier, 2, 2) }}
          </div>
          <div
            v-for="requirement in completedThirdDrainMilestones"
            :key="requirement"
            class="c-fragment-drain__effect"
          >
            {{ thirdDrainMilestoneText(requirement) }}
          </div>
        </div>
        <div class="c-fragment-drain__center">
          <button
            ref="thirdDrainBar"
            class="c-fragment-drain__bar"
            :class="{ 'c-fragment-drain__bar--active': isThirdDrainActive }"
            :disabled="isThirdDrainComplete"
            @click="toggleThirdDrain"
            @mousemove="handleThirdDrainMilestoneTooltipDisplay"
          >
            <span
              class="c-fragment-drain__fill"
              :style="{ width: `${thirdDrainFraction * 100}%` }"
            />
            <span
              v-for="requirement in [0.4, 0.75, 1]"
              :key="requirement"
              class="c-fragment-drain__milestone-line"
              :class="{ 'c-fragment-drain__milestone-line--unlocked': thirdDrainFraction >= requirement }"
              :style="{ left: `calc(${requirement * 100}% - 0.1rem)` }"
            />
            <span class="c-fragment-drain__label">
              {{ formatPercents(thirdDrainFraction, 3) }}
              {{ drainStatusLabel(isThirdDrainComplete, isThirdDrainActive, isThirdDrainWaiting) }}
            </span>
          </button>
          <CustomizeableTooltip
            class="c-fragment-drain__milestone-hover-container"
            :tooltip-class="thirdDrainTooltipContentClass()"
            :tooltip-arrow-style="tooltipArrowStyle"
            :tooltip-arrow-position-style="{ left: thirdDrainMilestoneTooltipLeft }"
            :left="`calc(${selectedThirdDrainMilestone * 100}% - 0.1rem)`"
            top="0"
            content-class="c-fragment-drain__milestone-hover-area"
          >
            <template #tooltipContent>
              {{ thirdDrainMilestoneRequirementText(selectedThirdDrainMilestone) }}
              <br>
              <br>
              {{ thirdDrainMilestoneTooltipText(selectedThirdDrainMilestone) }}
            </template>
          </CustomizeableTooltip>
        </div>
        <div class="c-fragment-drain__status c-fragment-drain__status--resource">
          <div class="c-fragment-drain__header">
            Power of Eternity
          </div>
          <div>Total Filled: {{ format(thirdDrainFill, 2, 2) }}</div>
          <div>Next milestone: {{ format(nextThirdDrainCost(), 2, 2) }}</div>
        </div>
      </div>
    </div>
    <div class="c-fragments-tab__description">
      Fragment efficiency decays by ^0.5 every {{ durationText }} unless you Big Crunch with more Fragments than
      your previous best gain.
    </div>
  </div>
</template>

<style scoped>
.l-fragments-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding-top: 2rem;
}

.c-fragments-tab__title {
  font-size: 1.7rem;
}

.c-fragments-tab__accent {
  color: #f3a0c8;
  font-size: 2.6rem;
  font-weight: bold;
}

.c-fragments-tab__total {
  font-size: 1.5rem;
}

.c-fragments-tab__description {
  font-size: 1.0rem;
  line-height: 1.5;
}

.c-fragments-tab__description--overview {
  font-size: 1.5rem;
  line-height: 1.7;
}

.c-fragments-tab__value {
  color: #f3a0c8;
  font-size: 2.2rem;
}


.c-fragment-drain {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.8rem 1.2rem;
  border: var(--var-border-width, 0.2rem) solid #c74e8a;
  border-radius: var(--var-border-radius, 0.5rem);
  box-shadow: inset 0 0 1.2rem rgb(199 78 138 / 30%);
}

.c-fragment-drain-group {
  width: 86rem;
}

.c-fragment-drain__status {
  width: 24rem;
  min-height: 7rem;
  text-align: left;
}

.c-fragment-drain__status--resource {
  text-align: right;
}

.c-fragment-drain__header {
  color: #f3a0c8;
  font-size: 1.8rem;
  font-weight: bold;
}

.c-fragment-drain__description {
  margin: 0.8rem 0;
}

.c-fragment-drain__lock {
  margin-top: 0.4rem;
  text-align: center;
}

.c-fragment-drain__effect {
  color: #f3a0c8;
}

.c-fragment-drain__center {
  width: 32rem;
  flex: 0 0 32rem;
  position: relative;
}

.c-fragment-drain__bar {
  width: 100%;
  height: 5rem;
  position: relative;
  overflow: hidden;
  font-family: Typewriter, serif;
  font-weight: 300;
  color: var(--color-text);
  background: #5e2444;
  border: 0.2rem solid #c74e8a;
  border-radius: var(--var-border-radius, 0.5rem);
  cursor: pointer;
}

.c-fragment-drain__bar--active {
  box-shadow: 0 0 0.8rem #f3a0c8;
}

.c-fragment-drain__bar:disabled {
  cursor: default;
}

.c-fragment-drain__fill {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: #c74e8a;
  transition: width 0.15s;
}

.c-fragment-drain__milestone-line {
  width: 0.2rem;
  height: 100%;
  position: absolute;
  z-index: 1;
  top: 0;
  background: #f3a0c8;
  animation: a-fragment-drain-milestone-flash infinite 1s linear;
  pointer-events: none;
}

.c-fragment-drain__milestone-line--unlocked {
  animation: none;
}

.c-fragment-drain__label {
  width: 100%;
  z-index: 2;
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  font-size: 1.5rem;
  font-weight: inherit;
  color: var(--color-text);
  filter: drop-shadow(0.1rem 0.1rem 0.1rem #c74e8a);
  pointer-events: none;
}

@keyframes a-fragment-drain-milestone-flash {
  0%, 20%, 80%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>

<style>
.c-fragment-drain__milestone-hover-area {
  width: 2rem;
  height: 100%;
  z-index: 3;
}

.c-fragment-drain__milestone-tooltip {
  width: 22rem;
  z-index: 4;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-text);
  background-color: var(--color-base);
  border: 0.1rem solid #c74e8a;
}

.s-base--dark .c-fragment-drain__milestone-tooltip {
  background-color: #111;
}

.c-fragment-drain__milestone-tooltip--unlocked {
  color: #111;
  background-color: #f3a0c8;
  box-shadow: 0 0 0 0.1rem #111;
}

.s-base--dark .c-fragment-drain__milestone-tooltip--unlocked {
  background-color: #f3a0c8;
}
</style>
