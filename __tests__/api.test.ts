import {
  FloorplanImageRecord,
  FloorplanMarkerCollectionRecord,
} from "../utils/types";

type ApiModule = typeof import("../utils/api");

const testUserName = `api-test-user-${Date.now()}`;

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

const floorplanMarkerCollectionRecord: FloorplanMarkerCollectionRecord = {
  collections: [
    {
      floorplanId: "floorplan-1",
      markers: [
        {
          id: "marker-1",
          x: 12,
          y: 34,
          photos: [
            {
              photoUri: "file:///test/photo-1.jpg",
              dateTaken: "2026-04-21T10:10:00.000Z",
              pictureName: "Pipe leak",
              areaGroup: "Basement",
              description: "Water around the pipe",
            },
          ],
        },
      ],
    },
  ],
};

describe("utils/api real server integration", () => {
  let api: ApiModule;

  beforeAll(async () => {
    process.env.P8_API_USER = testUserName;
    jest.resetModules();
    api = require("../utils/api") as ApiModule;
  });

  beforeEach(async () => {
    await api.saveFloorplanImageRecord({ floorplans: [] });
    await api.saveFloorplanMarkerCollectionRecord({ collections: [] });
  });

  afterAll(async () => {
    await api.saveFloorplanImageRecord({ floorplans: [] });
    await api.saveFloorplanMarkerCollectionRecord({ collections: [] });
    delete process.env.P8_API_USER;
  });

  it("posts, gets and deletes one floorplan on the real server", async () => {
    await api.saveFloorplanImageRecord(floorplanImageRecord);

    await expect(api.getFloorplanImageRecord()).resolves.toEqual(
      floorplanImageRecord
    );



    await api.deleteFloorplanImageRecord("floorplan-1");

    await expect(api.getFloorplanImageRecord()).resolves.toEqual({
      floorplans: [floorplanImageRecord.floorplans[1]],
    });
  }, 30000);


});
