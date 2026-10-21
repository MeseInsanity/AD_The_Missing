/* eslint-disable */
// Disabling eslint here is fine, this is developer tools and this file does really matter.


import { sha512_256 } from "js-sha512";
import { Player } from "./player";
import { DC } from "./constants";
import FullScreenAnimationHandler from "./full-screen-animation-handler";
import { IC5Focus } from "./infinity-challenges";
import { getIC4TickspeedSoftcapCoefficient } from "./tickspeed";

export const dev = {};

dev.speedUp = 1

dev.hardReset = function() {
  GameStorage.hardReset();
};

dev.giveAllAchievements = function() {
  const allAchievements = Achievements.all.concat(SecretAchievements.all);
  for (const achievement of allAchievements) achievement.unlock();
};

// Know that both dev.doubleEverything and dev.tripleEverything are both broken
// with this error https://i.imgur.com/ZMEBNTv.png

dev.doubleEverything = function() {
  Object.keys(player).forEach(key => {
    if (typeof player[key] === "number") player[key] *= 2;
    if (typeof player[key] === "object" && player[key].constructor !== Object) player[key] = player[key].times(2);
    if (typeof player[key] === "object" && !isFinite(player[key])) {
      Object.keys(player[key]).forEach(key2 => {
        if (typeof player[key][key2] === "number") player[key][key2] *= 2;
        if (typeof player[key][key2] === "object" && player[key][key2].constructor !== Object)
          player[key][key2] = player[key][key2].times(2);
      });
    }
  });
};

dev.tripleEverything = function() {
  Object.keys(player).forEach(key => {
    if (typeof player[key] === "number") player[key] *= 3;
    if (typeof player[key] === "object" && player[key].constructor !== Object) player[key] = player[key].times(3);
    if (typeof player[key] === "object" && !isFinite(player[key])) {
      Object.keys(player[key]).forEach(key3 => {
        if (typeof player[key][key3] === "number") player[key][key3] *= 3;
        if (typeof player[key][key3] === "object" && player[key][key3].constructor !== Object)
          player[key][key3] = player[key][key3].times(3);
      });
    }
  });
};

dev.barrelRoll = function() {
  FullScreenAnimationHandler.display("a-barrel-roll", 5);
};

dev.spin3d = function() {
  if (document.body.style.animation === "") document.body.style.animation = "a-spin3d 3s infinite";
  else document.body.style.animation = "";
};

dev.spin4d = function() {
  if (document.body.style.animation === "") document.body.style.animation = "a-spin4d 3s infinite";
  else document.body.style.animation = "";
};

dev.cancerize = function() {
  Theme.tryUnlock("Design");
  Notation.emoji.setAsCurrent();
};

dev.fixSave = function() {
  const save = JSON.stringify(player, GameSaveSerializer.jsonConverter);
  const fixed = save.replace(/NaN/gui, "10");
  const saveData = JSON.parse(fixed);
  if (!saveData || GameStorage.checkPlayerObject(saveData) !== "") {
    Modal.message.show("Could not fix the save.");
    return;
  }
  GameStorage.loadPlayerObject(saveData);
  GameStorage.save();
};

dev.updateTDCosts = function() {
  for (let tier = 1; tier < 9; tier++) {
    const dim = TimeDimension(tier);
    dim.cost = dim.nextCost(dim.bought);
  }
};

dev.refundTimeDims = function() {
  for (const dimension of TimeDimensions.all) {
    dimension.bought = 0;
  }
  dev.updateTDCosts();
};

dev.refundEPMult = function() {
  player.epmultUpgrades = 0;
};

dev.refundDilStudies = function() {
  for (const study of GameDatabase.eternity.timeStudies.dilation) {
    if (player.dilation.studies.includes(study.id)) {
      player.dilation.studies.splice(player.dilation.studies.indexOf(study.id), 1);
      console.log(document.getElementById(`removed dilstudy${study.id}`));
      Currency.timeTheorems.add(study.cost);
    }
  }
};

dev.resetDilation = function() {
  player.dilation.dilatedTime = DC.D0;
  player.dilation.tachyonParticles = DC.D0;
  player.dilation.rebuyables[1] = 0;
  player.dilation.rebuyables[2] = 0;
  player.dilation.rebuyables[3] = 0;
  player.dilation.baseTachyonGalaxies = 0;
  player.dilation.totalTachyonGalaxies = 0;
};

// We want to give a large degree of options
// when making a special glyph, so no max-params
// eslint-disable-next-line max-params
dev.giveSpecialGlyph = function(color, symbol, level, rawLevel = level) {
  if (GameCache.glyphInventorySpace.value === 0) return;
  const glyph = GlyphGenerator.randomGlyph({ actualLevel: level, rawLevel });
  glyph.symbol = symbol;
  glyph.color = color;
  Glyphs.addToInventory(glyph);
};

dev.giveGlyph = function(level, rawLevel = level) {
  if (GameCache.glyphInventorySpace.value === 0) return;
  Glyphs.addToInventory(GlyphGenerator.randomGlyph({ actualLevel: level, rawLevel }));
};

dev.giveRealityGlyph = function(level) {
  if (GameCache.glyphInventorySpace.value === 0) return;
  Glyphs.addToInventory(GlyphGenerator.realityGlyph());
};

