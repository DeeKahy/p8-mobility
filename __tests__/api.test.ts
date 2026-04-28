import { FloorplanImageRecord } from "../utils/types";

type ApiModule = typeof import("../utils/api");

const TEST_LOCAL_SERVER = true;
const LOCAL_API_BASE_URL = "http://127.0.0.1:5000/api";
const PROD_API_BASE_URL = "http://130.225.39.166:5000/api";
const testUserName = `api-test-user-${Date.now()}`;
const testApiBaseUrl = TEST_LOCAL_SERVER
  ? LOCAL_API_BASE_URL
  : PROD_API_BASE_URL;

const floorplanImageRecord: FloorplanImageRecord = {
  floorplans: [
    {
      id: "floorplan-1",
      imageUri: "file:///test/floorplan-1.png",
      imageName: "Ground Floor",
      createdAt: "2026-04-21T10:00:00.000Z",
    },
    {
      id: "floorplan-2",
      imageUri: "file:///test/floorplan-2.png",
      imageName: "First Floor",
      createdAt: "2026-04-21T10:05:00.000Z",
    },
  ],
};

const floorplanMarkers = [
  {
    id: "marker-1",
    x: 10,
    y: 20,
    photos: [],
  },
  {
    id: "marker-2",
    x: 30,
    y: 40,
    photos: [],
  },
];

function expectCreatedAt(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(value).not.toBe("");
}

function markerCreatedAt(marker: unknown): string {
  return (marker as { createdAt: string }).createdAt;
}

describe("utils/api real server integration", () => {
  let api: ApiModule;

  beforeAll(async () => {
    process.env.P8_API_USER = testUserName;
    process.env.P8_API_BASE_URL = testApiBaseUrl;
    jest.resetModules();
    api = require("../utils/api") as ApiModule;
  });

  beforeEach(async () => {
    await api.resetUserData();
  });

  afterAll(async () => {
    await api.resetUserData();
    delete process.env.P8_API_USER;
    delete process.env.P8_API_BASE_URL;
  });

  it("posts, gets and deletes one floorplan on the real server", async () => {
    await api.createFloorplanImage(floorplanImageRecord.floorplans[0]);
    await api.createFloorplanImage(floorplanImageRecord.floorplans[1]);

    const savedFloorplanRecord = await api.getFloorplanImageRecord();

    expect(savedFloorplanRecord.floorplans).toHaveLength(2);
    expect(savedFloorplanRecord.floorplans[0]).toMatchObject({
      id: "floorplan-1",
      imageUri: "file:///test/floorplan-1.png",
      imageName: "Ground Floor",
    });
    expect(savedFloorplanRecord.floorplans[1]).toMatchObject({
      id: "floorplan-2",
      imageUri: "file:///test/floorplan-2.png",
      imageName: "First Floor",
    });
    expectCreatedAt(savedFloorplanRecord.floorplans[0].createdAt);
    expectCreatedAt(savedFloorplanRecord.floorplans[1].createdAt);

    await api.deleteFloorplanImageRecord("floorplan-1");

    const floorplanRecordAfterDelete = await api.getFloorplanImageRecord();

    expect(floorplanRecordAfterDelete.floorplans).toHaveLength(1);
    expect(floorplanRecordAfterDelete.floorplans[0]).toMatchObject({
      id: "floorplan-2",
      imageUri: "file:///test/floorplan-2.png",
      imageName: "First Floor",
    });
    expectCreatedAt(floorplanRecordAfterDelete.floorplans[0].createdAt);
  }, 30000);

  it("posts, gets and deletes markers for one floorplan on the real server", async () => {
    await api.createFloorplanImage(floorplanImageRecord.floorplans[0]);
    await api.createFloorplanMarker("floorplan-1", floorplanMarkers[0]);
    await api.createFloorplanMarker("floorplan-1", floorplanMarkers[1]);

    const savedMarkers = await api.getFloorplanMarkers("floorplan-1");

    expect(savedMarkers).toHaveLength(2);
    expect(savedMarkers[0]).toMatchObject({
      id: "marker-1",
      x: 10,
      y: 20,
      photos: [],
    });
    expect(savedMarkers[1]).toMatchObject({
      id: "marker-2",
      x: 30,
      y: 40,
      photos: [],
    });
    expectCreatedAt(markerCreatedAt(savedMarkers[0]));
    expectCreatedAt(markerCreatedAt(savedMarkers[1]));

    await api.deleteFloorplanMarker("floorplan-1", "marker-1");

    await expect(api.getFloorplanMarkers("floorplan-1")).resolves.toEqual([
      expect.objectContaining({
        id: "marker-2",
        x: 30,
        y: 40,
        photos: [],
      }),
    ]);
  }, 30000);

  it("deletes all markers when the floorplan is deleted", async () => {
    await api.createFloorplanImage(floorplanImageRecord.floorplans[0]);
    await api.createFloorplanMarker("floorplan-1", floorplanMarkers[0]);

    await api.deleteFloorplanImageRecord("floorplan-1");

    await expect(api.getFloorplanImageRecord()).resolves.toEqual({
      floorplans: [],
    });

    await expect(api.getFloorplanMarkers("floorplan-1")).rejects.toThrow(
      "floorplan not found"
    );
  }, 30000);

  it("updates only marker coordinates on the real server", async () => {
    await api.createFloorplanImage(floorplanImageRecord.floorplans[0]);
    await api.createFloorplanMarker("floorplan-1", floorplanMarkers[0]);
    await api.createFloorplanMarker("floorplan-1", floorplanMarkers[1]);

    await api.updateFloorplanMarkerCoordinates("floorplan-1", {
      id: "marker-1",
      x: 99,
      y: 88,
      photos: [],
    });

    const savedMarkers = await api.getFloorplanMarkers("floorplan-1");

    expect(savedMarkers).toHaveLength(2);
    expect(savedMarkers[0]).toMatchObject({
      id: "marker-1",
      x: 99,
      y: 88,
      photos: [],
    });
    expect(savedMarkers[1]).toMatchObject({
      id: "marker-2",
      x: 30,
      y: 40,
      photos: [],
    });
    expectCreatedAt(markerCreatedAt(savedMarkers[0]));
    expectCreatedAt(markerCreatedAt(savedMarkers[1]));
  }, 30000);
});
