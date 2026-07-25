import { describe, it, expect } from "vitest";

import { createEmptyOdontogram, FDI_PERMANENT_TOOTH_NUMBERS } from "./createEmptyOdontogram";

describe("FDI_PERMANENT_TOOTH_NUMBERS", () => {
  it("has 32 unique permanent tooth numbers", () => {
    expect(FDI_PERMANENT_TOOTH_NUMBERS).toHaveLength(32);
    expect(new Set(FDI_PERMANENT_TOOTH_NUMBERS).size).toBe(32);
  });

  it("covers all 4 quadrants (11-18, 21-28, 31-38, 41-48)", () => {
    expect(FDI_PERMANENT_TOOTH_NUMBERS).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18,
      21, 22, 23, 24, 25, 26, 27, 28,
      31, 32, 33, 34, 35, 36, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48,
    ]);
  });
});

describe("createEmptyOdontogram", () => {
  it("creates 32 teeth with all faces undefined", () => {
    const teeth = createEmptyOdontogram();

    expect(teeth).toHaveLength(32);
    expect(teeth[0]).toEqual({
      toothNumber: 11,
      faces: {
        mesial: undefined,
        distal: undefined,
        vestibular: undefined,
        palatal: undefined,
        oclusal: undefined,
      },
    });
  });
});
