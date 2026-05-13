import { describe, it, expect, vi } from "vitest";
import {
  parseClientOriginsFromEnv,
  createCorsOriginValidator,
} from "./env";

describe("parseClientOriginsFromEnv", () => {
  it("defaults to localhost when unset", () => {
    expect(parseClientOriginsFromEnv({})).toEqual(["http://localhost:3000"]);
  });

  it("reads CLIENT_ORIGINS comma list", () => {
    const origins = parseClientOriginsFromEnv({
      CLIENT_ORIGINS: "https://a.com, https://b.com ",
    });
    expect(origins).toEqual(["https://a.com", "https://b.com"]);
  });

  it("uses CORS_ORIGINS when CLIENT_ORIGINS missing", () => {
    expect(
      parseClientOriginsFromEnv({ CORS_ORIGINS: "https://only.cors" })
    ).toEqual(["https://only.cors"]);
  });

  it("CLIENT_ORIGINS wins over CORS_ORIGINS", () => {
    expect(
      parseClientOriginsFromEnv({
        CLIENT_ORIGINS: "https://primary.com",
        CORS_ORIGINS: "https://ignored.com",
      })
    ).toEqual(["https://primary.com"]);
  });
});

describe("createCorsOriginValidator", () => {
  it("allows missing Origin", () => {
    const cb = vi.fn();
    createCorsOriginValidator(["https://x.com"])(undefined, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("allows listed Origin", () => {
    const cb = vi.fn();
    createCorsOriginValidator(["https://x.com"])("https://x.com", cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("rejects unlisted Origin", () => {
    const cb = vi.fn();
    createCorsOriginValidator(["https://x.com"])("https://evil.com", cb);
    expect(cb).toHaveBeenCalledWith(null, false);
  });
});