dev.setCompanionGlyphEP = function(eternityPoints) {
  const glyph = player.reality.glyphs.active
    .concat(player.reality.glyphs.inventory)
    .filter(g => g.type === "companion")[0];
  glyph.strength = rarityToStrength(eternityPoints.max(1).log10() / 1e6);
};

dev.decriminalize = function() {
  SecretAchievement(23).lock();
  EventHub.dispatch(GAME_EVENT.ACHIEVEMENT_UNLOCKED);
};

dev.removeAch = function(name) {
  if (name === "all") {
    const allAchievements = Achievements.all.concat(SecretAchievements.all);
    for (const achievement of allAchievements) achievement.lock();
    return "removed all achievements";
  }
  if (typeof (name) === "number") return Achievement(name).lock();
  if (name.startsWith("r")) return Achievement(parseInt(name.slice(1), 10)).lock();
  if (name.startsWith("s")) return SecretAchievement(parseInt(name.slice(1), 10)).lock();
  return "failed to delete achievement";
};

window.nextNewsMessageId = undefined;

dev.setNextNewsMessage = function(id) {
  nextNewsMessageId = id;
};

dev.implode = function() {
  bigCrunchAnimation();
};

dev.eternify = function() {
  eternityAnimation();
};

dev.dilate = function() {
  animateAndDilate();
};

dev.undilate = function() {
  animateAndUndilate();
};

dev.realize = function() {
  runRealityAnimation();
};

dev.respecPerks = function() {
  player.reality.perkPoints = player.reality.perkPoints.add(player.reality.perks.size);
  player.reality.perks = new Set();
  GameCache.achievementPeriod.invalidate();
  GameCache.buyablePerks.invalidate();
};

export function isDevEnvironment() {
  const href = window.location.href;
  return href.split("//")[1].length > 20 || isLocalEnvironment();
}

export function isLocalEnvironment() {
  const href = window.location.href;
  return href.includes("file") || href.includes("127.0.0.1") || href.includes("localhost");
}

dev.togglePerformanceStats = function() {
  PerformanceStats.toggle();
};

// Buys all perks, will end up buying semi-randomly if not enough pp
dev.buyAllPerks = function() {
  const visited = [];
  const toVisit = [Perk.firstPerk];
  while (toVisit.length > 0) {
    if (player.reality.perkPoints.lt(1)) break;
    const perk = toVisit.shift();
    visited.push(perk);
    toVisit.push(...perk.connectedPerks.filter(p => !visited.includes(p)));
    perk.purchase();
  }
};

// This should help for balancing different glyph types, strong rounding of values is intentional
dev.printResourceTotals = function() {
  console.log(`Antimatter: e${Currency.antimatter.exponent.toPrecision(3)}`);
  console.log(`RM: e${Math.round(MachineHandler.gainedRealityMachines.log10())}`);
  console.log(`Glyph level: ${100 * Math.floor(gainedGlyphLevel().actualLevel / 100 + 0.5)}`);

  console.log(`Tickspeed: e${-Tickspeed.current.exponent.toPrecision(3)}`);
  console.log(`Gamespeed: ${Math.pow(getGameSpeedupFactor(), 1.2).toPrecision(1)}`);
  const aGalaxy = 100 * Math.floor(player.galaxies / 100 + 0.5);
  const rGalaxy = 100 * Math.floor(Replicanti.galaxies.total / 100 + 0.5);
  const dGalaxy = 100 * Math.floor(player.dilation.totalTachyonGalaxies / 100 + 0.5);
  console.log(`Galaxies: ${aGalaxy}+${rGalaxy}+${dGalaxy} (${aGalaxy + rGalaxy + dGalaxy})`);
  console.log(`Tick reduction: e${-Math.round(getTickSpeedMultiplier().log10())}`);

  let ADmults = DC.D1;
  for (let i = 1; i <= 8; i++) {
    ADmults = ADmults.times(AntimatterDimension(i).multiplier);
  }
  console.log(`AD mults: e${ADmults.log10().toPrecision(3)}`);
  let IDmults = DC.D1;
  for (let i = 1; i <= 8; i++) {
    IDmults = IDmults.times(InfinityDimension(i).multiplier);
  }
  console.log(`ID mults: e${IDmults.log10().toPrecision(3)}`);
  let TDmults = DC.D1;
  for (let i = 1; i <= 8; i++) {
    TDmults = TDmults.times(TimeDimension(i).multiplier);
  }
  console.log(`TD mults: e${TDmults.log10().toPrecision(3)}`);
  console.log(`Tickspeed from TD: ${formatWithCommas(Decimal.floor(player.totalTickGained.div(1000).add(0.5)).mul(1000))}`);

  console.log(`Infinities: e${Math.round(player.infinities.log10())}`);
  console.log(`Eternities: e${Math.round(player.eternities.log10())}`);
  console.log(`Replicanti: e${formatWithCommas(1e5 * Math.floor(Replicanti.amount.log10() / 1e5 + 0.5))}`);

  console.log(`TT: e${Math.round(player.timestudy.theorem.log10())}`);
  console.log(`DT: e${Math.round(player.dilation.dilatedTime.log10())}`);
  console.log(`TP: e${Math.round(player.dilation.tachyonParticles.log10())}`);
};

