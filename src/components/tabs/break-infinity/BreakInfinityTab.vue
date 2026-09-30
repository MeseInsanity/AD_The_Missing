<script>
import BreakInfinityButton from "./BreakInfinityButton";
import InfinityUpgradeButton from "@/components/InfinityUpgradeButton";
import IpMultiplierButton from "../infinity-upgrades/IpMultiplierButton";

export default {
  name: "BreakInfinityTab",
  components: {
    BreakInfinityButton,
    InfinityUpgradeButton,
    IpMultiplierButton
  },
  data() {
    return {
      isUnlocked: false,
      effectiveUnlockInterval: 0.1,
      hasAutobuyerSpeedBonus: false
    };
  },
  computed: {
    idRate() {
      return BreakInfinityUpgrade.idRate;
    },
    grid() {
      return [
        {
          name: "Repeatable Upgrades",
          upgrades: [
            BreakInfinityUpgrade.tickspeedCostMult,
            BreakInfinityUpgrade.dimCostMult,
            BreakInfinityUpgrade.ipGen
          ]
        },
        {
          name: "Antimatter Records",
          upgrades: [
            BreakInfinityUpgrade.totalAMMult,
            BreakInfinityUpgrade.currentAMMult,
            BreakInfinityUpgrade.averageAMMult,
            BreakInfinityUpgrade.bestAMTickspeed,
            BreakInfinityUpgrade.previousAMSacrifice
          ]
        },
        {
          name: "Infinity Dimension Enhancements",
          upgrades: [
            BreakInfinityUpgrade.achievementMult,
            BreakInfinityUpgrade.infinitiedMult,
            BreakInfinityUpgrade.slowestChallengeMult,
            BreakInfinityUpgrade.infinityTimeIDMult,
            BreakInfinityUpgrade.bestIPminAmp
          ]
        },
        {
          name: "Break Mechanics",
          upgrades: [
            BreakInfinityUpgrade.infinityIPMult,
            BreakInfinityUpgrade.achievementFormula,
            BreakInfinityUpgrade.galaxyBoost,
            BreakInfinityUpgrade.idPurchaseCascade,
            BreakInfinityUpgrade.galaxyFormula
          ]
        },
        {
          name: "Automation",
          upgrades: [
            BreakInfinityUpgrade.infinitiedGen,
            BreakInfinityUpgrade.autobuyMaxDimboosts,
            BreakInfinityUpgrade.instantAutobuyers,
            BreakInfinityUpgrade.sacrificeAutobuyer,
            BreakInfinityUpgrade.galaxyBulk
          ]
        }
      ];
    }
  },
  methods: {
    update() {
      this.isUnlocked = Autobuyer.bigCrunch.hasMaxedInterval;
      this.hasAutobuyerSpeedBonus = Achievement(35).isUnlocked;
      this.effectiveUnlockInterval = 0.1 / Achievement(35).effectOrDefault(1);
    },
    btnClassObject(column, upgrade = undefined) {
      const isGalaxyUpgrade = upgrade === BreakInfinityUpgrade.galaxyBoost ||
        upgrade === BreakInfinityUpgrade.galaxyFormula;
      return {
        "l-infinity-upgrade-grid__cell": true,
        "o-infinity-upgrade-btn--multiplier": column === 0,
        "c-break-infinity-upgrade-grid__cell--standard": !isGalaxyUpgrade,
        "c-break-infinity-upgrade-grid__cell--galaxy": isGalaxyUpgrade,
        "c-break-infinity-upgrade-grid__cell--galaxy-formula": upgrade === BreakInfinityUpgrade.galaxyFormula
      };
    },
    ipMultiplierClassObject() {
      return {
        "c-break-infinity-upgrade-grid__cell--standard": true
      };
    },
    timeDisplayShort(time) {
      return timeDisplayShort(time);
    }
  }
};
</script>

