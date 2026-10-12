<script>
import AntimatterDimensionProgressBar from "./AntimatterDimensionProgressBar";
import AntimatterDimensionRow from "./ClassicAntimatterDimensionRow";
import AntimatterDimensionsTabHeader from "./ClassicAntimatterDimensionsTabHeader";
import AntimatterGalaxyRow from "./ClassicAntimatterGalaxyRow";
import DimensionBoostRow from "./ClassicDimensionBoostRow";
import PrimaryButton from "@/components/PrimaryButton";
import TickspeedRow from "./TickspeedRow";

export default {
  name: "ClassicAntimatterDimensionsTab",
  components: {
    PrimaryButton,
    AntimatterDimensionRow,
    AntimatterDimensionsTabHeader,
    AntimatterGalaxyRow,
    DimensionBoostRow,
    AntimatterDimensionProgressBar,
    TickspeedRow,
  },
  data() {
    return {
      hasDimensionBoosts: false,
      isQuickResetAvailable: false,
      isSacrificeUnlocked: false,
      buy10Mult: new Decimal(0),
      currentSacrifice: new Decimal(0),
      hasRealityButton: false,
      multiplierText: "",
      id5Stability: new Decimal(1),
      id5StabilityRequirement: new Decimal(0),
      isID5StabilityLimited: false,
    };
  },
  methods: {
    update() {
      this.hasDimensionBoosts = player.dimensionBoosts.gt(0);
      this.isQuickResetAvailable =
        (Player.isInAntimatterChallenge && Player.antimatterChallenge.isQuickResettable) ||
        (NormalChallenge(5).isRunning && this.hasDimensionBoosts);
      this.isSacrificeUnlocked = Sacrifice.isVisible;
      this.buy10Mult.copyFrom(AntimatterDimensions.buyTenMultiplier);
      this.currentSacrifice.copyFrom(Sacrifice.totalBoost);
      this.hasRealityButton = PlayerProgress.realityUnlocked() || TimeStudy.reality.isBought;
      this.id5Stability.copyFrom(InfinityDimensions.id5Stability);
      this.id5StabilityRequirement.copyFrom(InfinityDimensions.id5StabilityRequirement);
      this.isID5StabilityLimited = InfinityDimensions.isID5StabilityLimited;
      const sacText = this.isSacrificeUnlocked
        ? ` | Dimensional Sacrifice multiplier: ${formatX(this.currentSacrifice, 2, 2)}`
        : "";
      this.multiplierText = `Buy 10 Dimension purchase multiplier: ${formatX(this.buy10Mult, 2, 2)}${sacText}`;
    },
    quickReset() {
      softReset(-1, true, true);
    }
  }
};
</script>

<template>
  <div class="l-old-ui-antimatter-dim-tab">
    <AntimatterDimensionsTabHeader />
    {{ multiplierText }}
    <div v-if="isID5StabilityLimited">
      The 5th Infinity Dimension remains unstable. Its production and Achievement 75 bonus operate at
      {{ formatPow(id5Stability, 2, 3) }}; Sacrifice dimensions to stabilize it at
      {{ formatX(id5StabilityRequirement, 2, 2) }}.
    </div>
    <TickspeedRow />
    <div class="l-dimensions-container">
      <AntimatterDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
      />
      <DimensionBoostRow />
      <AntimatterGalaxyRow />
    </div>
    <PrimaryButton
      v-if="isQuickResetAvailable"
      class="o-primary-btn--quick-reset"
      @click="quickReset"
    >
      Perform a Dimension Boost reset
      <span v-if="hasDimensionBoosts"> but lose a Dimension Boost</span>
      <span v-else> for no gain</span>
    </PrimaryButton>
    <div class="l-flex" />
    <AntimatterDimensionProgressBar class="l-antimatter-dim-tab__progress_bar" />
  </div>
</template>

<style scoped>
.l-flex {
  flex: 1 0;
}
</style>