// Temporary balance instrumentation for the Break Infinity long-run tests. The
// snapshots are deliberately kept out of the save so a run can be measured from
// the browser console without changing the player state.
const dominoesTelemetry = {
  active: false,
  checkpoints: [],
  history: [],
  nextCheckpoint: 0,
  run: 0,
  crossedReferenceRate: false,
  lastGalaxyCount: DC.D0,
  lastLoggedPeak: DC.D0,
  eventTarget: {},
};
// Clean A-branch rapid peak from the 5e17 acquisition-state master save.
const DOMINOES_REFERENCE_IP_RATE = new Decimal("1.717e16");

function dominoesTelemetrySnapshot(label) {
  const infinityTime = Time.thisInfinityRealTime;
  const gainedIP = gainedInfinityPoints();
  const baseIP = gainedInfinityPoints(false);
  const currentIPRate = gainedIP.div(infinityTime.totalMinutes.clampMin(0.0005));
  const isIC4Running = InfinityChallenge(4).isRunning;

  return {
    label,
    infinityTime: format(infinityTime.totalSeconds, 3, 3),
    antimatter: format(Currency.antimatter.value, 3, 3),
    baseIP: format(baseIP, 3, 3),
    dividendMultiplier: formatX(DimensionalDominoes.multiplier, 3, 3),
    pendingIP: format(gainedIP, 3, 3),
    currentIPPerMinute: format(currentIPRate, 3, 3),
    referenceRateRatio: format(currentIPRate.div(DOMINOES_REFERENCE_IP_RATE), 3, 3),
    peakIPPerMinute: format(player.records.thisInfinity.bestIPmin, 3, 3),
    peakReferenceRateRatio: format(player.records.thisInfinity.bestIPmin.div(DOMINOES_REFERENCE_IP_RATE), 3, 3),
    peakAtIP: format(player.records.thisInfinity.bestIPminVal, 3, 3),
    infinityPower: format(Currency.infinityPower.value, 3, 3),
    nextDividendThreshold: DimensionalDominoes.hasNextThreshold
      ? format(DimensionalDominoes.nextThreshold, 3, 3)
      : "complete",
    galaxies: format(player.galaxies, 0, 0),
    ic4DimBoosts: isIC4Running ? format(player.challenge.infinity.dimBoosts ?? DC.D0, 0, 0) : "—",
    ic4TickspeedCoefficient: isIC4Running ? format(getIC4TickspeedSoftcapCoefficient(), 3, 3) : "—",
    deepReserve: format(InfinityUpgrade.unspentIPMult.effectOrDefault(DC.D1), 3, 3),
    temporalTenacity: format(BreakInfinityUpgrade.infinityTimeIDMult.effectOrDefault(DC.D1), 3, 3),
    sacrificeMultiplier: format(Sacrifice.totalBoost, 3, 3),
    nextSacrificeMultiplier: format(Sacrifice.nextBoost, 3, 3),
    id5Stability: formatPow(InfinityDimensions.id5Stability, 3, 3),
    achievement75Multiplier: formatX(Achievement(75).effectOrDefault(DC.D1).pow(InfinityDimensions.id5Stability), 3, 3),
  };
}

dev.logDominoesTelemetry = function(label = "manual") {
  const snapshot = dominoesTelemetrySnapshot(label);
  dominoesTelemetry.history.push(snapshot);
  console.log(`[Dominoes telemetry: ${label}]`, snapshot);
  return snapshot;
};

function dominoesTelemetryCell(value) {
  return String(value).replaceAll("|", "\\|");
}

dev.getDominoesTelemetryReport = function() {
  const report = [
    "| Label | Time | AM | Base IP | Dividend | Final IP | Current IP/min | Ref. ratio | Peak IP/min | Peak ref. ratio | Galaxy | IC4 Dim Boosts | IC4 Tickspeed K | Infinity Power | Next Dividend | Deep Reserve | Temporal | Sacrifice | Next Sacrifice | ID5 stability | Ach #75 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...dominoesTelemetry.history.map(snapshot => [
      snapshot.label,
      snapshot.infinityTime,
      snapshot.antimatter,
      snapshot.baseIP,
      snapshot.dividendMultiplier,
      snapshot.pendingIP,
      snapshot.currentIPPerMinute,
      snapshot.referenceRateRatio,
      snapshot.peakIPPerMinute,
      snapshot.peakReferenceRateRatio,
      snapshot.galaxies,
      snapshot.ic4DimBoosts,
      snapshot.ic4TickspeedCoefficient,
      snapshot.infinityPower,
      snapshot.nextDividendThreshold,
      snapshot.deepReserve,
      snapshot.temporalTenacity,
      snapshot.sacrificeMultiplier,
      snapshot.nextSacrificeMultiplier,
      snapshot.id5Stability,
      snapshot.achievement75Multiplier,
    ].map(dominoesTelemetryCell).join(" | ").replace(/^/, "| ").concat(" |")),
  ].join("\n");
  console.log(report);
  return report;
};

dev.copyDominoesTelemetryReport = async function() {
  const report = dev.getDominoesTelemetryReport();
  try {
    await navigator.clipboard.writeText(report);
    console.info("Dominoes telemetry report copied to the clipboard.");
  } catch {
    console.warn("Clipboard access was unavailable; the Markdown report was printed above instead.");
  }
  return report;
};