<template>
  <div class="l-break-infinity-tab">
    <div v-if="!isUnlocked">
      Reduce the unmodified interval of Automatic Big Crunch Autobuyer to
      {{ format(0.1, 1, 1) }} seconds to unlock Break Infinity.
      <span v-if="hasAutobuyerSpeedBonus">
        ({{ format(effectiveUnlockInterval, 2, 2) }} seconds with Achievement 3-5.)
      </span>
    </div>
    <BreakInfinityButton class="l-break-infinity-tab__break-btn" />
    <div
      v-if="isUnlocked"
      class="l-break-infinity-upgrade-grid l-break-infinity-tab__grid"
    >
      <div
        v-for="(row, columnId) in grid"
        :key="row.name"
        class="c-break-infinity-upgrade-grid__row"
      >
        <div class="c-break-infinity-upgrade-grid__row-label">
          {{ row.name }}
        </div>
        <div class="l-break-infinity-upgrade-grid__row-upgrades">
          <IpMultiplierButton
            v-if="columnId === 0"
            class="l-infinity-upgrade-grid__cell"
            :button-class="ipMultiplierClassObject()"
            break-infinity-style
          />
          <InfinityUpgradeButton
            v-if="columnId === 0"
            :upgrade="idRate"
            :class="btnClassObject(columnId)"
          />
          <InfinityUpgradeButton
            v-for="upgrade in row.upgrades"
            :key="upgrade.id"
            :upgrade="upgrade"
            :class="btnClassObject(columnId, upgrade)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.c-break-infinity-upgrade-grid__row {
  display: flex;
  position: relative;
  justify-content: center;
  margin: 1.5rem 0 0.8rem;
  padding: 1.5rem 0.8rem 0.7rem;
  border: var(--var-border-width, 0.2rem) solid #4ca9dc;
  border-radius: var(--var-border-radius, 0.3rem);
}

.c-break-infinity-upgrade-grid__row-label {
  position: absolute;
  top: -0.8rem;
  left: 1rem;
  padding: 0 0.5rem;
  color: #84cfff;
  background: var(--color-base, #000);
  font-weight: bold;
}

.l-break-infinity-upgrade-grid__row-upgrades {
  display: flex;
  align-items: center;
}

.c-break-infinity-upgrade-grid__cell--galaxy {
  border-color: #ff5252;
  background-color: #26070d;
  box-shadow: inset 0 0 1rem #ff525266;
}

.c-break-infinity-upgrade-grid__cell--galaxy:not(.o-infinity-upgrade-btn--bought):hover {
  background-color: #5c0b17;
  box-shadow: inset 0 0 1.2rem #ff525299, 0 0 0.6rem #ff525244;
}

.c-break-infinity-upgrade-grid__cell--galaxy.o-infinity-upgrade-btn--bought {
  color: #fff5e6;
  background-color: #9b1c1c;
}

.c-break-infinity-upgrade-grid__cell--galaxy-formula {
  border-color: #d10062;
  background: radial-gradient(ellipse at center, #3d001e 0%, #170008 72%);
  box-shadow: inset 0 0 1.5rem #ff005966, 0 0 0.45rem #9d003f66;
  animation: galaxy-formula-pulse 4s ease-in-out infinite;
}

.c-break-infinity-upgrade-grid__cell--galaxy-formula:not(.o-infinity-upgrade-btn--bought):hover {
  background: radial-gradient(ellipse at center, #71002f 0%, #28000f 72%);
  box-shadow: inset 0 0 1.8rem #ff0059aa, 0 0 0.8rem #c90055aa;
}

.c-break-infinity-upgrade-grid__cell--galaxy-formula.o-infinity-upgrade-btn--bought {
  color: #fff0f5;
  background: radial-gradient(ellipse at center, #85002f 0%, #440016 72%);
  box-shadow: inset 0 0 1.5rem #ff3a78aa, 0 0 0.5rem #c90055aa;
}

@keyframes galaxy-formula-pulse {
  0%, 100% {
    border-color: #8b003f;
    box-shadow: inset 0 0 1.2rem #ff005944, 0 0 0.25rem #9d003f44;
  }

  50% {
    border-color: #ef1b70;
    box-shadow: inset 0 0 1.8rem #ff005988, 0 0 0.65rem #d4005f77;
  }
}

</style>
