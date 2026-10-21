<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";
import { Fragments } from "@/core/secret-formula/fragments";

export default {
  name: "CondenseModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      fragmentAmount: new Decimal(),
      condensateGain: new Decimal(),
      stabilizeDecayFill: new Decimal(),
      infinityPowerFill: new Decimal(),
      eternityFill: new Decimal(),
      preserveStabilizeDecay: false,
      preserveInfinityPower: false,
      preserveEternity: false,
    };
  },
  computed: {
    resetDrains() {
      const drains = [];
      if (!this.preserveStabilizeDecay && this.stabilizeDecayFill.gt(0)) drains.push("Stabilize Decay");
      if (!this.preserveInfinityPower && this.infinityPowerFill.gt(0)) drains.push("Power Through Time");
      if (!this.preserveEternity && this.eternityFill.gt(0)) drains.push("Power of Eternity");
      return drains;
    },
    drainLossText() {
      return this.resetDrains.length === 0
        ? "All deposited Drain progress will be preserved."
        : `${this.resetDrains.join(", ")} progress will be reset.`;
    }
  },
  methods: {
    update() {
      this.fragmentAmount.copyFrom(Fragments.amount);
      this.condensateGain.copyFrom(Fragments.condensateGain);
      this.stabilizeDecayFill.copyFrom(Fragments.stabilizeDecayFill);
      this.infinityPowerFill.copyFrom(Fragments.infinityPowerDrainFill);
      this.eternityFill.copyFrom(Fragments.eternityDrainFill);
      this.preserveStabilizeDecay = Fragments.hasCondensateMilestone("preserveStabilizeDecay");
      this.preserveInfinityPower = Fragments.hasCondensateMilestone("preservePowerThroughTime");
      this.preserveEternity = Fragments.hasCondensateMilestone("preserveThirdDrain");
      if (!Fragments.canCondense) this.emitClose();
    },
    confirm() {
      Fragments.condense();
    }
  }
};
</script>

<template>
  <ModalWrapperChoice
    option="condensate"
    @confirm="confirm"
  >
    <template #header>
      Condense Fragments?
    </template>
    <div class="c-modal-message__text">
      Gain {{ format(condensateGain, 2, 2) }} Condensate.
    </div>
    <br>
    <div class="c-modal-message__text">
      This resets {{ format(fragmentAmount, 2, 2) }} current Fragments, total Fragments, and best Fragment gain.
      <br>
      {{ drainLossText }}
    </div>
  </ModalWrapperChoice>
</template>
