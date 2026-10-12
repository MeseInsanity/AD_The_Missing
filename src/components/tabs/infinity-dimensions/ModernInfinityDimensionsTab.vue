<script>
import InfinityDimensionRow from "./ModernInfinityDimensionRow";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ModernInfinityDimensionsTab",
  components: {
    PrimaryButton,
    InfinityDimensionRow
  },
  data() {
    return {
      infinityPower: new Decimal(0),
      dimMultiplier: new Decimal(0),
      powerPerSecond: new Decimal(0),
      incomeType: "",
      isEC8Running: false,
      EC8PurchasesLeft: 0,
      isEC9Running: false,
      isEnslavedRunning: false,
      isAnyAutobuyerUnlocked: false,
      conversionRate: new Decimal(0),
      nextDimCapIncrease: new Decimal(0),
      tesseractCost: new Decimal(0),
      totalDimCap: new Decimal(0),
      canBuyTesseract: false,
      enslavedCompleted: false,
      boughtTesseracts: new Decimal(0),
      extraTesseracts: new Decimal(0),
      creditsClosed: false,
      showLockedDimCostNote: true,
      isEighthDimensionUnlocked: false,
      dominoesBought: false,
      dividendCount: 0,
      dominoesMultiplier: new Decimal(1),
      dominoesNextThreshold: new Decimal(0),
      dividendStepMultiplier: new Decimal(1),
      dividendThresholdMultiplier: new Decimal(1),
      id5Stability: new Decimal(1),
      id5StabilityRequirement: new Decimal(0),
      isID5StabilityLimited: false,
      hasID5StabilityReached: false,
    };
  },
  computed: {
    tesseractCountString() {
      const extra = this.extraTesseracts.gt(0) ? ` + ${format(this.extraTesseracts, 2, 2)}` : "";
      return `${formatInt(this.boughtTesseracts)}${extra}`;
    },
  },
  methods: {
    update() {
      this.isEighthDimensionUnlocked = InfinityDimension(8).isUnlocked;
      this.showLockedDimCostNote = InfinityDimension(5).isVisible && !this.isEighthDimensionUnlocked;
      this.isEC9Running = EternityChallenge(9).isRunning;
      this.infinityPower.copyFrom(Currency.infinityPower);
      this.conversionRate.copyFrom(InfinityDimensions.powerConversionRate);
      if (this.isEC9Running) {
        this.dimMultiplier.copyFrom(Decimal.pow(Decimal.max(this.infinityPower.log2(), 1), 4).max(1));
      } else {
        this.dimMultiplier.copyFrom(this.infinityPower.pow(this.conversionRate).max(1));
      }
      this.powerPerSecond.copyFrom(InfinityDimension(1).productionPerSecond);
      this.incomeType = EternityChallenge(7).isRunning ? "Seventh Dimensions" : "Infinity Power";
      this.isEC8Running = EternityChallenge(8).isRunning;
      if (this.isEC8Running) {
        this.EC8PurchasesLeft = player.eterc8ids;
      }
      this.isEnslavedRunning = Enslaved.isRunning;
      this.isAnyAutobuyerUnlocked = Autobuyer.infinityDimension(1).isUnlocked;
      this.nextDimCapIncrease.copyFrom(Tesseracts.nextTesseractIncrease);
      this.tesseractCost.copyFrom(Tesseracts.nextCost);
      this.totalDimCap.copyFrom(InfinityDimensions.totalDimCap);
      this.canBuyTesseract = Tesseracts.canBuyTesseract;
      this.enslavedCompleted = Enslaved.isCompleted;
      this.boughtTesseracts.copyFrom(Tesseracts.bought);
      this.extraTesseracts.copyFrom(Tesseracts.extra);
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.dominoesBought = DimensionalDominoes.isBought;
      this.dividendCount = DimensionalDominoes.dividendCount;
      this.dominoesMultiplier.copyFrom(DimensionalDominoes.multiplier);
      this.dominoesNextThreshold.copyFrom(DimensionalDominoes.nextThreshold);
      this.dividendStepMultiplier.copyFrom(DimensionalDominoes.stepMultiplier);
      this.dividendThresholdMultiplier.copyFrom(DimensionalDominoes.thresholdMultiplier);
      this.id5Stability.copyFrom(InfinityDimensions.id5Stability);
      this.id5StabilityRequirement.copyFrom(InfinityDimensions.id5StabilityRequirement);
      this.isID5StabilityLimited = InfinityDimensions.isID5StabilityLimited;
      this.hasID5StabilityReached = InfinityDimensions.hasID5StabilityReached;
    },
    maxAll() {
      InfinityDimensions.buyMax();
    },
    toggleAllAutobuyers() {
      toggleAllInfDims();
    },
    buyTesseract() {
      Tesseracts.buyTesseract();
    }
  }
};
</script>

