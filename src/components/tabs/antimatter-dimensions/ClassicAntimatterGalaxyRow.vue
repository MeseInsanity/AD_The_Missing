<script>
import PrimaryButton from "@/components/PrimaryButton";
import { ic9Annihilate } from "@/core/galaxy";
import { IC9Annihilation } from "@/core/infinity-challenges";

export default {
  name: "ClassicAntimatterGalaxyRow",
  components: {
    PrimaryButton
  },
  data() {
    return {
      type: GALAXY_TYPE.NORMAL,
      galaxies: {
        normal: new Decimal(),
        replicanti: new Decimal(),
        dilation: new Decimal()
      },
      isIC9Running: false,
      ic9AnnihilateAvailable: false,
      ic9GalaxyGain: new Decimal(),
      requirement: {
        tier: 1,
        amount: new Decimal(),
        cost: new Decimal(),
        usesCost: false,
        usesBought: false,
      },
      canBeBought: false,
      distantStart: new Decimal(),
      remoteStart: new Decimal(),
      lockText: null,
      canBulkBuy: false,
      creditsClosed: false,
      scalingText: {
        distant: null,
        remote: null,
      },
      hasTutorial: false,
    };
  },
  computed: {
    isDoomed: () => Pelle.isDoomed,
    dimName() {
      return AntimatterDimension(this.requirement.tier).displayName;
    },
    buttonText() {
      if (this.lockText !== null) return this.lockText;
      const reset = [];
      if (!Achievement(117).isUnlocked) reset.push("Dimensions");
      if (!Achievement(143).isUnlocked) reset.push("Dimension Boosts");
      return reset.length === 0
        ? `Increase the power of Tickspeed upgrades`
        : `Reset your ${makeEnumeration(reset)} to increase the power of Tickspeed upgrades`;
    },
    sumText() {
      const parts = [Decimal.max(this.galaxies.normal, 0)];
      if (this.galaxies.replicanti.gt(0)) parts.push(this.galaxies.replicanti);
      if (this.galaxies.dilation.gt(0)) parts.push(this.galaxies.dilation);
      const sum = parts.map(this.formatGalaxies).join(" + ");
      if (parts.length >= 2) {
        return `${sum} = ${this.formatGalaxies(parts.sum())}`;
      }
      return sum;
    },
    typeName() {
      switch (this.type) {
        case GALAXY_TYPE.NORMAL: return "Antimatter Galaxies";
        case GALAXY_TYPE.DISTANT: return "Distant Antimatter Galaxies";
        case GALAXY_TYPE.REMOTE: return "Remote Antimatter Galaxies";
      }
      return undefined;
    },
    hasIncreasedScaling() {
      return this.type !== GALAXY_TYPE.NORMAL;
    },
    costScalingText() {
      switch (this.type) {
        case GALAXY_TYPE.DISTANT:
          return `Each Galaxy is more expensive past ${quantifyInt("Galaxy", this.distantStart)}`;
        case GALAXY_TYPE.REMOTE: {
          const scalings = [
            { type: "distant", function: "quadratic", amount: this.distantStart },
            { type: "remote", function: "exponential", amount: this.remoteStart }
          ];
          return `Increased Galaxy cost scaling: ${scalings.sort((a, b) => a.amount.compare(b.amount))
            .map(scaling => `${scaling.function} scaling past ${this.formatGalaxies(scaling.amount)} (${scaling.type})`)
            .join(", ").capitalize()}`;
        }
      }
      return undefined;
    },
    classObject() {
      return {
        "o-primary-btn--galaxy l-dim-row__prestige-button": true,
        "tutorial--glow": this.canBeBought && this.hasTutorial,
        "o-pelle-disabled-pointer": this.creditsClosed,
      };
    }
  },
  methods: {
    update() {
      this.type = Galaxy.type;
      this.galaxies.normal.copyFrom(player.galaxies.add(GalaxyGenerator.galaxies));
      this.galaxies.replicanti.copyFrom(Replicanti.galaxies.total);
      this.galaxies.dilation.copyFrom(player.dilation.totalTachyonGalaxies);
      const requirement = Galaxy.requirement;
      this.requirement.amount.copyFrom(requirement.amount);
      this.requirement.usesCost = requirement.cost !== null;
      this.requirement.usesBought = requirement.usesBought;
      if (this.requirement.usesCost) this.requirement.cost.copyFrom(requirement.cost);
      this.requirement.tier = requirement.tier;
      this.canBeBought = requirement.isSatisfied && Galaxy.canBeBought;
      this.distantStart.copyFrom(Galaxy.costScalingStart);
      this.remoteStart.copyFrom(Galaxy.remoteStart);
      this.lockText = Galaxy.lockText;
      this.canBulkBuy = Galaxy.canBulkBuy;
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.hasTutorial = Tutorial.isActive(TUTORIAL_STATE.GALAXY);
      this.isIC9Running = InfinityChallenge(9).isRunning;
      if (this.isIC9Running) {
        this.ic9AnnihilateAvailable = IC9Annihilation.canAnnihilate;
        this.ic9GalaxyGain.copyFrom(IC9Annihilation.galaxyGain);
      }
    },
    buyGalaxy(bulk) {
      if (!this.canBeBought) return;
      manualRequestGalaxyReset(this.canBulkBuy && bulk);
    },
    annihilate() {
      if (!this.ic9AnnihilateAvailable) return;
      ic9Annihilate();
    },
    formatGalaxies(num) {
      if (InfinityChallenge(9).isRunning) return format(num, 4, 4);
      return num.gt(1e8) ? format(num, 2) : formatInt(num);
    },
  }
};
</script>

<template>
  <div class="c-dimension-row c-antimatter-dim-row c-antimatter-prestige-row">
    <div
      class="l-dim-row__prestige-text c-dim-row__label c-dim-row__label--amount l-text-wrapper"
    >
      <template v-if="isIC9Running">
        Annihilate ({{ sumText }} Galaxies)
      </template>
      <template v-else>
        {{ typeName }} ({{ sumText }}):
        <template v-if="requirement.usesCost">
          requires next {{ dimName }} cost: {{ format(requirement.cost, 2, 0) }} AM
        </template>
        <template v-else>
          requires {{ formatInt(requirement.amount) }} {{ dimName }} Dimensions
          {{ requirement.usesBought ? " purchased" : "" }}
        </template>
        <div class="l-scaling-text-wrapper">
          {{ hasIncreasedScaling ? costScalingText : "" }}
        </div>
      </template>
    </div>
    <PrimaryButton
      v-if="isIC9Running"
      :enabled="ic9AnnihilateAvailable"
      class="o-primary-btn--galaxy l-dim-row__prestige-button"
      @click="annihilate"
    >
      Annihilate (+{{ format(ic9GalaxyGain, 4, 4) }} Galaxies)
    </PrimaryButton>
    <PrimaryButton
      v-else
      :enabled="canBeBought"
      :class="classObject"
      @click.exact="buyGalaxy(true)"
      @click.shift.exact="buyGalaxy(false)"
    >
      {{ buttonText }}
      <div
        v-if="hasTutorial"
        class="fas fa-circle-exclamation l-notification-icon"
      />
    </PrimaryButton>
  </div>
</template>

<style scoped>
.l-text-wrapper {
  height: 6rem;
}

.l-scaling-text-wrapper {
  height: 2rem;
}

.o-primary-btn--galaxy {
  width: 22rem;
  height: 5.5rem;
  position: relative;
  font-size: 0.9rem;
}
</style>
