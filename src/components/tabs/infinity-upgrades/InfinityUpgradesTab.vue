<script>
import InfinityUpgradeButton from "@/components/InfinityUpgradeButton";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "InfinityUpgradesTab",
  components: {
    PrimaryButton,
    InfinityUpgradeButton
  },
  data() {
    return {
      isUseless: false,
      chargeUnlocked: false,
      totalCharges: 0,
      chargesUsed: 0,
      disCharge: false
    };
  },
  computed: {
    grid() {
      return [
        {
          name: "Past Records",
          upgrades: [
            InfinityUpgrade.totalTimeMult,
            InfinityUpgrade.dim18mult,
            InfinityUpgrade.bestInfinityTimeDimensions,
            InfinityUpgrade.unspentIPMult
          ]
        },
        {
          name: "Current Run",
          upgrades: [
            InfinityUpgrade.thisInfinityTimeMult,
            InfinityUpgrade.currentInfinityGalaxiesSacrifice,
            InfinityUpgrade.currentInfinitySacrificeTickspeed,
            InfinityUpgrade.currentInfinityBoostsBuy10
          ]
        },
        {
          name: "Core Mechanics",
          upgrades: [
            InfinityUpgrade.buy10Mult,
            InfinityUpgrade.dimboostMult,
            InfinityUpgrade.resetBoost,
            InfinityUpgrade.galaxyBoost
          ]
        },
        {
          name: "Starting Momentum",
          upgrades: [
            InfinityUpgrade.skipReset1,
            InfinityUpgrade.skipReset2,
            InfinityUpgrade.skipReset3,
            InfinityUpgrade.skipResetGalaxy
          ]
        }
      ];
    },
    allColumnUpgrades() {
      return this.grid.flatMap(row => row.upgrades);
    },
    disChargeClassObject() {
      return {
        "o-primary-btn--subtab-option": true,
        "o-primary-btn--charged-respec-active": this.disCharge
      };
    }
  },
  watch: {
    disCharge(newValue) {
      player.celestials.ra.disCharge = newValue;
    }
  },
  methods: {
    update() {
      this.isUseless = Pelle.isDoomed;
      this.chargeUnlocked = Ra.unlocks.chargedInfinityUpgrades.canBeApplied && !Pelle.isDoomed;
      this.totalCharges = Ra.totalCharges;
      this.chargesUsed = Ra.totalCharges - Ra.chargesLeft;
      this.disCharge = player.celestials.ra.disCharge;
    },
    btnClassObject(upgrade) {
      return {
        "l-infinity-upgrade-grid__cell": true,
        "c-infinity-upgrade-grid__cell--galaxy": upgrade === InfinityUpgrade.galaxyBoost
      };
    },
  }
};
</script>

<template>
  <div class="l-infinity-upgrades-tab">
    <div
      v-if="chargeUnlocked"
      class="c-subtab-option-container"
    >
      <PrimaryButton
        :class="disChargeClassObject"
        @click="disCharge = !disCharge"
      >
        Respec Charged Infinity Upgrades on next Reality
      </PrimaryButton>
    </div>
    <div v-if="chargeUnlocked">
      You have charged {{ formatInt(chargesUsed) }}/{{ formatInt(totalCharges) }} Infinity Upgrades.
      Charged Infinity Upgrades have their effect altered.
      <br>
      Hold shift to show Charged Infinity Upgrades. You can freely respec your choices on Reality.
    </div>
    <div v-if="isUseless">
      You cannot Charge Infinity Upgrades while Doomed.
    </div>
    <br>
    Within each row, the upgrades must be purchased from left to right.
    <br>
    <div class="l-infinity-upgrades-tab__grid">
      <div
        v-for="row in grid"
        :key="row.name"
        class="c-infinity-upgrade-grid__row"
      >
        <div
          class="c-infinity-upgrade-grid__row-label"
        >
          {{ row.name }}
        </div>
        <div class="l-infinity-upgrade-grid__row-upgrades">
          <div
            v-for="(upgrade, index) in row.upgrades"
            :key="upgrade.id"
            class="l-infinity-upgrade-grid__row-item"
          >
            <InfinityUpgradeButton
              :upgrade="upgrade"
              :class="btnClassObject(upgrade)"
            />
            <span
              v-if="index < row.upgrades.length - 1"
              class="c-infinity-upgrade-grid__arrow"
            >
              &#9654;
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-infinity-upgrade-grid__row {
  display: flex;
  position: relative;
  justify-content: center;
  margin: 1.5rem 0 0.8rem;
  padding: 1.1rem 0.8rem 0.7rem;
  border: var(--var-border-width, 0.2rem) solid var(--color-infinity);
  border-radius: var(--var-border-radius, 0.3rem);
}

.c-infinity-upgrade-grid__row-label {
  position: absolute;
  top: -0.8rem;
  left: 1rem;
  padding: 0 0.5rem;
  background: var(--color-base, #000);
  color: var(--color-infinity);
  font-weight: bold;
}

.l-infinity-upgrade-grid__row-upgrades,
.l-infinity-upgrade-grid__row-item {
  display: flex;
  align-items: center;
}

.c-infinity-upgrade-grid__arrow {
  color: var(--color-infinity);
  font-size: 2rem;
}

.c-infinity-upgrade-grid__cell--galaxy {
  border-color: #a35ec9;
  box-shadow: inset 0 0 1rem #a35ec955;
  color: #c77dea;
}

.l-infinity-upgrades-bottom-row .l-infinity-upgrade-grid__cell,
.l-infinity-upgrades-bottom-row .l-infinity-upgrades-tab__mult-btn {
  margin: 0.5rem 1.1rem;
}
</style>
