<script>
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ClassicDimensionBoostRow",
  components: {
    PrimaryButton
  },
  data() {
    return {
      requirement: {
        tier: 1,
        amount: new Decimal(),
        cost: new Decimal(),
        usesCost: false,
        usesBought: false,
      },
      isBuyable: false,
      purchasedBoosts: new Decimal(),
      imaginaryBoosts: new Decimal(),
      lockText: null,
      unlockedByBoost: null,
      creditsClosed: false,
      requirementText: null,
      hasTutorial: false,
    };
  },
  computed: {
    isDoomed: () => Pelle.isDoomed,
    dimName() {
      return AntimatterDimension(this.requirement.tier).displayName;
    },
    dimensionRequirementText() {
      const purchased = this.requirement.usesBought ? " purchased" : "";
      return `${formatInt(this.requirement.amount)} ${this.dimName} Dimensions${purchased}`;
    },
    boostCountText() {
      if (this.requirementText) return this.requirementText;
      const parts = [this.purchasedBoosts];
      if (this.imaginaryBoosts.neq(0)) {
        parts.push(this.imaginaryBoosts);
      }
      const sum = parts.map(formatInt).join(" + ");
      if (parts.length >= 2) {
        return `${sum} = ${formatInt(parts.sum())}`;
      }
      return sum;
    },
    classObject() {
      return {
        "o-primary-btn--dimboost l-dim-row__prestige-button": true,
        "tutorial--glow": this.isBuyable && this.hasTutorial,
        "o-pelle-disabled-pointer": this.creditsClosed
      };
    }
  },
  methods: {
    update() {
      const requirement = DimBoost.requirement;
      this.requirement.tier = requirement.tier;
      this.requirement.amount.copyFrom(requirement.amount);
      this.requirement.usesCost = requirement.cost !== null;
      this.requirement.usesBought = requirement.usesBought;
      if (this.requirement.usesCost) this.requirement.cost.copyFrom(requirement.cost);
      this.isBuyable = requirement.isSatisfied && DimBoost.canBeBought;
      this.purchasedBoosts.copyFrom(DimBoost.purchasedBoosts);
      this.imaginaryBoosts.copyFrom(DimBoost.imaginaryBoosts);
      this.lockText = DimBoost.lockText;
      this.unlockedByBoost = DimBoost.unlockedByBoost;
      this.creditsClosed = GameEnd.creditsClosed;
      if (this.isDoomed) this.requirementText = formatInt(this.purchasedBoosts);
      this.hasTutorial = Tutorial.isActive(TUTORIAL_STATE.DIMBOOST);
    },
    dimensionBoost(bulk) {
      if (!DimBoost.requirement.isSatisfied || !DimBoost.canBeBought) return;
      manualRequestDimensionBoost(bulk);
    }
  }
};
</script>

<template>
  <div class="c-dimension-row c-antimatter-dim-row c-antimatter-prestige-row">
    <div class="l-dim-row__prestige-text c-dim-row__label c-dim-row__label--amount">
      Dimension Boost ({{ boostCountText }}):
      <template v-if="requirement.usesCost">
        requires next {{ dimName }} cost: {{ format(requirement.cost, 2, 0) }} AM
      </template>
      <template v-else>
        requires {{ dimensionRequirementText }}
      </template>
    </div>
    <PrimaryButton
      :enabled="isBuyable"
      :class="classObject"
      @click.exact="dimensionBoost(true)"
      @click.shift.exact="dimensionBoost(false)"
    >
      {{ unlockedByBoost }}
      <div
        v-if="hasTutorial"
        class="fas fa-circle-exclamation l-notification-icon"
      />
    </PrimaryButton>
  </div>
</template>

<style scoped>
.o-primary-btn--dimboost {
  width: 22rem;
  height: 5.5rem;
  position: relative;
  font-size: 0.9rem;
}
</style>
