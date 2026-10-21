<script>
import { ic9Annihilate } from "@/core/galaxy";
import { IC9Annihilation } from "@/core/infinity-challenges";

export default {
  name: "ModernAntimatterGalaxyRow",
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
        amount: 0,
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
      return AntimatterDimension(this.requirement.tier).shortDisplayName;
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
        "o-primary-btn o-primary-btn--new o-primary-btn--dimension-reset": true,
        "tutorial--glow": this.canBeBought && this.hasTutorial,
        "o-primary-btn--disabled": !this.canBeBought,
        "o-pelle-disabled-pointer": this.creditsClosed
      };
    },
    annihilateClassObject() {
      return {
        "o-primary-btn o-primary-btn--new o-primary-btn--dimension-reset c-ic9-annihilate-btn": true,
        "o-primary-btn--disabled": !this.ic9AnnihilateAvailable,
        "o-pelle-disabled-pointer": this.creditsClosed
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
      this.requirement.amount = requirement.amount;
      this.requirement.cost = requirement.cost;
      this.requirement.usesCost = requirement.cost !== null;
      this.requirement.usesBought = requirement.usesBought;
      this.requirement.tier = requirement.tier;
      this.canBeBought = requirement.isSatisfied && Galaxy.canBeBought;
      this.distantStart.copyFrom(EternityChallenge(5).isRunning ? new Decimal() : Galaxy.costScalingStart);
      this.remoteStart.copyFrom(Galaxy.remoteStart);
      this.lockText = Galaxy.lockText;
      this.canBulkBuy = Galaxy.canBulkBuy;
      this.creditsClosed = GameEnd.creditsEverClosed;
      if (this.isDoomed) {
        this.scalingText = {
          distant: this.formatGalaxies(this.distantStart),
          remote: this.formatGalaxies(Galaxy.remoteStart),
        };
      }
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
      return num.gt(1e8) ? format(num, 2) : formatInt(num.toNumber());
    },
  }
};
</script>

<template>
  <div class="reset-container galaxy">
    <template v-if="isIC9Running">
      <h4>Annihilate ({{ sumText }} Galaxies)</h4>
      <button
        :class="annihilateClassObject"
        @click="annihilate"
      >
        Annihilate (+{{ format(ic9GalaxyGain, 4, 4) }} Galaxies)
      </button>
    </template>
    <template v-else>
      <h4>{{ typeName }} ({{ sumText }})</h4>
      <span v-if="requirement.usesCost">Requires next {{ dimName }} cost: {{ format(requirement.cost, 2, 0) }} AM</span>
      <span v-else>
        Requires: {{ formatInt(requirement.amount) }} {{ dimName }} Antimatter D
        <template v-if="requirement.usesBought">
          purchased
        </template>
      </span>
      <span v-if="hasIncreasedScaling">{{ costScalingText }}</span>
    </template>
    <button
      v-if="!isIC9Running"
      :class="classObject"
      @click.exact="buyGalaxy(true)"
      @click.shift.exact="buyGalaxy(false)"
    >
      {{ buttonText }}
      <div
        v-if="hasTutorial"
        class="fas fa-circle-exclamation l-notification-icon"
      />
    </button>
  </div>
</template>

<style scoped>
.c-ic9-annihilate-btn {
  min-width: 28rem;
}
</style>
