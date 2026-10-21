<script>
import ChallengeBox from "@/components/ChallengeBox";
import DescriptionDisplay from "@/components/DescriptionDisplay";
import EffectDisplay from "@/components/EffectDisplay";

export default {
  name: "InfinityChallengeBox",
  components: {
    ChallengeBox,
    DescriptionDisplay,
    EffectDisplay
  },
  props: {
    challenge: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isUnlocked: false,
      isRunning: false,
      isCompleted: false
    };
  },
  computed: {
    config() {
      return this.challenge.config;
    },
    showCurrentEffect() {
      return this.config.showCurrentEffect !== false;
    },
    name() {
      return `IC${this.challenge.id} — ${this.config.name}`;
    }
  },
  methods: {
    update() {
      const challenge = this.challenge;
      this.isUnlocked = challenge.isUnlocked;
      this.isRunning = challenge.isRunning;
      this.isCompleted = challenge.isCompleted;
    }
  }
};
</script>

<template>
  <ChallengeBox
    :name="name"
    :is-unlocked="isUnlocked"
    :is-running="isRunning"
    :is-completed="isCompleted"
    class="c-challenge-box--infinity"
    @start="challenge.requestStart()"
  >
    <template #top>
      <DescriptionDisplay :config="config" />
      <EffectDisplay
        v-if="isRunning && showCurrentEffect"
        :config="config"
      />
    </template>
    <template #bottom>
      <div class="l-challenge-box__bottom--infinity">
        <span>Goal: {{ format(config.goal) }} antimatter</span>
        <span v-if="config.reward.inlineEffect">
          <DescriptionDisplay
            :config="config.reward"
            title="Reward:"
          />
          <EffectDisplay
            v-if="!config.reward.hideEffect"
            :config="config.reward"
          />
        </span>
        <template v-else>
          <DescriptionDisplay
            :config="config.reward"
            title="Reward:"
          />
          <EffectDisplay
            v-if="!config.reward.hideEffect"
            :config="config.reward"
          />
        </template>
      </div>
    </template>
  </ChallengeBox>
</template>

<style scoped>

</style>
