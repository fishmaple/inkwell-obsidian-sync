import assert from "node:assert/strict";
import test from "node:test";
import { BUSINESS_SERVER_HOST, hostForServerKind, migrateLegacyHost, resolveStoredServerChoice, serverKindForHost } from "./src/server-mode";

test("an empty host means no server has been chosen", () => {
  assert.equal(serverKindForHost(""), "");
  assert.equal(serverKindForHost("   "), "");
});

test("the business host is recognised with a path or trailing slash", () => {
  assert.equal(serverKindForHost(BUSINESS_SERVER_HOST), "business");
  assert.equal(serverKindForHost("https://inkwell.fishmaple.cn/"), "business");
  assert.equal(serverKindForHost("https://inkwell.fishmaple.cn/login"), "business");
});

test("other hosts count as self hosted", () => {
  assert.equal(serverKindForHost("https://e2e.fishmaple.cn"), "self_hosted");
  assert.equal(serverKindForHost("sync.example.com"), "self_hosted");
});

test("only the business kind overrides the saved self-hosted address", () => {
  assert.equal(hostForServerKind("business", "https://mine.example"), BUSINESS_SERVER_HOST);
  assert.equal(hostForServerKind("self_hosted", " https://mine.example "), "https://mine.example");
});

test("logged-in installs keep the old default, new installs get no default", () => {
  assert.equal(migrateLegacyHost("", true), "https://e2e.fishmaple.cn");
  assert.equal(migrateLegacyHost("", false), "");
  assert.equal(migrateLegacyHost("https://mine.example", true), "https://mine.example");
});

test("stored choices survive a reload and empty self-hosted hosts still render", () => {
  const fresh = resolveStoredServerChoice({ host: "", hasLogin: false });
  assert.deepEqual(fresh, { host: BUSINESS_SERVER_HOST, serverKind: "business", selfHostedHost: "" });

  const emptySelf = resolveStoredServerChoice({ host: "", serverKind: "self_hosted", hasLogin: false });
  assert.deepEqual(emptySelf, { host: "", serverKind: "self_hosted", selfHostedHost: "" });

  const business = resolveStoredServerChoice({ host: "", serverKind: "business", hasLogin: false });
  assert.deepEqual(business, { host: BUSINESS_SERVER_HOST, serverKind: "business", selfHostedHost: "" });

  const businessHostWins = resolveStoredServerChoice({ host: "https://inkwell.fishmaple.cn", serverKind: "self_hosted", hasLogin: true });
  assert.equal(businessHostWins.serverKind, "business");
  assert.equal(businessHostWins.host, BUSINESS_SERVER_HOST);
});

test("legacy logins are migrated to the old default as self hosted", () => {
  const migrated = resolveStoredServerChoice({ host: "", hasLogin: true });
  assert.deepEqual(migrated, {
    host: "https://e2e.fishmaple.cn",
    serverKind: "self_hosted",
    selfHostedHost: "https://e2e.fishmaple.cn",
  });
});
