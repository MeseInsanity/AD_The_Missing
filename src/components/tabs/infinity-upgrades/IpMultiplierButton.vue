<script>
import InfinityUpgradeButton from "@/components/InfinityUpgradeButton";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "IpMultiplierButton",
  components: {
    PrimaryButton,
    PrimaryToggleButton,
    InfinityUpgradeButton
  },
  props: {
    buttonClass: {
      type: [Array, Object, String],
      default: undefined
    },
    breakInfinityStyle: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isAutobuyerActive: false,
      isAutoUnlocked: false,
      isCapped: false
    };
  },
  computed: {
    upgrade() {
      return InfinityUpgrade.ipMult;
    }
  },
  watch: {
    isAutobuyerActive(newValue) {
      Autobuyer.ipMult.isActive = newValue;
    }
  },
  methods: {
    update() {
      this.isAutoUnlocked = Autobuyer.ipMult.isUnlocked;
      this.isAutobuyerActive = Autobuyer.ipMult.isActive;
      this.isCapped = this.upgrade.isCapped;
    },
    buyMaxIPMult() {
      InfinityUpgrade.ipMult.buyMax();
    }
  }
};
</script>

<template>
  <div
    :class="[
      'l-spoon-btn-group',
      { 'c-break-infinity-ip-mult-group': breakInfinityStyle }
    ]"
  >
    <InfinityUpgradeButton
      :upgrade="upgrade"
      :class="['o-infinity-upgrade-btn--multiplier', buttonClass]"
    >
      <template v-if="isCapped">
        <br>
        <span>(Capped at {{ quantify("Infinity Point", upgrade.config.cap()) }})</span>
      </template>
    </InfinityUpgradeButton>
    <PrimaryButton
      class="l--spoon-btn-group__little-spoon o-primary-btn--small-spoon"
      @click="buyMaxIPMult()"
    >
      Max Infinity Point mult
    </PrimaryButton>
    <PrimaryToggleButton
      v-if="isAutoUnlocked"
      v-model="isAutobuyerActive"
      label="Autobuy IP mult"
      class="l--spoon-btn-group__little-spoon o-primary-btn--small-spoon"
    />
  </div>
</template>

<style scoped>

.c-break-infinity-ip-mult-group {
  width: 19rem;
}

.c-break-infinity-ip-mult-group ::v-deep .o-primary-btn {
  width: 100%;
  color: #d9f3ff;
  background-color: #0e2d43;
  border-color: #4ca9dc;
}

.c-break-infinity-ip-mult-group ::v-deep .o-primary-btn:hover {
  color: #fff;
  background-color: #1b577d;
  border-color: #78c9f2;
  box-shadow: inset 0 0 0.8rem #6ecbff55;
}

</style>
