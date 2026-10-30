<script>
import {
  condensateMilestoneRows,
  condensateRepeatMilestoneLevel,
  condensateRepeatMilestoneNextRequirement,
  condensateRepeatMilestones
} from "@/core/secret-formula/fragments/condensate-milestones";
import { Fragments } from "@/core/secret-formula/fragments";

export default {
  name: "CondensateTab",
  data: () => ({
    amount: new Decimal(),
    total: new Decimal(),
    nextGain: new Decimal(),
    canCondense: false,
    milestoneRows: condensateMilestoneRows,
    repeatMilestones: condensateRepeatMilestones,
  }),
  methods: {
    update() {
      this.amount.copyFrom(Fragments.condensateAmount);
      this.total.copyFrom(Fragments.totalCondensate);
      this.nextGain.copyFrom(Fragments.condensateGain);
      this.canCondense = Fragments.canCondense;
    },
    projectedTotal() {
      return this.total.add(this.nextGain);
    },
    milestoneProgress(milestone) {
      return this.total.div(milestone.requirement).clamp(0, 1).toNumber();
    },
    projectedMilestoneProgress(milestone) {
      return this.projectedTotal().div(milestone.requirement).clamp(0, 1).toNumber();
    },
    isMilestoneReached(milestone) {
      return this.total.gte(milestone.requirement);
    },
    reachesMilestoneOnCondense(milestone) {
      return !this.isMilestoneReached(milestone) && this.projectedTotal().gte(milestone.requirement);
    },
    repeatLevel(milestone) {
      return this.repeatLevelAt(milestone, this.total);
    },
    repeatLevelAt(milestone, total) {
      return condensateRepeatMilestoneLevel(milestone.id, total);
    },
    reachesRepeatLevelOnCondense(milestone) {
      return this.repeatLevelAt(milestone, this.projectedTotal()).gt(this.repeatLevel(milestone));
    },
    nextRepeatRequirement(milestone) {
      const level = this.repeatLevel(milestone);
      return condensateRepeatMilestoneNextRequirement(milestone.id, level);
    },
    repeatProgress(milestone) {
      return this.total.div(this.nextRepeatRequirement(milestone)).clamp(0, 1).toNumber();
    },
    projectedRepeatProgress(milestone) {
      return this.projectedTotal().div(this.nextRepeatRequirement(milestone)).clamp(0, 1).toNumber();
    }
  }
};
</script>

<template>
  <div class="l-condensate-tab">
    <div class="c-condensate-tab__title">
      You have <span>{{ format(amount, 2, 2) }}</span> Condensate
      <small>({{ format(total, 2, 2) }} total)</small>
    </div>
    <div class="c-condensate-milestones">
      <div class="c-condensate-milestones__title">
        Condensate Milestones
      </div>
      <div
        v-if="canCondense"
        class="c-condensate-milestones__forecast"
      >
        Next Condense: +{{ format(nextGain, 2, 2) }} Condensate
        → {{ format(projectedTotal(), 2, 2) }} total
      </div>
      <div class="c-condensate-milestones__grid">
        <div
          v-for="milestone in repeatMilestones"
          :key="milestone.id"
          class="c-condensate-milestone c-condensate-milestone--repeat"
          :class="{ 'c-condensate-milestone--projected': reachesRepeatLevelOnCondense(milestone) }"
        >
          <div
            class="c-condensate-milestone__progress c-condensate-milestone__progress--projected"
            :style="{ width: `${projectedRepeatProgress(milestone) * 100}%` }"
          />
          <div
            class="c-condensate-milestone__progress"
            :style="{ width: `${repeatProgress(milestone) * 100}%` }"
          />
          <div class="c-condensate-milestone__content">
            <div class="c-condensate-milestone__header">
              <b>{{ milestone.title }}</b>
              <span>Lv. {{ formatInt(repeatLevel(milestone)) }}</span>
            </div>
            <div class="c-condensate-milestone__requirement">
              Next: {{ format(nextRepeatRequirement(milestone), 2, 2) }} Condensate
            </div>
            Effect: {{ milestone.description(repeatLevel(milestone)) }}
          </div>
        </div>
        <template v-for="row in milestoneRows">
          <div
            v-for="milestone in row"
            :key="milestone.id"
            class="c-condensate-milestone"
            :class="{
              'c-condensate-milestone--reached': isMilestoneReached(milestone),
              'c-condensate-milestone--projected': reachesMilestoneOnCondense(milestone)
            }"
          >
            <div
              class="c-condensate-milestone__progress c-condensate-milestone__progress--projected"
              :style="{ width: `${projectedMilestoneProgress(milestone) * 100}%` }"
            />
            <div
              class="c-condensate-milestone__progress"
              :style="{ width: `${milestoneProgress(milestone) * 100}%` }"
            />
            <div class="c-condensate-milestone__content">
              <b>{{ milestone.title }}</b>
              <div class="c-condensate-milestone__requirement">
                {{ format(milestone.requirement, 2, 2) }} total Condensate
              </div>
              {{ milestone.isImplemented ? "Effect:" : "Planned effect:" }} {{ milestone.description }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.l-condensate-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding-top: 2rem;
}

.c-condensate-tab__title {
  font-size: 1.8rem;
}

.c-condensate-tab__title span {
  color: #8bd3c7;
  font-size: 2.8rem;
  font-weight: bold;
}

.c-condensate-tab__title small {
  font-size: 1.4rem;
}

.c-condensate-milestones {
  width: min(82rem, 94%);
}

.c-condensate-milestones__title {
  margin-bottom: 0.8rem;
  font-size: 1.5rem;
  font-weight: bold;
}

.c-condensate-milestones__forecast {
  margin-bottom: 0.8rem;
  color: #8bd3c7;
  font-size: 1.2rem;
  font-weight: bold;
}

.c-condensate-milestones__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
  gap: 0.6rem;
}

.c-condensate-milestone {
  height: 10.5rem;
  position: relative;
  overflow: hidden;
  text-align: left;
  border: 0.1rem solid #5ca99a;
  border-radius: var(--var-border-radius, 0.3rem);
}

.c-condensate-milestone__progress {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: rgb(139 211 199 / 28%);
}

.c-condensate-milestone__progress--projected {
  background: rgb(139 211 199 / 12%);
}

.c-condensate-milestone__content {
  z-index: 1;
  position: relative;
  padding: 0.7rem 0.9rem;
}

.c-condensate-milestone__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.c-condensate-milestone__requirement {
  margin: 0.25rem 0;
  color: #8bd3c7;
  font-size: 1.25rem;
  font-weight: bold;
}

.c-condensate-milestone--reached {
  color: #102b27;
  background: #8bd3c7;
  border-color: #8bd3c7;
}

.c-condensate-milestone--reached .c-condensate-milestone__progress {
  background: transparent;
}

.c-condensate-milestone--projected {
  border-color: #d4ff76;
  box-shadow: 0 0 0.6rem rgb(212 255 118 / 55%);
}

.c-condensate-milestone--reached .c-condensate-milestone__requirement {
  color: #102b27;
}
</style>
