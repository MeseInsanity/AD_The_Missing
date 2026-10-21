<script>
import { Fragments } from "@/core/secret-formula/fragments";

export default {
  name: "FragmentDiscoveryButton",
  data() {
    return {
      isVisible: false,
    };
  },
  methods: {
    update() {
      this.isVisible = Fragments.isDiscoveryPending && !Fragments.isUnlocked;
    },
    unlock() {
      Fragments.unlock();
    }
  }
};
</script>

<template>
  <button
    v-if="isVisible"
    class="o-prestige-button o-fragment-discovery-button"
    @click="unlock"
  >
    Other times await...
    <br>
    yet something still remains in this Timeline.
  </button>
</template>
