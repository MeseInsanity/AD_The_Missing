export const jStudyIds = Object.freeze({
  "11j": 114,
  "12j": 113,
  "13j": 112,
  "21j": 152,
  "22j": 153,
  "23j": 154,
  "31j": 155,
  "32j": 156,
  "41j": 62
});

export function normalizeJStudyIds(input) {
  if (/\d+j\s*-\s*\d|\d\s*-\s*\d+j/iu.test(input)) return input;
  return input.replace(/\b(?:11|12|13|21|22|23|31|32|41)j\b/giu,
    match => String(jStudyIds[match.toLowerCase()]));
}