dev.setDominoesDividendEnabled = function(enabled = true) {
  DimensionalDominoes.setEnabledForTesting(enabled);
  console.info(`Dimensional Dominoes dividend ${enabled ? "enabled" : "disabled"} for this session.`);
};

function resetDominoesTelemetryCheckpoints() {
  const elapsedSeconds = Time.thisInfinityRealTime.totalSeconds.toNumber();
  dominoesTelemetry.nextCheckpoint = dominoesTelemetry.checkpoints
    .findIndex(checkpoint => checkpoint > elapsedSeconds);
  if (dominoesTelemetry.nextCheckpoint === -1) {
    dominoesTelemetry.nextCheckpoint = dominoesTelemetry.checkpoints.length;
  }
}

function logDominoesTelemetryCheckpoints() {
  const elapsedSeconds = Time.thisInfinityRealTime.totalSeconds.toNumber();
  while (dominoesTelemetry.nextCheckpoint < dominoesTelemetry.checkpoints.length &&
    elapsedSeconds >= dominoesTelemetry.checkpoints[dominoesTelemetry.nextCheckpoint]) {
    const checkpoint = dominoesTelemetry.checkpoints[dominoesTelemetry.nextCheckpoint];
    dev.logDominoesTelemetry(`${checkpoint}s checkpoint (run ${dominoesTelemetry.run})`);
    dominoesTelemetry.nextCheckpoint += 1;
  }
}

function resetDominoesTelemetryEvents() {
  dominoesTelemetry.crossedReferenceRate = false;
  dominoesTelemetry.lastGalaxyCount = new Decimal(player.galaxies);
  dominoesTelemetry.lastLoggedPeak = DC.D0;
}

function logDominoesTelemetryEvents() {
  const currentRate = gainedInfinityPoints().div(Time.thisInfinityRealTime.totalMinutes.clampMin(0.0005));
  if (player.galaxies.gt(dominoesTelemetry.lastGalaxyCount)) {
    dominoesTelemetry.lastGalaxyCount = new Decimal(player.galaxies);
    dev.logDominoesTelemetry(`Galaxy ${format(player.galaxies, 0, 0)} reached (run ${dominoesTelemetry.run})`);
  }
  if (!dominoesTelemetry.crossedReferenceRate && currentRate.gte(DOMINOES_REFERENCE_IP_RATE)) {
    dominoesTelemetry.crossedReferenceRate = true;
    dev.logDominoesTelemetry(`Reference IP/min crossed (run ${dominoesTelemetry.run})`);
  }
  const peakRate = player.records.thisInfinity.bestIPmin;
  if (peakRate.gte(DOMINOES_REFERENCE_IP_RATE) && peakRate.gt(dominoesTelemetry.lastLoggedPeak.times(1.1))) {
    dominoesTelemetry.lastLoggedPeak = new Decimal(peakRate);
    dev.logDominoesTelemetry(`New peak above reference (run ${dominoesTelemetry.run})`);
  }
}

dev.stopDominoesTelemetry = function() {
  EventHub.logic.offAll(dominoesTelemetry.eventTarget);
  dominoesTelemetry.active = false;
  console.info("Dominoes telemetry stopped.");
};

dev.startDominoesTelemetry = function(checkpoints = [1, 2, 3, 5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 300, 600]) {
  dev.stopDominoesTelemetry();
  dominoesTelemetry.checkpoints = [...new Set(checkpoints)]
    .filter(checkpoint => Number.isFinite(checkpoint) && checkpoint > 0)
    .sort((left, right) => left - right);
  dominoesTelemetry.history = [];
  dominoesTelemetry.active = true;
  dominoesTelemetry.run = 1;
  resetDominoesTelemetryCheckpoints();
  resetDominoesTelemetryEvents();

  EventHub.logic.on(GAME_EVENT.GAME_TICK_AFTER, () => {
    logDominoesTelemetryCheckpoints();
    logDominoesTelemetryEvents();
  }, dominoesTelemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.BIG_CRUNCH_BEFORE, () => {
    dev.logDominoesTelemetry(`Big Crunch (run ${dominoesTelemetry.run})`);
  }, dominoesTelemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.BIG_CRUNCH_AFTER, () => {
    dominoesTelemetry.run += 1;
    resetDominoesTelemetryCheckpoints();
    resetDominoesTelemetryEvents();
    dev.logDominoesTelemetry(`run ${dominoesTelemetry.run} start`);
  }, dominoesTelemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.SACRIFICE_RESET_AFTER, () => {
    dev.logDominoesTelemetry(`Sacrifice (run ${dominoesTelemetry.run})`);
  }, dominoesTelemetry.eventTarget);

  dev.logDominoesTelemetry(`monitor start (run ${dominoesTelemetry.run})`);
  console.info(`Dominoes telemetry started; checkpoints: ${dominoesTelemetry.checkpoints.join(", ")} seconds.`);
};

// Temporary instrumentation for the IC5 reverse Galaxy-ladder probe. Unlike
// the Dominoes report, this records the state around every Galaxy phase so the
// next frontier requirement can be tuned from the tier which it just unlocked.
const ic5Telemetry = {
  active: false,
  hasStarted: false,
  history: [],
  pendingCheckpoints: [],
  currentBoostBatch: null,
  pendingBoostRecovery: false,
  hasReachedGoal: false,
  eventTarget: {},
};
const IC5_TELEMETRY_CHECKPOINTS = [1, 5, 15, 30, 60, 90, 120];

