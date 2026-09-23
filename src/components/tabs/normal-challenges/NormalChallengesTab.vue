<script>
import ChallengeGrid from "@/components/ChallengeGrid";
import ChallengeTabHeader from "@/components/ChallengeTabHeader";
import NormalChallengeBox from "./NormalChallengeBox";

export default {
  name: "NormalChallengesTab",
  components: {
    ChallengeGrid,
    ChallengeTabHeader,
    NormalChallengeBox
  },
  data() {
    return {
      completedChallenges: 0,
      infinityDimensionsUnlocked: false,
      infinityPowerExponentBonus: 0
    };
  },
  computed: {
    challenges() {
      return NormalChallenges.all;
    }
  },
  methods: {
    update() {
      this.completedChallenges = NormalChallenges.all.countWhere(challenge => challenge.isCompleted);
      this.infinityDimensionsUnlocked = Achievement(47).isUnlocked;
      this.infinityPowerExponentBonus = this.completedChallenges * 0.01;
    }
  }
};
</script>

<template>
  <div class="l-challenges-tab">
    <ChallengeTabHeader />
    <div>
      Some Normal Challenges have requirements to be able to run that challenge.
    </div>
    <div>
      Completed Normal Challenges increase Infinity Point gain.
      Current multiplier: {{ formatX(Math.max(1, completedChallenges), 0, 0) }}.
      <span v-if="infinityDimensionsUnlocked">
        They also increase the Infinity Power conversion exponent by {{ format(infinityPowerExponentBonus, 2, 2) }}.
      </span>
    </div>
    <div>
      If you have an active Big Crunch Autobuyer, it will attempt to Crunch
      as soon as possible when reaching Infinite antimatter.
    </div>
    <ChallengeGrid
      v-slot="{ challenge }"
      :challenges="challenges"
    >
      <NormalChallengeBox :challenge="challenge" />
    </ChallengeGrid>
  </div>
</template>

<style scoped>

</style>
