import { DC } from "./constants";
import { Fragments } from "./secret-formula/fragments";

// Shared by Tickspeed and Temporal Constellation. Keeping this outside tickspeed avoids loading challenge runtime
// code while GameDatabase is constructing Time Study configurations.
export function galaxyStrengthMultiplier() {
  const effects = Effects.product(
    InfinityUpgrade.galaxyBoost,
    InfinityUpgrade.galaxyBoost.chargedEffect,
    BreakInfinityUpgrade.galaxyBoost,
    TimeStudy(212),
    TimeStudy(232),
    Achievement(86),
    Achievement(178),
    InfinityChallenge(6).reward,
    PelleUpgrade.galaxyPower,
    PelleRifts.decay.milestones[1]
  );
  let modifier = effects;
  if (BreakInfinityUpgrade.galaxyFormula.isBought) {
    modifier = modifier.times(Fragments.galaxyPower.effect().div(4).sqrt());
  }
  if (Pelle.isDoomed) modifier = modifier.div(2);
  modifier = modifier.times(Pelle.specialGlyphEffect.power);
  modifier = modifier.times(getAdjustedGlyphEffect("cursedgalaxies"));
  modifier = modifier.times(getAdjustedGlyphEffect("realitygalaxies"));
  modifier = modifier.times(ImaginaryUpgrade(9).effectOrDefault(DC.D0).add(1));
  if (InfinityChallenge(12).isRunning) modifier = modifier.pow(0.05);
  return modifier;
}

export function antimatterGalaxyJMultiplier() {
  const multiplier = Fragments.galacticThresholdJMultiplier;
  return InfinityChallenge(12).isRunning ? multiplier.pow(0.05) : multiplier;
}

// RG-specific effects are shared by Tickspeed and Temporal Constellation.
export function effectiveReplicantiGalaxies() {
  const bought = Replicanti.galaxies.bought;
  const studies = 1 + TimeStudy(132).effectOrDefault(0) + TimeStudy(133).effectOrDefault(0);
  const ec8 = Decimal.min(bought, ReplicantiUpgrade.galaxies.value).times(Effects.sum(EternityChallenge(8).reward));
  return bought.times(studies).add(Replicanti.galaxies.extra).add(ec8);
}