function ic5TelemetrySeconds() {
  return Time.thisInfinityRealTime.totalSeconds.toNumber();
}

function ic5TelemetrySnapshot(label) {
  const dimensions = AntimatterDimensions.all.map(dimension => ({
    amount: format(dimension.amount, 3, 3),
    bought: format(dimension.bought, 0, 0),
    production: format(dimension.productionPerSecond, 3, 3),
    multiplier: formatX(dimension.multiplier, 3, 3),
    nextCost: format(dimension.cost, 3, 3),
  }));
  const lowestUnlockedTier = IC5Focus.lowestUnlockedTier;
  const boostRequirement = DimBoost.requirement;
  const galaxyRequirement = Galaxy.requirement;
  const galaxyProgress = AntimatterDimension(galaxyRequirement.tier).totalAmount.max(1);

  return {
    label,
    time: format(ic5TelemetrySeconds(), 3, 3),
    antimatter: format(Currency.antimatter.value, 3, 3),
    antimatterPerSecond: format(Currency.antimatter.productionPerSecond, 3, 3),
    galaxies: format(player.galaxies, 0, 0),
    dimensionBoosts: format(DimBoost.totalBoosts, 0, 0),
    boostBatch: ic5Telemetry.currentBoostBatch ?? "",
    frontierBought: format(AntimatterDimension(lowestUnlockedTier).bought, 0, 0),
    frontierAmount: format(AntimatterDimension(lowestUnlockedTier).totalAmount, 3, 3),
    nextBoost: `${format(boostRequirement.amount, 0, 0)} AD ${boostRequirement.tier} purchased`,
    nextGalaxyShortfall: formatX(galaxyRequirement.amount.div(galaxyProgress).max(1), 3, 3),
    unlockedRange: `AD${lowestUnlockedTier}–AD8`,
    purchasedTickspeed: format(player.totalTickBought, 0, 0),
    sacrifice: format(Sacrifice.totalBoost, 3, 3),
    dimensions,
  };
}

dev.logIC5Telemetry = function(label = "manual") {
  const snapshot = ic5TelemetrySnapshot(label);
  ic5Telemetry.history.push(snapshot);
  console.log(`[IC5 telemetry: ${label}]`, snapshot);
  return snapshot;
};

function ic5TelemetryCell(value) {
  return String(value).replaceAll("|", "\\|");
}

function ic5TelemetryRow(values) {
  return `| ${values.map(ic5TelemetryCell).join(" | ")} |`;
}

dev.getIC5TelemetryReport = function() {
  const summary = [
    "| Label | Time | AM | AM/s | Galaxy | Dim Boosts | Boost batch | Unlocked range | Frontier bought | Frontier amount | Next Boost | Next Galaxy shortfall | Purchased Tickspeed | Sacrifice |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: |",
    ...ic5Telemetry.history.map(snapshot => ic5TelemetryRow([
      snapshot.label,
      snapshot.time,
      snapshot.antimatter,
      snapshot.antimatterPerSecond,
      snapshot.galaxies,
      snapshot.dimensionBoosts,
      snapshot.boostBatch,
      snapshot.unlockedRange,
      snapshot.frontierBought,
      snapshot.frontierAmount,
      snapshot.nextBoost,
      snapshot.nextGalaxyShortfall,
      snapshot.purchasedTickspeed,
      snapshot.sacrifice,
    ]),
  ),
  ].join("\n");
  const dimensions = [
    "| Label | AD | Amount | Bought | Production/s | Multiplier | Next cost |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...ic5Telemetry.history.flatMap(snapshot => snapshot.dimensions.map((dimension, index) => ic5TelemetryRow([
      snapshot.label,
      index + 1,
      dimension.amount,
      dimension.bought,
      dimension.production,
      dimension.multiplier,
      dimension.nextCost,
    ]))),
  ].join("\n");
  const report = `${summary}\n\n${dimensions}`;
  console.log(report);
  return report;
};

dev.copyIC5TelemetryReport = async function() {
  const report = dev.getIC5TelemetryReport();
  try {
    await navigator.clipboard.writeText(report);
    console.info("IC5 telemetry report copied to the clipboard.");
  } catch {
    console.warn("Clipboard access was unavailable; the Markdown report was printed above instead.");
  }
  return report;
};

function logPendingIC5TelemetryCheckpoints() {
  if (!ic5Telemetry.hasStarted) return;
  const elapsedSeconds = ic5TelemetrySeconds();
  while (ic5Telemetry.pendingCheckpoints.length > 0 &&
    elapsedSeconds >= ic5Telemetry.pendingCheckpoints[0].at) {
    const checkpoint = ic5Telemetry.pendingCheckpoints.shift();
    dev.logIC5Telemetry(`${checkpoint.phase} +${checkpoint.seconds}s`);
  }
}

function logIC5GoalIfReached() {
  if (!ic5Telemetry.hasStarted || ic5Telemetry.hasReachedGoal || !InfinityChallenge(5).isRunning) return;
  if (!Currency.antimatter.value.gte(InfinityChallenge(5).goal)) return;
  ic5Telemetry.hasReachedGoal = true;
  dev.logIC5Telemetry("IC5 goal reached");
}

