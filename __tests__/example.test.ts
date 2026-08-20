import { describe, expect, it } from "vitest";

/**
 * Example test file demonstrating Vitest usage.
 * This file can be deleted once you have real tests.
 */

describe("Example Test Suite", () => {
  it("should pass a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle async operations", async () => {
    const asyncFn = async () => "hello";
    const result = await asyncFn();
    expect(result).toBe("hello");
  });

  it("should work with objects", () => {
    const obj = { name: "Xylvir", version: "0.1.0" };
    expect(obj).toEqual({ name: "Xylvir", version: "0.1.0" });
    expect(obj).toHaveProperty("name");
  });

  it("should work with arrays", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});

describe("Utility Functions", () => {
  // Example: Testing a simple utility function
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  it("should capitalize first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("world")).toBe("World");
  });

  it("should handle empty strings", () => {
    expect(capitalize("")).toBe("");
  });
});
