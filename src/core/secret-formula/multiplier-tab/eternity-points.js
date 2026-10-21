import { DC } from "../../constants";
import { PlayerProgress } from "../../player-progress";

import { MultiplierTabIcons } from "./icons";

// See index.js for documentation
export const EP = {
  total: {
    name: "Total EP Gained on Eternity",
    displayOverride: () => (Player.canEternity
      ? format(gainedEternityPoints(), 2, 2)
      : "Cannot Eternity"),
    // This effectively hides everything if the player can't actually gain any
    multValue: () => (Player.canEternity ? gainedEternityPoints() : 1),
    isActive: () => PlayerProgress.eternityUnlocked() || Player.canEternity,
    dilationEffect: () => (Laitela.isRunning ? 0.75 * Effects.product(DilationUpgrade.dilationPenalty) : 1),
    isDilated: true,
    overlay: ["Δ", "<i class='fa-solid fa-layer-group' />"],
  },
  base: {
    name: "Base Eternity Points",
    isBase: true,
    fakeValue: DC.D4,
    multValue: () => DC.D4.pow(player.records.thisEternity.maxIP.plus(
      gainedInfinityPoints()).max(1).log2().div(eternityPointDivisor()).sub(1)),
    isActive: () => PlayerProgress.eternityUnlocked(),
    icon: MultiplierTabIcons.CONVERT_FROM("IP"),
  },
  IP: {
    name: "Eternity Points from Infinity Points",
    displayOverride: () => `${format(player.records.thisEternity.maxIP.plus(gainedInfinityPoints()), 2, 2)} IP`,
    // Just needs to match the value in base and be larger than 1
    multValue: DC.D4,
    isActive: () => PlayerProgress.eternityUnlocked(),
    icon: MultiplierTabIcons.SPECIFIC_GLYPH("infinity"),
  },
  divisor: {
    name: "EP Formula Divisor",
    displayOverride: () => {
      const div = eternityPointDivisor();
      return `log2(IP)/${formatInt(2880)} - 1 ➜ log2(IP)/${format(div, 2, 2)} - 1`;
    },
    powValue: () => Decimal.divide(2880, eternityPointDivisor()),
    isActive: () => !eternityPointDivisor().eq(2880),
    icon: MultiplierTabIcons.DIVISOR("EP"),
  },
  eternityUpgrade: {
    name: () => `Eternity Upgrade - Repeatable ${formatX(5)} EP`,
    multValue: () => EternityUpgrade.epMult.effectOrDefault(1),
    isActive: () => PlayerProgress.eternityUnlocked() && !Pelle.isDoomed,
    icon: MultiplierTabIcons.UPGRADE("eternity"),
  },
  timeStudy: {
    name: "Time Studies",
    multValue: () => DC.D1.timesEffectsOf(
      TimeStudy(61),
      TimeStudy(121),
      TimeStudy(122),
      TimeStudy(123),
    ),
    isActive: () => PlayerProgress.eternityUnlocked() && !Pelle.isDoomed,
    icon: MultiplierTabIcons.TIME_STUDY,
  },
  glyph: {
    name: "Equipped Glyphs",
    multValue: () => DC.D1
      .timesEffectsOf(Pelle.isDoomed ? null : GlyphEffect.epMult)
      .times(Pelle.specialGlyphEffect.time),
    powValue: () => (GlyphAlteration.isAdded("time") ? getSecondaryGlyphEffect("timeEP") : 1),
    isActive: () => PlayerProgress.realityUnlocked(),
    icon: MultiplierTabIcons.GENERIC_GLYPH,
  },
  realityUpgrade: {
    name: "Reality Upgrade - The Knowing Existence",
    multValue: () => RealityUpgrade(12).effectOrDefault(1),
    isActive: () => RealityUpgrade(12).canBeApplied && !Pelle.isDoomed,
    icon: MultiplierTabIcons.UPGRADE("reality"),
  },
  pelle: {
    name: "Pelle Strike - Vacuum Rift",
    multValue: () => PelleRifts.vacuum.milestones[2].effectOrDefault(1),
    isActive: () => PelleRifts.vacuum.milestones[2].canBeApplied,
    icon: MultiplierTabIcons.PELLE,
  },
  iap: {
    name: "Shop Tab Purchases",
    multValue: () => 1,
    isActive: () => false,
    icon: MultiplierTabIcons.IAP,
  },

  nerfTeresa: {
    name: "Teresa's Reality",
    powValue: () => 0.55,
    isActive: () => Teresa.isRunning,
    icon: MultiplierTabIcons.GENERIC_TERESA,
  },
  nerfV: {
    name: "V's Reality",
    powValue: () => 0.5,
    isActive: () => V.isRunning,
    icon: MultiplierTabIcons.GENERIC_V,
  },
};
