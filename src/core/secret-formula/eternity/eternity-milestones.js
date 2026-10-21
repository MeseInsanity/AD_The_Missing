export const eternityMilestones = {
  autobuyerIPMult: { eternities: 1, reward: "Unlock the Infinity Point multiplier autobuyer", pelleUseless: true },
  keepAutobuyers: {
    eternities: 2,
    reward: "You start Eternity with all Normal Challenges complete, all normal autobuyers, and infinity broken"
  },
  autobuyerRebuyableBreakUpgrades: { eternities: 3, reward: "Autobuy Rebuyable Break Infinity Upgrades" },
  keepInfinityUpgrades: {
    eternities: 4,
    reward: "You start Eternity with all Infinity Upgrades",
    givenByPelle: () => PelleUpgrade.keepInfinityUpgrades.isBought,
    pelleUseless: true
  },
  keepBreakUpgrades: {
    eternities: 5,
    reward: "You start Eternity with all non-rebuyable Break Infinity Upgrades",
    givenByPelle: () => PelleUpgrade.keepBreakInfinityUpgrades.isBought,
    pelleUseless: true
  },
  autoIC: { eternities: 8, reward: "You complete Infinity Challenges as soon as you unlock them", pelleUseless: true },
  autobuyerID1: {
    eternities: 16,
    reward: "Unlock all Infinity Dimension Autobuyers and automatically unlock Infinity Dimensions upon reaching them",
    givenByPelle: () => PelleUpgrade.IDAutobuyers.isBought,
    pelleUseless: true
  },
  bigCrunchModes: { eternities: 24, reward: "Unlock more Big Crunch Autobuyer options" },
  unlockAllND: { eternities: 32, reward: "Start with all Antimatter Dimensions available for purchase" },
  autobuyerReplicantiGalaxy: {
    eternities: 48,
    reward: "Unlock the Replicanti Galaxy and Max Replicanti Galaxy Upgrade Autobuyers",
    givenByPelle: () => PelleUpgrade.replicantiAutobuyers.isBought,
    pelleUseless: true
  },
  replicantiNoReset: {
    eternities: 64,
    reward: `Replicanti Galaxies no longer reset Antimatter, Antimatter Dimensions,
      Tickspeed, Dimensional Sacrifice, or Dimension Boosts`,
    pelleUseless: true
  },
  autobuyerEternity: { eternities: 100, reward: "Unlock autobuyer for Eternities" },
  autoEP: {
    eternities: 128,
    reward: () => {
      const EPmin = getOfflineEPGain(TimeSpan.fromMinutes(1).totalMilliseconds);
      const hasOfflineEternities = getEternitiedMilestoneReward(TimeSpan.fromHours(1).totalMilliseconds,
        EternityMilestone.autoEternities.isReached).gt(0);
      const hasOfflineInfinities = getInfinitiedMilestoneReward(TimeSpan.fromHours(1).totalMilliseconds,
        EternityMilestone.autoInfinities.isReached).gt(0);
      if (!player.options.offlineProgress) return "This milestone would give offline EP generation, but offline progress is currently disabled";
      const effectText = (hasOfflineEternities || hasOfflineInfinities) ? "Inactive" : `Currently ${format(EPmin, 2, 2)} EP/min`;
      return `While offline, gain ${formatPercents(0.25)} of your best Eternity Points per minute from previous Eternities (${effectText})`;
    },
    activeCondition: () => (player.options.offlineProgress
      ? `Active as long as neither of the other offline milestones (${formatInt(256)} or ${formatInt(512)}) are also active`
      : ""),
  },
  autoEternities: {
    eternities: 256,
    reward: () => {
      if (!player.options.offlineProgress) return "This milestone would generate eternities offline, but offline progress is currently disabled";
      const eternities = getEternitiedMilestoneReward(TimeSpan.fromHours(1).totalMilliseconds,
        player.eternities.gte(256));
      const realTime = PlayerProgress.seenAlteredSpeed() ? " real-time" : "";
      return `While offline, gain Eternities at ${formatPercents(0.5)} the rate of your fastest${realTime} Eternity ${
        eternities.gt(0) ? `(Currently ${format(eternities, 2, 2)}/hour)` : "(Inactive)"}`;
    },
    activeCondition: () => (player.options.offlineProgress
      ? `Must be outside of all Challenges and Dilation, and the Eternity Autobuyer must be set to Eternity at zero EP. This milestone's effect is capped at ${formatInt(33)}ms.`
      : ""),
    pelleUseless: true
  },
  autoInfinities: {
    eternities: 512,
    reward: () => {
      if (!player.options.offlineProgress) return "This milestone would generate infinities offline, but offline progress is currently disabled";
      const infinities = getInfinitiedMilestoneReward(TimeSpan.fromHours(1).totalMilliseconds,
        player.eternities.gte(512));
      return `While offline, gain Infinities equal to ${formatPercents(0.5)} your best Infinities/hour this Eternity ${
        infinities.gt(0) ? `(Currently ${format(infinities, 2, 2)}/hour)` : "(Inactive)"}`;
    },
    activeCondition: () => (player.options.offlineProgress
      ? `Must be outside of Normal/Infinity Challenges and outside of EC4 and EC12, the Big Crunch Autobuyer must be turned on and set to time mode with ${formatInt(5)} seconds or less, and the Eternity Autobuyer must be turned off.`
      : ""),
    pelleUseless: true
  }
};
