import { describe, expect, it } from "vitest";
import { colToX, gridCols, gridRows, normalizeStage, rowToY } from "@/lib/gridUtils";
import { DEFAULT_STAGE } from "@/lib/constants";

describe("gridUtils", () => {
  it("clamps stage dimensions to safe defaults", () => {
    const stage = normalizeStage({
      bamiriHalfWidth: 999,
      bamiriDepth: -5,
      scaleW: NaN,
    });
    expect(stage.bamiriHalfWidth).toBeLessThan(999);
    expect(stage.bamiriDepth).toBeGreaterThanOrEqual(0);
    expect(stage.scaleW).toBe(DEFAULT_STAGE.scaleW);
  });

  it("computes grid size from half width and depth", () => {
    expect(gridCols(2)).toBe(5);
    expect(gridRows(3)).toBe(4);
  });

  it("maps grid coordinates to stage percentages", () => {
    expect(colToX(0, 1)).toBeGreaterThan(0);
    expect(colToX(0, 1)).toBeLessThan(100);
    expect(rowToY(0, 2)).toBeGreaterThan(rowToY(2, 2));
  });
});
