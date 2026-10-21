<script>
import CostDisplay from "@/components/CostDisplay";
import DescriptionDisplay from "@/components/DescriptionDisplay";
import EffectDisplay from "@/components/EffectDisplay";
import HintText from "@/components/HintText";

export default {
  name: "EternityUpgradeButton",
  components: {
    DescriptionDisplay,
    EffectDisplay,
    HintText,
    CostDisplay
  },
  props: {
    upgrade: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isBought: false,
      isAffordable: false
    };
  },
  computed: {
    classObject() {
      return {
        "o-eternity-upgrade": true,
        "o-eternity-upgrade--bought": this.isBought,
        "o-eternity-upgrade--available": !this.isBought && this.isAffordable,
        "o-eternity-upgrade--unavailable": !this.isBought && !this.isAffordable
      };
    },
    hasEU2() {
      return Perk.autounlockEU2.canBeApplied;
    }
  },
  methods: {
    update() {
      const upgrade = this.upgrade;
      this.isBought = upgrade.isBought;
      this.isAffordable = upgrade.isAffordable;
    }
  }
};
</script>

<template>
  <button
    :class="classObject"
    @click="upgrade.purchase()"
  >
    <HintText
      v-if="upgrade.config.name"
      type="realityUpgrades"
      :class="[
        'l-hint-text--reality-upgrade',
        'c-hint-text--reality-upgrade'
      ]"
    >
      {{ upgrade.config.name }}
    </HintText>
    <DescriptionDisplay :config="upgrade.config" />
    <EffectDisplay
      v-if="!upgrade.config.hideEffect"
      br
      :config="upgrade.config"
    />
    <div v-if="!isBought && hasEU2">
      Auto: {{ format(upgrade.config.cost / 1e10) }} Eternity Points
    </div>
    <CostDisplay
      v-else-if="!isBought"
      br
      :config="upgrade.config"
      name="Eternity Point"
    />
  </button>
</template>

<style scoped>
.o-eternity-upgrade {
  position: relative;
}
</style>