function logIC5BoostRecoveryTick() {
  if (!ic5Telemetry.pendingBoostRecovery || !ic5Telemetry.hasStarted) return;
  ic5Telemetry.pendingBoostRecovery = false;
  dev.logIC5Telemetry("Dimension Boost +first productive tick");
}

function startIC5TelemetryIfReady() {
  if (ic5Telemetry.hasStarted || !InfinityChallenge(5).isRunning) return;
  ic5Telemetry.hasStarted = true;
  dev.logIC5Telemetry("IC5 start");
  queueIC5TelemetryCheckpoints(`Galaxy ${format(player.galaxies, 0, 0)}`);
}

function queueIC5TelemetryCheckpoints(phase) {
  const elapsedSeconds = ic5TelemetrySeconds();
  ic5Telemetry.pendingCheckpoints.push(...IC5_TELEMETRY_CHECKPOINTS.map(seconds => ({
    phase,
    seconds,
    at: elapsedSeconds + seconds,
  })));
}

dev.stopIC5Telemetry = function() {
  EventHub.logic.offAll(ic5Telemetry.eventTarget);
  ic5Telemetry.active = false;
  console.info("IC5 telemetry stopped.");
};

dev.startIC5Telemetry = function() {
  dev.stopIC5Telemetry();
  ic5Telemetry.history = [];
  ic5Telemetry.pendingCheckpoints = [];
  ic5Telemetry.currentBoostBatch = null;
  ic5Telemetry.pendingBoostRecovery = false;
  ic5Telemetry.hasReachedGoal = false;
  ic5Telemetry.active = true;
  ic5Telemetry.hasStarted = false;

  EventHub.logic.on(GAME_EVENT.GAME_TICK_AFTER, () => {
    startIC5TelemetryIfReady();
    logPendingIC5TelemetryCheckpoints();
    logIC5GoalIfReached();
    logIC5BoostRecoveryTick();
  }, ic5Telemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.GALAXY_RESET_BEFORE, () => {
    if (!ic5Telemetry.hasStarted) return;
    const nextGalaxy = player.galaxies.add(1);
    dev.logIC5Telemetry(`Galaxy ${format(nextGalaxy, 0, 0)} before`);
  }, ic5Telemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.GALAXY_RESET_AFTER, () => {
    if (!ic5Telemetry.hasStarted) return;
    dev.logIC5Telemetry(`Galaxy ${format(player.galaxies, 0, 0)} +0s`);
    queueIC5TelemetryCheckpoints(`Galaxy ${format(player.galaxies, 0, 0)}`);
  }, ic5Telemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.DIMBOOST_BEFORE, ([bulk]) => {
    // Galaxy resets dispatch the same event with a zero Boost. Galaxy has its
    // own telemetry rows, so retaining this would mislabel reset bookkeeping
    // as a Boost batch.
    if (!ic5Telemetry.hasStarted || Decimal.eq(bulk, 0)) return;
    ic5Telemetry.currentBoostBatch = formatInt(bulk);
    dev.logIC5Telemetry("Dimension Boost before");
  }, ic5Telemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.DIMBOOST_AFTER, ([bulk]) => {
    if (!ic5Telemetry.hasStarted || Decimal.eq(bulk, 0)) return;
    dev.logIC5Telemetry("Dimension Boost +0s");
    ic5Telemetry.currentBoostBatch = null;
    ic5Telemetry.pendingBoostRecovery = true;
  }, ic5Telemetry.eventTarget);
  EventHub.logic.on(GAME_EVENT.BIG_CRUNCH_BEFORE, () => {
    if (!ic5Telemetry.hasStarted) return;
    dev.logIC5Telemetry("Big Crunch");
  }, ic5Telemetry.eventTarget);

  startIC5TelemetryIfReady();
  console.info("IC5 telemetry armed; Galaxy samples: before, +0, +1, +5, +15, +30, +60, +90, +120 seconds.");
};

dev.unlockCelestialQuotes = function(celestial) {
  Quotes[celestial].all.forEach(x => x.show());
};

dev.presentCelestialQuotes = function(celestial) {
  Quotes[celestial].all.forEach(x => x.present());
};

