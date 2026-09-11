import { afterEach, describe, expect, it } from "vitest";
import {
  createLiveWatchSession,
  deleteLiveWatchSession,
  getLiveWatchSession,
  joinLiveWatchViewer,
  leaveLiveWatchViewer,
  listLiveWatchSessions,
  resetLiveWatchStoreForTests,
  updateLiveWatchSession,
} from "./store";
import type { LiveWatchSnapshot } from "./types";

const snapshot: LiveWatchSnapshot = {
  matchId: "m1",
  modeLabel: "2v2",
  tileSet: "double-nine",
  maxPoints: 100,
  playersAmount: 4,
  isClosed: true,
  gameIndex: 1,
  completedGames: 0,
  teams: [],
  currentSeats: [],
  overallLine: "0-0",
  currentLine: "0-0",
  updatedAt: 0,
  seats: [],
  games: [],
  currentGame: {
    t1Datas: [],
    t1TotalPoints: 0,
    t1Taken: [],
    t2Datas: [],
    t2TotalPoints: 0,
    t2Taken: [],
    t3Datas: [],
    t3TotalPoints: 0,
    t3Taken: [],
    t4Datas: [],
    t4TotalPoints: 0,
    t4Taken: [],
    winner: "none",
    seats: [],
  },
};

afterEach(() => {
  resetLiveWatchStoreForTests();
});

describe("live watch store (memory)", () => {
  it("creates a session that list and get can both see", async () => {
    const created = await createLiveWatchSession({
      matchId: "m1",
      snapshot,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const listed = await listLiveWatchSessions();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(created.session.id);
    const loaded = await getLiveWatchSession(created.session.id);
    expect(loaded?.secret).toBe(created.session.secret);
  });

  it("rejects snapshot updates with the wrong secret", async () => {
    const created = await createLiveWatchSession({
      matchId: "m1",
      snapshot,
    });
    if (!created.ok) throw new Error("create failed");
    const denied = await updateLiveWatchSession(
      created.session.id,
      "nope",
      snapshot
    );
    expect(denied).toEqual({ ok: false, error: "unauthorized" });
    const ok = await updateLiveWatchSession(
      created.session.id,
      created.session.secret,
      { ...snapshot, overallLine: "1-0" }
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.session.snapshot.overallLine).toBe("1-0");
  });

  it("joins a viewer without dropping the snapshot", async () => {
    const created = await createLiveWatchSession({
      matchId: "m1",
      snapshot,
    });
    if (!created.ok) throw new Error("create failed");
    const joined = await joinLiveWatchViewer(created.session.id);
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.session.viewers).toHaveLength(1);
    const loaded = await getLiveWatchSession(created.session.id);
    expect(loaded?.snapshot.matchId).toBe("m1");
    expect(loaded?.viewers).toHaveLength(1);
  });

  it("assigns names and sequential join order, and does not reuse order", async () => {
    const created = await createLiveWatchSession({
      matchId: "m1",
      snapshot,
    });
    if (!created.ok) throw new Error("create failed");
    const first = await joinLiveWatchViewer(created.session.id, {
      displayName: "Lolo",
    });
    const second = await joinLiveWatchViewer(created.session.id);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.viewer.displayName).toBe("Lolo");
    expect(first.viewer.joinOrder).toBe(1);
    expect(second.viewer.joinOrder).toBe(2);
    expect(second.viewer.displayName.length).toBeGreaterThan(0);
    expect(second.viewer.displayName).not.toBe("Lolo");

    await leaveLiveWatchViewer(created.session.id, first.viewer.id);
    const third = await joinLiveWatchViewer(created.session.id, {
      displayName: "Tita",
    });
    if (!third.ok) throw new Error("third join failed");
    expect(third.viewer.joinOrder).toBe(3);
    const loaded = await getLiveWatchSession(created.session.id);
    expect(
      loaded?.viewers.map((v) => v.joinOrder).sort((a, b) => a - b)
    ).toEqual([2, 3]);
  });

  it("deletes a share so get and list go empty", async () => {
    const created = await createLiveWatchSession({
      matchId: "m1",
      snapshot,
    });
    if (!created.ok) throw new Error("create failed");
    const removed = await deleteLiveWatchSession(created.session.id, undefined, {
      admin: true,
    });
    expect(removed).toBe(true);
    expect(await getLiveWatchSession(created.session.id)).toBeNull();
    expect(await listLiveWatchSessions()).toEqual([]);
  });
});