<template>
  <div class="l-infinity-dim-tab">
    <div class="c-subtab-option-container">
      <PrimaryButton
        v-if="!isEC8Running"
        class="o-primary-btn--subtab-option"
        @click="maxAll"
      >
        Max all
      </PrimaryButton>
      <PrimaryButton
        v-if="isAnyAutobuyerUnlocked && !isEC8Running"
        class="o-primary-btn--subtab-option"
        @click="toggleAllAutobuyers"
      >
        Toggle all autobuyers
      </PrimaryButton>
    </div>
    <div>
      <p>
        You have
        <span class="c-infinity-dim-description__accent">{{ format(infinityPower, 2, 1) }}</span>
        Infinity Power,
        <br>
        <span v-if="!isEC9Running">
          increased by
          <span class="c-infinity-dim-description__accent">{{ formatPow(conversionRate, 2, 3) }}</span>
        </span>
        <span v-else>
          translated
        </span>
        to a
        <span class="c-infinity-dim-description__accent">{{ formatX(dimMultiplier, 2, 2) }}</span>
        multiplier on all
        <span v-if="!isEC9Running">Antimatter Dimensions.</span>
        <span v-else>Time Dimensions due to Eternity Challenge 9.</span>
      </p>
      <p v-if="dominoesBought">
        Dimensional Dividend has granted
        <span class="c-infinity-dim-description__accent">{{ formatInt(dividendCount) }}</span>
        {{ pluralize("Dividend", dividendCount) }}, multiplying Infinity Point gain on Big Crunch by
        <span class="c-infinity-dim-description__accent">{{ formatX(dominoesMultiplier, 2, 2) }}</span>
        <br>
        Next Dividend at
        <span class="c-infinity-dim-description__accent">{{ format(dominoesNextThreshold, 2, 1) }}</span>
        Infinity Power, increasing by
        <span class="c-infinity-dim-description__accent">{{ formatX(dividendThresholdMultiplier, 2, 2) }}</span>
        per Dividend gained.
        <br>
        Each Dividend after the first multiplies Infinity Point gain by
        {{ formatX(dividendStepMultiplier, 2, 2) }}.
      </p>
      <p v-if="isID5StabilityLimited">
        The 5th Infinity Dimension is unstable. Its production and Achievement 75 bonus operate at
        <span class="c-infinity-dim-description__accent">{{ formatPow(id5Stability, 2, 3) }}</span>.
        Sacrifice dimensions to stabilize it at {{ formatX(id5StabilityRequirement, 2, 2) }}.
      </p>
      <p v-else-if="hasID5StabilityReached">
        The 5th Infinity Dimension is stabilized for this Infinity.
      </p>
    </div>
    <div
      v-if="enslavedCompleted"
      class="l-infinity-dim-tab__enslaved-reward-container"
    >
      <button
        class="c-infinity-dim-tab__tesseract-button"
        :class="{
          'c-infinity-dim-tab__tesseract-button--disabled': !canBuyTesseract,
          'o-pelle-disabled-pointer': creditsClosed
        }"
        @click="buyTesseract"
      >
        <p>
          Buy a Tesseract ({{ tesseractCountString }})
        </p>
        <p>Increase dimension caps by {{ format(nextDimCapIncrease, 2) }}</p>
        <p><b>Costs: {{ format(tesseractCost) }} IP</b></p>
      </button>
    </div>
    <div v-if="isEnslavedRunning">
      All Infinity Dimensions are limited to a single purchase.
    </div>
    <div v-else>
      <span v-if="isEighthDimensionUnlocked">
        All Infinity Dimensions except for the 8th are limited to a maximum of {{ format(totalDimCap, 2) }}
        purchases each.
      </span>
      <span v-else>
        All Infinity Dimensions are limited to a maximum of {{ format(totalDimCap, 2) }} purchases each.
      </span>
    </div>
    <div>You are getting {{ format(powerPerSecond, 2, 0) }} {{ incomeType }} per second.</div>
    <b
      v-if="isEC8Running"
      class="l-infinity-dim-tab__ec8-purchases"
    >
      You have {{ quantifyInt("purchase", EC8PurchasesLeft) }} left within Eternity Challenge 8.
    </b>
    <div class="l-dimensions-container">
      <InfinityDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
      />
    </div>
    <div v-if="showLockedDimCostNote">
      Hold shift to see the Infinity Point cost for locked Infinity Dimensions.
    </div>
  </div>
</template>
