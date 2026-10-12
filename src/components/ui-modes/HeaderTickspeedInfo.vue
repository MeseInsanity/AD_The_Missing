<script>
import GameSpeedDisplay from "@/components/GameSpeedDisplay";

export default {
  name: "HeaderTickspeedInfo",
  components: {
    GameSpeedDisplay
  },
  data() {
    return {
      mult: new Decimal(0),
      tickspeed: new Decimal(0),
      galaxyCount: new Decimal(),
      purchasedTickspeed: new Decimal(0),
      freeTickspeed: new Decimal(),
    };
  },
  computed: {
    tickspeedDisplay() {
      return `Total Tickspeed: ${format(this.tickspeed, 2, 3)} / sec`;
    },
    perUpgrade() {
      return `ADs produce ${formatX(this.mult.reciprocal(), 2, 3)} faster per Tickspeed upgrade`;
    },
  },
  methods: {
    update() {
      this.mult.copyFrom(Tickspeed.multiplier);
      this.tickspeed.copyFrom(Tickspeed.perSecond);
      this.galaxyCount.copyFrom(player.galaxies);
      this.purchasedTickspeed.copyFrom(player.totalTickBought);
      this.freeTickspeed.copyFrom(player.totalTickGained.plusEffectOf(BreakInfinityUpgrade.bestAMTickspeed));
    },
  },
};
</script>

<template>
  <div>
    <br>
    {{ perUpgrade }}
    <br>
    {{ tickspeedDisplay }}
    <br>
    <GameSpeedDisplay />
  </div>
</template>

<style scoped>

</style>