// This doesn't check everything but hopefully it gets some of the more obvious ones.
dev.testReplicantiCode = function(singleId, useDebugger = false) {
  const situationLists = [
    [
      function() {
        player.infinities = DC.E12;
        player.celestials.effarig.unlockBits = 64;
      }
    ],
    [
      function() {
        player.timestudy.studies.push(33);
      }
    ],
    [
      function() {
        player.timestudy.studies.push(62);
      }
    ],
    [
      function() {
        player.timestudy.studies.push(131);
      },
      function() {
        player.timestudy.studies.push(132);
      },
      function() {
        player.timestudy.studies.push(133);
      },
      function() {
        player.timestudy.studies.push(131, 132, 133);
      }
    ],
    [
      function() {
        player.timestudy.studies.push(192);
      }
    ],
    [
      function() {
        player.timestudy.studies.push(213);
      }
    ],
    [
      function() {
        player.timestudy.studies.push(225);
      }
    ],
    [
      function() {
        player.timestudy.studies.push(226);
      }
    ],
    [
      function() {
        player.achievementBits[8] |= 16;
      }
    ],
    [
      function() {
        player.achievementBits[12] |= 8;
      }
    ],
    [
      function() {
        player.achievementBits[12] |= 128;
      }
    ],
    [
      function() {
        player.reality.perks = new Set([32]);
      }
    ],
    [
      function() {
        Autobuyer.replicantiGalaxy.isActive = true;
      }
    ],
    [
      function() {
        Replicanti.galaxies.isPlayerHoldingR = true;
      }
    ],
    [
      function() {
        player.replicanti.boughtGalaxyCap = 100;
      },
      function() {
        player.replicanti.boughtGalaxyCap = 100;
        player.replicanti.galaxies = 50;
      }
    ],
    [
      function() {
        player.reality.upgReqs = (1 << 6);
        player.reality.upgradeBits = 64;
      }
    ]
  ];
  const situationCount = situationLists.map(x => x.length + 1).reduce((x, y) => x * y);
  const resultList = [];
  const runSituation = function(id) {
    Replicanti.galaxies.isPlayerHoldingR = false;
    GameStorage.loadPlayerObject(Player.defaultStart);
    player.infinities = DC.D1;
    player.infinityPoints = DC.E150;
    Replicanti.unlock();
    for (let i = 0; i < situationLists.length; i++) {
      const div = situationLists.slice(0, i).map(x => x.length + 1).reduce((x, y) => x * y, 1);
      // eslint-disable-next-line no-empty-function
      const situation = [() => {}].concat(situationLists[i])[Math.floor(id / div) % (situationLists[i].length + 1)];
      situation();
    }
    function doReplicantiTicks() {
      for (let j = 0; j <= 5; j++) {
        replicantiLoop(Math.pow(10, j));
        resultList.push(Notation.scientific.formatDecimal(Replicanti.amount, 5, 5));
        resultList.push(player.replicanti.galaxies);
        resultList.push(Replicanti.galaxies.total);
      }
    }
    doReplicantiTicks();
    player.antimatter = DC.E309;
    player.records.thisInfinity.maxAM = DC.E309;
    bigCrunchReset();
    doReplicantiTicks();
  };
  if (singleId === undefined) {
    const total = 4000;
    const p = 10007;
    if (total * p < situationCount) {
      throw new Error("Prime p is not large enough to go through all situations.");
    }
    for (let i = 0; i < total; i++) {
      const actual = i * p % situationCount;
      if (i % 100 === 0) {
        console.log(`Considering situation #${i}/${total} (${actual})`);
      }
      runSituation(actual);
    }
  } else {
    runSituation(singleId);
  }
  const hash = sha512_256(resultList.toString());
  console.log(hash);
  if (useDebugger) {
    // eslint-disable-next-line no-debugger
    debugger;
  }
  return hash;
};

dev.testGlyphs = function(config) {
  const glyphLevel = config.glyphLevel || 6500;
  const duration = config.duration || 4000;
  let glyphId = Date.now();
  const save = GameSaveSerializer.serialize(player);
  const makeGlyph = (type, effects) => ({
    type,
    level: glyphLevel,
    strength: 3.5,
    rawLevel: glyphLevel,
    idx: null,
    id: glyphId++,
    effects: makeGlyphEffectBitmask(effects),
  });
  const makeAllEffectGlyph = type => makeGlyph(type, GlyphTypes[type].effects.map(e => e.id));
  const effarigGlyphs = [
    makeGlyph("effarig", ["effarigantimatter", "effarigdimensions", "effarigforgotten", "effarigblackhole"]),
    makeGlyph("effarig", ["effarigantimatter", "effarigdimensions", "effarigforgotten", "effarigachievement"]),
  ];
  function makeCombinationsWithRepeats(count, elements) {
    if (elements.length === 0) return [];
    if (count === 0) return [[]];
    const withoutFirst = makeCombinationsWithRepeats(count, elements.slice(1));
    const withFirst = makeCombinationsWithRepeats(count - 1, elements);
    withFirst.forEach(e => e.push(elements[0]));
    return withFirst.concat(withoutFirst);
  }
  const sets5 = makeCombinationsWithRepeats(5, GlyphInfo.basicGlyphTypes)
    .map(s => s.map(t => makeAllEffectGlyph(t)));
  const sets4 = makeCombinationsWithRepeats(4, GlyphInfo.basicGlyphTypes)
    .map(s => s.map(t => makeAllEffectGlyph(t)));
  const effarigSets = effarigGlyphs.map(g => sets4.map(s => [g].concat(s)));
  const glyphSets = sets5.concat(...effarigSets);
  function equipSet(index) {
    player.reality.glyphs.active = glyphSets[index].map((g, idx) => {
      g.idx = idx;
      return g;
    });
    Glyphs.active = Array.from(player.reality.glyphs.active);
    EventHub.dispatch(GAME_EVENT.GLYPHS_CHANGED);
  }
  function glyphToShortString(glyph) {
    if (glyph.type === "effarig") {
      return effarigGlyphs.findIndex(e => e.id === glyph.id).toString();
    }
    return GLYPH_SYMBOLS[glyph.type];
  }
  function padString(s, length, before = false) {
    if (s.length >= length) return s;
    return before ? (" ").repeat(length - s.length) + s : s + (" ").repeat(length - s.length);
  }
  function finishTrial(index) {
    const done = padString(`${Math.floor(100 * (index + 1) / glyphSets.length)}%`, 4, true);
    const rm = padString(MachineHandler.gainedRealityMachines.toPrecision(2), 9);
    const gl = padString(gainedGlyphLevel().actualLevel, 4);
    const ep = padString(player.eternityPoints.exponent.toString(), 6);
    const ip = padString(player.infinityPoints.exponent.toString(), 8);
    const am = padString(Currency.antimatter.exponent.toString(), 12);
    const dimboosts = DimBoost.purchasedBoosts;
    const galaxies = Replicanti.galaxies.total + player.galaxies + player.dilation.totalTachyonGalaxies;
    const glyphData = glyphSets[index].map(glyphToShortString).sum();
    console.log(`${done} ${glyphData} rm=${rm} gl=${gl} ep=${ep} ip=${ip} am=${am} ` +
      `dimboosts=${dimboosts} galaxies=${galaxies}`);
    GameStorage.offlineEnabled = false;
    GameStorage.import(save);
    if (index < glyphSets.length - 1) {
      setTimeout(runTrial, 100, index + 1);
    }
  }
  function runTrial(index) {
    equipSet(index);
    AutomatorBackend.start();
    setTimeout(finishTrial, duration, index);
  }
  runTrial(0);
};

