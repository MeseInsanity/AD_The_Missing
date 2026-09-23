import { DC } from "../../constants";

// Placeholder for the Fragment system.
export const Fragments = {
  galaxyPower: {
    effect: () => DC.D1
  },
  infinityPowerConversion: {
    // Starts deliberately low in Pre-Break; Fragments will raise this later.
    effect: () => DC.D0_01.times(2)
  }
};
