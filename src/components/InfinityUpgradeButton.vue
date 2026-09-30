<script>
import CostDisplay from "@/components/CostDisplay";
import DescriptionDisplay from "@/components/DescriptionDisplay";
import EffectDisplay from "@/components/EffectDisplay";
import HintText from "@/components/HintText";
import wordShift from "@/core/word-shift";

export default {
  name: "InfinityUpgradeButton",
  components: {
    DescriptionDisplay,
    EffectDisplay,
    HintText,
    CostDisplay,
  },
  props: {
    upgrade: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showChallengeTime: false,
      challengeTimeString: "",
      isUseless: false,
      canBeBought: false,
      chargePossible: false,
      canBeCharged: false,
      isBought: false,
      isCharged: false,
      isDisabled: false,
      showingCharged: false,
      hasTS31: false,
      ts31Effect: new Decimal(0),
      displayName: "",
      isForbiddenGalaxyName: false
    };
  },
  computed: {
    isBasedOnInfinities() {
      return /(18|27|36|45)Mult/u.test(this.upgrade.id) || this.upgrade.id === "infinitiedMult";
    },
    shiftDown() {
      return ui.view.shiftDown;
    },
    showChargedEffect() {
      return this.chargePossible && (this.isCharged || this.showingCharged || this.shiftDown);
    },
    config() {
      const config = this.upgrade.config;
      return this.showChargedEffect
        ? config.charged
        : config;
    },
    classObject() {
      return {
        "o-infinity-upgrade-btn": true,
        "o-infinity-upgrade-btn--bought": !this.isUseless && this.isBought,
        "o-infinity-upgrade-btn--available": !this.isUseless && !this.isBought && this.canBeBought,
        "o-infinity-upgrade-btn--unavailable": !this.isUseless && !this.isBought && !this.canBeBought,
        "o-infinity-upgrade-btn--useless": this.isUseless,
        "o-pelle-disabled": this.isUseless,
        "o-infinity-upgrade-btn--chargeable": !this.isCharged && this.chargePossible &&
          (this.showingCharged || this.shiftDown),
        "o-infinity-upgrade-btn--charged": this.isCharged,
        "o-pelle-disabled-pointer": this.isUseless
      };
    },
    isImprovedByTS31() {
      return this.hasTS31 && this.isBasedOnInfinities && !this.showChargedEffect;
    }
  },
  methods: {
    update() {
      // Note that this component is used by both infinity upgrades and break infinity upgrades
      // (putting this comment here rather than at the top of the component since this function
      // seems more likely to be read).
      const upgrade = this.upgrade;
      this.isBought = upgrade.isBought || upgrade.isCapped;
      this.chargePossible = Ra.unlocks.chargedInfinityUpgrades.canBeApplied &&
        upgrade.hasChargeEffect && !Pelle.isDoomed;
      this.canBeBought = upgrade.canBeBought;
      this.canBeCharged = upgrade.canCharge;
      this.isCharged = upgrade.isCharged;
      this.isForbiddenGalaxyName = upgrade === InfinityUpgrade.galaxyBoost || upgrade.config.scrambleName;
      if (!upgrade.isBought && upgrade.config.nameCycle) {
        this.displayName = wordShift.wordCycle(upgrade.config.nameCycle);
      } else {
        const shouldScrambleName = !upgrade.isBought && this.isForbiddenGalaxyName && Date.now() % 7000 < 180;
        this.displayName = shouldScrambleName
          ? wordShift.randomCrossWords(upgrade.config.name)
          : upgrade.config.name;
      }
      // A bit hacky, but the offline passive IP upgrade (the one that doesn't work online)
      // should hide its effect value if offline progress is disabled, in order to be
      // consistent with the other offline progress upgrades which hide as well.
      // Also, the IP upgrade that works both online and offline should not
      // show 0 if its value is 0. This is a bit inconvenient because sometimes,
      // like after eternity, it can be bought but have value 0, but not showing the effect
      // in this case doesn't feel too bad. Other upgrades, including the cost scaling
      // rebuyables, should never hide their effect.
      this.isDisabled = upgrade.config.isDisabled && upgrade.config.isDisabled(upgrade.config.effect());
      this.isUseless = Pelle.uselessInfinityUpgrades.includes(upgrade.id) && Pelle.isDoomed;
      this.hasTS31 = TimeStudy(31).canBeApplied;
      if (!this.isDisabled && this.isImprovedByTS31) this.ts31Effect = Decimal.pow(upgrade.config.effect(), 4);
      if (upgrade.id !== "challengeMult") return;
      this.showChallengeTime = upgrade.effectValue !== upgrade.cap &&
        player.challenge.normal.bestTimes.sum().lt(Number.MAX_VALUE);
      this.challengeTimeString = `(Total NC time: ${timeDisplayShort(GameCache.challengeTimeSum.value)})`;
    }
  }
};
</script>