// May want to make this command in particular publicly known if automator gating is a common complaint post-release
dev.unlockAutomator = function() {
  player.reality.automator.forceUnlock = true;
};

// This bypasses any conflict checking and forces the current save to overwrite the cloud save. This largely exists
// because normal cloud saving checks for a conflict and then always shows a modal if a conflict is found, only actually
// saving if the player says to in the modal. The check can fail if the cloud save is somehow malformed and missing
// props. This can lead to the check always failing, the modal never showing up, and cloud saving never occurring. That
// should in principle only show up in dev, as migrations aren't run on cloud saves, but this allows fixing in case.
dev.forceCloudSave = async function() {
  const save = await Cloud.load();
  const root = GameSaveSerializer.deserialize(save);
  const saveId = GameStorage.currentSlot;
  if (!root.saves) root.saves = [];
  root.saves[saveId] = GameStorage.saves[saveId];
  Cloud.save(saveId);
};

// TODO Figure out if we want to remove this before release
dev.unlockAllCosmeticSets = function() {
  player.reality.glyphs.cosmetics.unlockedFromNG = Object.keys(GameDatabase.reality.glyphCosmeticSets);
};

// You would never guess what these are for
dev.beTests = {}

dev.beTests.speed = function() {
  dev.speedUp = 1e24
}

dev.beTests.consecutiveInfinities = function(amnt) {
  player.infinityPoints = player.infinityPoints.add(gainedInfinityPoints().times(amnt))
  player.infinities = player.infinities.add(gainedInfinities().round())
}

dev.beTests.completeChalleges = {}

dev.beTests.completeChalleges.normal = function() {
  for (let i = 1; i < 13; i++) NormalChallenge(i).complete()
}

dev.beTests.completeChalleges.infinity = function() {
  for (let i = 1; i < 9; i++) InfinityChallenge(i).complete()
}

dev.beTests.completeChalleges.eternity = function () {
  for (let i = 1; i < 13; i++) EternityChallenge(i).completions = 5
}

dev.beTests.completeChalleges.all = function () {
  dev.beTests.completeChalleges.normal()
  dev.beTests.completeChalleges.infinity()
  dev.beTests.completeChalleges.eternity()
}

dev.beTests.nanFuckIteration = function (value, value2) {
  for (const item in value) {
    console.log(value[item])
    console.log(value2[item])
    if (value[item] instanceof Decimal && value2[item] != undefined) {
      if (value2[item].neq(0)) {
        if (value[item].lt(0) || value[item].layer > 8e15)
          value[item] = value2[item]
      } else {
        if (value[item].layer > 8e15)
          value[item] = value2[item]
      }
    }
    if (value[item] instanceof Number && value2[item] != undefined) {
      if (value2[item] == 0) {
        if (value[item] > 1e300) {
          value[item] = value2[item]
        }
      } else {
        if (value[item] > 1e300 || value[item] < 0) {
          value[item] = value2[item]
        }
      }
    }
    if ((value[item] instanceof Object || value[item] instanceof Array) && !(value[item] instanceof Decimal) && value2[item] != undefined)
      value[item] = dev.beTests.nanFuckIteration(value[item], value2[item])
    if (value[item] == undefined  && value2[item] != undefined)
      value[item] = value2[item]
  }
  return value
}

dev.beTests.nanFuck = function () {
  player = dev.beTests.nanFuckIteration(player, Player.defaultStart)
  GameStorage.save()
}

dev.beTests.prepare = function (completeAllChallenges = false) {
  if(completeAllChallenges) dev.beTests.completeChalleges.all()
  else dev.beTests.completeChalleges.normal()

  dev.beTests.consecutiveInfinities(new Decimal("1e350"))
  dev.beTests.speed()
  GameStorage.import("blob")
  Notation.scientific.setAsCurrent()
  Achievement(61).unlock()
}
