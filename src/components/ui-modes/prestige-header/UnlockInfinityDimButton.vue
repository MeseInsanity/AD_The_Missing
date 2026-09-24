<script>
export default {
  name: "UnlockInfinityDimButton",
  data() {
    return {
      isVisible: false,
      canUnlock: false,
      hasIPUnlock: true,
      amRequirement: new Decimal(0),
      ipRequirement: 0,
    };
  },
  computed: {
    text() {
      const dimensionText = `a new ${this.hasIPUnlock ? "type of Dimension" : "Infinity Dimension"}.`;
      if (this.canUnlock) {
        return `Unlock ${dimensionText}`;
      }
      const amDisplay = format(this.amRequirement);
      const ipDisplay = format(this.ipRequirement);
      if (this.hasIPUnlock) {
        return `Reach ${ipDisplay} Infinity Points and ${amDisplay} antimatter to unlock ${dimensionText}`;
      }
      return `Reach ${amDisplay} antimatter to unlock ${dimensionText}`;
    },
    buttonClassObject() {
      return {
        "o-prestige-button": true,
        "o-infinity-button": true,
        "o-infinity-button--unavailable": !this.canUnlock
      };
    },
  },
  methods: {
    update() {
      const canShowUnlockButton = player.break && !InfinityDimension(8).isUnlocked && !Player.canEternity &&
        !EternityMilestone.autoUnlockID.isReached;
      if (!canShowUnlockButton) {
        this.isVisible = false;
        return;
      }
      const nextDimension = InfinityDimensions.next();
      this.isVisible = nextDimension.isVisible;
      if (!this.isVisible) return;
      this.canUnlock = nextDimension.canUnlock;
      this.hasIPUnlock = nextDimension.hasIPUnlock;
      this.amRequirement = nextDimension.amRequirement;
      this.ipRequirement = nextDimension.ipRequirement;
    },
    tryUnlockNextInfinityDimension() {
      InfinityDimensions.unlockNext();
    }
  },
};
</script>

<template>
  <button
    v-if="isVisible"
    :class="buttonClassObject"
    @click="tryUnlockNextInfinityDimension"
  >
    {{ text }}
  </button>
</template>

<style scoped>

</style>
