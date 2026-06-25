import { describe, it, expect } from "vitest";
import { parseClientOriginsFromEnv } from "./env";

describe("parseClientOriginsFromEnv", () => {
  it("defaults to localhost when unset", () => {
    expect(parseClientOriginsFromEnv({})).toEqual(["http://localhost:3000"]);
  });

  it("reads CLIENT_ORIGINS comma list", () => {
    const origins = parseClientOriginsFromEnv({
      CLIENT_ORIGINS: "https://a.com, https://b.com ",
    });
    expect(origins).toEqual([
      "https://a.com",
      "https://b.com",
      "https://www.a.com",
      "https://www.b.com",
    ]);
  });

  it("adds www and apex variants for a single origin", () => {
    expect(
      parseClientOriginsFromEnv({
        CLIENT_ORIGINS: "https://krish.vu",
      })
    ).toEqual(["https://krish.vu", "https://www.krish.vu"]);
  });

  it("uses CORS_ORIGINS when CLIENT_ORIGINS missing", () => {
    expect(
      parseClientOriginsFromEnv({ CORS_ORIGINS: "https://only.cors" })
    ).toEqual(["https://only.cors", "https://www.only.cors"]);
  });

  it("CLIENT_ORIGINS wins over CORS_ORIGINS", () => {
    expect(
      parseClientOriginsFromEnv({
        CLIENT_ORIGINS: "https://primary.com",
        CORS_ORIGINS: "https://ignored.com",
      })
    ).toEqual(["https://primary.com", "https://www.primary.com"]);
  });
});
