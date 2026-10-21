import { DC } from "../../constants";

import { MultiplierTabHelper } from "./helper-functions";
import { MultiplierTabIcons } from "./icons";

// See index.js for documentation
export const general = {
  achievement: {
    name: (ach, dim) => (dim?.length === 2
      ? `Achievement ${ach} (${dim})`
      : `Achievement ${ach}`),
    multValue: (ach, dim) => {
      // There is also a banked infinities gain effect, but we don't track that in the multiplier tab
      if (ach === 131) return 1;
      // There is also a buy10 effect, but we don't track that in the multiplier tab
      if (ach === 141) return Achievement(141).canBeApplied ? Achievement(141).effects.ipGain.effectOrDefault(1) : 1;
      if (ach === 183) return 1;
      if (ach === 81) {
        const pow = Achievement(81).effectOrDefault(1);
        const affected = tier => tier <= InfinityChallenge(5).ic5AchievementTier;
        const mults = AntimatterDimensions.all.map(ad => (affected(ad.tier)
          ? ad.multiplier.pow((pow - 1) / pow)
          : DC.D1));
        if (dim?.length === 2) return mults.reduce((x, y) => x.times(y), DC.D1);
        if (!dim) return mults.reduce((x, y) => x.times(y), DC.D1);
        return mults[Number(dim.charAt(2)) - 1];
      }
      if (!dim) return Achievement(ach).canBeApplied ? Achievement(ach).effectOrDefault(1) : 1;

      if (dim?.length === 2) {
        let totalEffect = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount(dim); tier++) {
          let singleEffect;
          if (ach === 43) singleEffect = Achievement(43).canBeApplied ? (1 + tier / 100) : 1;
          else singleEffect = (MultiplierTabHelper.achievementDimCheck(ach, `${dim}${tier}`) &&
              Achievement(ach).canBeApplied) ? Achievement(ach).effectOrDefault(1) : 1;
          totalEffect = totalEffect.times(singleEffect);
        }
        return totalEffect;
      }

      if (ach === 43) return Achievement(43).canBeApplied ? (1 + Number(dim.charAt(2)) / 100) : 1;
      return (MultiplierTabHelper.achievementDimCheck(ach, dim) && Achievement(ach).canBeApplied)
        ? Achievement(ach).effectOrDefault(1) : 1;
    },
    // These power effects use their final multiplier as a display proxy in multValue().
    powValue: ach => (ach === 183 ? Achievement(183).effectOrDefault(1) : 1),
    isActive: ach => Achievement(ach).canBeApplied,
    icon: ach => {
      const base = MultiplierTabIcons.ACHIEVEMENT;
      return {
        color: base.color,
        symbol: `${base.symbol}${ach}`,
      };
    },
  },
  timeStudy: {
    name: (ts, dim) => (dim?.length === 2
      ? `Time Study ${ts} (${dim})`
      : `Time Study ${ts}`),
    multValue: (ts, dim) => {
      // This is a special case for the passive path RG study, as its effect is 0.4 (for galaxy power) but
      // in the multiplier tab we only reference its replicanti speed value (which is 1.5)
      // The PASS perk doubles this effect
      if (ts === 132) {
        const passPerkMult = Perk.studyPassive.isBought ? 2 : 1;
        return TimeStudy(ts).canBeApplied ? 1.5 * passPerkMult : 1;
      }

      if (!dim) return TimeStudy(ts).canBeApplied ? TimeStudy(ts).effectOrDefault(1) : 1;
      if (dim?.length === 2) {
        let totalEffect = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount(dim); tier++) {
          totalEffect = totalEffect.times((MultiplierTabHelper.timeStudyDimCheck(ts, `${dim}${tier}`) &&
              TimeStudy(ts).isBought) ? TimeStudy(ts).effectOrDefault(1) : 1);
        }
        return totalEffect;
      }
      // The new Decimal() wrapper is necessary because, for some inexplicable reason, replicanti becomes
      // reactive through TS101 if that isn't there
      return (MultiplierTabHelper.timeStudyDimCheck(ts, dim) && TimeStudy(ts).isBought)
        ? new Decimal(TimeStudy(ts).effectOrDefault(1)) : 1;
    },
    isActive: ts => TimeStudy(ts).isBought,
    icon: ts => {
      const base = MultiplierTabIcons.TIME_STUDY;
      return {
        color: base.color,
        symbol: `${base.symbol}${ts}`,
      };
    },
  },
  infinityChallenge: {
    name: ic => `Infinity Challenge ${ic}`,
    displayOverride: ic => (ic === 5 ? formatPow(InfinityChallenge(5).reward.effectValue, 0, 3) : ""),
    multValue: (ic, dim) => {
      // Use each final multiplier as a display proxy for IC5's targeted power effect.
      if (ic === 5) {
        const ic5Pow = InfinityChallenge(5).reward.effectValue;
        const mults = AntimatterDimensions.all.map(ad => (ad.tier > 1
          ? ad.multiplier.pow((ic5Pow - 1) / ic5Pow)
          : DC.D1));
        if (dim?.length === 2) return mults.reduce((x, y) => x.times(y), DC.D1);
        return mults[Number(dim.charAt(2)) - 1];
      }

      if (dim?.length === 2) {
        let totalEffect = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount(dim); tier++) {
          totalEffect = totalEffect.times((MultiplierTabHelper.ICDimCheck(ic, `${dim}${tier}`) &&
              InfinityChallenge(ic).isCompleted) ? InfinityChallenge(ic).reward.effectOrDefault(1) : 1);
        }
        return totalEffect;
      }
      const num = Number(dim.charAt(2));
      if (ic === 8) return (num > 1 && num < 8) ? InfinityChallenge(ic).reward.effectValue : DC.D1;
      return InfinityChallenge(ic).reward.effectValue;
    },
    isActive: ic => InfinityChallenge(ic).isCompleted,
    icon: ic => {
      const base = MultiplierTabIcons.CHALLENGE("infinity");
      return {
        color: base.color,
        symbol: `${base.symbol}${ic}`,
      };
    },
  },
  eternityChallenge: {
    name: ec => `Eternity Challenge ${ec}`,
    multValue: (ec, dim) => {
      if (dim?.length === 2) {
        let totalEffect = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount(dim); tier++) {
          totalEffect = totalEffect.times(
            (MultiplierTabHelper.ECDimCheck(ec, `${dim}${tier}`) && EternityChallenge(ec).reward.canBeApplied)
              ? EternityChallenge(ec).reward.effectOrDefault(1).clampMin(1)
              : 1);
        }
        return totalEffect;
      }
      if (ec === 2) return dim === "ID1" ? EternityChallenge(ec).reward.effectValue : DC.D1;
      return EternityChallenge(ec).reward.effectOrDefault(1);
    },
    isActive: ec => EternityChallenge(ec).reward.canBeApplied,
    icon: ec => {
      const base = MultiplierTabIcons.CHALLENGE("eternity");
      return {
        color: base.color,
        symbol: `${base.symbol}${ec}`,
      };
    },
  },
};
