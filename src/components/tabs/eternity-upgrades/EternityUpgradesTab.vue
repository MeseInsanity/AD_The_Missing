<script>
import EPMultiplierButton from "./EPMultiplierButton";
import EternityUpgradeButton from "./EternityUpgradeButton";

export default {
  name: "EternityUpgradesTab",
  components: {
    EternityUpgradeButton,
    EPMultiplierButton
  },
  computed: {
    grid() {
      return [
        {
          name: "Antimatter Dimensions",
          upgrades: [
            EternityUpgrade.costScaling,
            EternityUpgrade.theoremSacrifice,
            EternityUpgrade.achievementDimBoost,
          ]
        },
        {
          name: "Infinity Dimensions",
          upgrades: [
            EternityUpgrade.idMultEP,
            EternityUpgrade.idMultEternities,
            EternityUpgrade.idMultICRecords,
          ]
        },
        {
          name: "Time Dimensions",
          upgrades: [
            EternityUpgrade.tdMultAchs,
            EternityUpgrade.tdMultTheorems,
            EternityUpgrade.tdMultRealTime,
          ]
        },
        {
          name: "Infinity Mechanics",
          upgrades: [
            EternityUpgrade.currentRunFormula,
            EternityUpgrade.breakUpgradeFormula,
            EternityUpgrade.replicantiChance,
          ]
        },
      ];
    },
    costIncreases: () => EternityUpgrade.epMult.costIncreaseThresholds.map(x => new Decimal(x))
  },
  methods: {
    formatPostBreak
  }
};
</script>

<template>
  <div class="l-eternity-upgrades-tab">
    <div
      v-for="row in grid"
      :key="row.name"
      class="c-eternity-upgrade-grid__row"
    >
      <div class="c-eternity-upgrade-grid__row-label">
        {{ row.name }}
      </div>
      <div class="l-eternity-upgrade-grid__row-upgrades">
        <EternityUpgradeButton
          v-for="upgrade in row.upgrades"
          :key="upgrade.id"
          :upgrade="upgrade"
          class="l-eternity-upgrade-grid__cell"
        />
      </div>
    </div>
    <EPMultiplierButton />
    <div>
      The cost for the {{ formatX(5) }} multiplier jumps at {{ format(costIncreases[0]) }},
      {{ formatPostBreak(costIncreases[1], 2) }}, and {{ formatPostBreak(costIncreases[2]) }} Eternity Points.
      <br>
      The cost increases faster after 1e4000 EP, and super-exponentially after 1e6000 EP.
    </div>
  </div>
</template>

<style scoped>
.l-eternity-upgrades-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1rem;
}

.c-eternity-upgrade-grid__row {
  display: flex;
  position: relative;
  justify-content: center;
  width: fit-content;
  margin: 1.5rem 0 0.8rem;
  padding: 2rem 0.8rem 0.7rem;
  border: var(--var-border-width, 0.2rem) solid var(--color-eternity);
  border-radius: var(--var-border-radius, 0.3rem);
}

.c-eternity-upgrade-grid__row-label {
  position: absolute;
  top: -0.8rem;
  left: 1rem;
  padding: 0 0.5rem;
  background: var(--color-base, #000);
  color: var(--color-eternity);
  font-weight: bold;
}

.l-eternity-upgrade-grid__row-upgrades {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.l-eternity-upgrades-grid__cell {
  margin: 0.5rem 0;
}
</style>
