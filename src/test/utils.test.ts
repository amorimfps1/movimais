import { describe, it, expect } from "vitest";
import { formatDateToBR } from "@/lib/utils";

describe("utils - formatDateToBR", () => {
  it("formats ISO date string (YYYY-MM-DD)", () => {
    expect(formatDateToBR("2026-08-26")).toBe("26/08/2026");
  });

  it("formats ISO timestamp string with timezone (YYYY-MM-DDTHH:mm:ss.sssZ)", () => {
    expect(formatDateToBR("2026-08-26T00:00:00.000Z")).toBe("26/08/2026");
  });

  it("formats Date object", () => {
    const date = new Date(2026, 7, 26); // August is month 7 (0-indexed)
    expect(formatDateToBR(date)).toBe("26/08/2026");
  });

  it("returns already formatted DD/MM/YYYY as-is", () => {
    expect(formatDateToBR("26/08/2026")).toBe("26/08/2026");
  });

  it("returns fallback '—' for invalid, null or empty values", () => {
    expect(formatDateToBR(null)).toBe("—");
    expect(formatDateToBR(undefined)).toBe("—");
    expect(formatDateToBR("")).toBe("—");
    expect(formatDateToBR("   ")).toBe("—");
    expect(formatDateToBR("invalid-date-string")).toBe("—");
  });
});
