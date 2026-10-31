import { antimatterGalaxyJMultiplier, effectiveReplicantiGalaxies } from "../../galaxy-strength";

import { MultiplierTabHelper } from "./helper-functions";
import { MultiplierTabIcons } from "./icons";

// See index.js for documentation
export const galaxies = {
  // Note: none of the galaxy types use the global multiplier that applies to all of them within multValue, which
  // very slightly reduces performance impact and is okay because it's applied consistently
  antimatter: {
    name: "Antimatter Galaxies",
    displayOverride: () => {
      const num = player.galaxies.add(GalaxyGenerator.galaxies);
      const weightedCount = player.galaxies.times(antimatterGalaxyJMultiplier()).add(GalaxyGenerator.galaxies);
      const mult = weightedCount.div(num.clampMin(1)).times(MultiplierTabHelper.globalGalaxyMult());
      return `${format(num)}, ${formatX(mult, 2, 2)} strength`;
    },
    multValue: () => Decimal.pow10(player.galaxies.times(antimatterGalaxyJMultiplier()).add(GalaxyGenerator.galaxies)),
    isActive: true,
    icon: MultiplierTabIcons.ANTIMATTER,
  },
  replicanti: {
    name: "Replicanti Galaxies",
    displayOverride: () => {
      const num = Replicanti.galaxies.total;
      const mult = effectiveReplicantiGalaxies().div(num.clampMin(1)).times(MultiplierTabHelper.globalGalaxyMult());
      return `${formatInt(num)}, ${formatX(mult, 2, 2)} strength`;
    },
    multValue: () => Decimal.pow10(effectiveReplicantiGalaxies()),
    isActive: () => Replicanti.areUnlocked,
    icon: MultiplierTabIcons.SPECIFIC_GLYPH("replication"),
  },
  tachyon: {
    name: "Tachyon Galaxies",
    displayOverride: () => {
      const num = player.dilation.totalTachyonGalaxies;
      const mult = MultiplierTabHelper.globalGalaxyMult() *
          (1 + Math.max(0, Replicanti.amount.max(1).log10() / 1e6) * AlchemyResource.alternation.effectValue);
      return `${format(num)}, ${formatX(mult, 2, 2)} strength`;
    },
    multValue: () => {
      const num = player.dilation.totalTachyonGalaxies;
      const mult = 1 + Math.max(0, Replicanti.amount.max(1).log10() / 1e6) * AlchemyResource.alternation.effectValue;
      return Decimal.pow10(num * mult);
    },
    isActive: () => player.dilation.totalTachyonGalaxies.gt(0),
    icon: MultiplierTabIcons.SPECIFIC_GLYPH("dilation"),
  },
  nerfPelle: {
    name: "Doomed Reality",
    displayOverride: () => `All Galaxy strength /${formatInt(2)}`,
    powValue: 0.5,
    isActive: () => Pelle.isDoomed,
    icon: MultiplierTabIcons.PELLE,
  }
};
