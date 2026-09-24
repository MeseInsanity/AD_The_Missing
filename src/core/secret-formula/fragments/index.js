import { DC } from "../../constants";

// Placeholder for the Fragment system.
export const Fragments = {
  galaxyPower: {
    effect: () => DC.D1
  },
  fastestInfinitySoftcap: {
    // The base value keeps the default fastest-Infinity softcap. Future Fragments move its start point lower.
    effect: () => DC.D1
  },
  universeGlitchFrequency: {
    // The base value preserves the temporary playtest cadence. Future Fragment totals increase this value.
    effect: () => DC.D1
  },
  infinityPowerConversion: {
    // Starts deliberately low in Pre-Break; Fragments will raise this later.
    effect: () => DC.D0_01.times(2)
  }
};