<template>
  <button
    :class="classObject"
    @mouseenter="showingCharged = canBeCharged"
    @mouseleave="showingCharged = false"
    @click="upgrade.purchase()"
  >
    <HintText
      v-if="displayName"
      type="realityUpgrades"
      :class="[
        'l-hint-text--reality-upgrade',
        'c-hint-text--reality-upgrade',
        { 'c-infinity-upgrade-btn__name--forbidden-galaxy': isForbiddenGalaxyName }
      ]"
    >
      {{ displayName }}
    </HintText>
    <span :class="{ 'o-pelle-disabled': isUseless }">
      <DescriptionDisplay
        :config="config"
      />
      <span v-if="showChallengeTime">
        <br>
        {{ challengeTimeString }}
      </span>
      <EffectDisplay
        v-if="!isDisabled && !config.hideEffect"
        br
        :config="config"
      />
      <template v-if="!isDisabled && isImprovedByTS31">
        <br>
        After TS31: {{ formatX(ts31Effect, 2, 2) }}
      </template>
    </span>
    <span
      v-if="!isBought && config.isNYI"
      class="o-infinity-upgrade-btn__nyi"
    >
      <br>NYI
    </span>
    <CostDisplay
      v-if="!isBought && (!config.isNYI || config.showNYICost)"
      br
      :config="config"
      name="Infinity Point"
    />
    <slot />
  </button>
</template>

<style scoped>

.o-infinity-upgrade-btn {
  position: relative;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard {
  color: #d9f3ff;
  background-color: #0e2d43;
  border-color: #4ca9dc;
  box-shadow: inset 0 0 0.8rem #2d98d433;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard.o-infinity-upgrade-btn--available {
  color: #f2fbff;
  background-color: #15527a;
  border-color: #6ecbff;
  box-shadow: inset 0 0 1rem #61c6ff66, 0 0 0.35rem #4ca9dc44;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard.o-infinity-upgrade-btn--available:hover {
  color: #fff;
  background-color: #237eae;
  box-shadow: inset 0 0 1.2rem #8cdbff88, 0 0 0.6rem #62c5ff77;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard.o-infinity-upgrade-btn--unavailable {
  color: #7696a7;
  background-color: #071724;
  border-color: #1c4561;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard.o-infinity-upgrade-btn--unavailable:hover {
  color: #d9f3ff;
  background-color: #123c5a;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard.o-infinity-upgrade-btn--bought {
  color: #f0fbff;
  background-color: #17638d;
  border-color: #78c9f2;
  box-shadow: inset 0 0 1rem #76cfff55;
}

.o-infinity-upgrade-btn.c-break-infinity-upgrade-grid__cell--standard.o-infinity-upgrade-btn--bought:hover {
  background-color: #2079a8;
}

.c-infinity-upgrade-btn__name--forbidden-galaxy {
  color: #ff6b6b;
  text-shadow: 0 0 0.4rem #ff3838aa;
}

.o-infinity-upgrade-btn__nyi {
  color: #ff8080;
}

</style>
