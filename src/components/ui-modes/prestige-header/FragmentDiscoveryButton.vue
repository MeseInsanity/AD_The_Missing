<script>
import { Fragments } from "@/core/secret-formula/fragments";

export default {
  name: "FragmentDiscoveryButton",
  data() {
    return {
      isVisible: false,
      isDiscoveryPending: false,
      discoveryRequirement: new Decimal(),
    };
  },
  methods: {
    update() {
      this.isDiscoveryPending = Fragments.isDiscoveryPending;
      this.discoveryRequirement.copyFrom(Fragments.discoveryRequirement);
      this.isVisible = !Fragments.isUnlocked && (this.isDiscoveryPending || Replicanti.areUnlocked);
    },
    unlock() {
      if (this.isDiscoveryPending) Fragments.unlock();
    }
  }
};
</script>

<template>
  <button
    v-if="isVisible"
    :class="isDiscoveryPending ? 'o-fragment-discovery-button' : 'o-eternity-button o-eternity-button--unavailable'"
    class="o-prestige-button"
    @click="unlock"
  >
    <template v-if="isDiscoveryPending">
      Other times await...
      <br>
      yet something still remains in this Timeline.
    </template>
    <template v-else>
      Reach {{ format(discoveryRequirement, 2, 2) }}
      <br>
      Infinity Points
    </template>
  </button>
</template>
