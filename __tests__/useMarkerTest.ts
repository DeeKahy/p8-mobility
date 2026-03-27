import { act, renderHook } from "@testing-library/react-native";

import { useMarkers } from "../hooks/useMarkers";

jest.mock("../context/LoggerContext", () => ({
  useLogger: () => ({
    debug: jest.fn(),
  }),
}));

describe("useMarkers", () => {
  test("adds a marker", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(10, 20, ["img1"]);
    });

    expect(result.current.markers.length).toBe(1);
    expect(result.current.markers[0].x).toBe(10);
    expect(result.current.markers[0].photos).toEqual(["img1"]);
  });

  test("clears markers", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(10, 20, []);
      result.current.clearMarkers();
    });

    expect(result.current.markers.length).toBe(0);
  });

  test("adds photos without duplicates", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(0, 0, ["a"]);
    });
    const id = result.current.markers[0].id;

    act(() => {
      result.current.addPhotos(id!, ["a", "b"]);
    });

    expect(result.current.markers[0].photos).toEqual(["a", "b"]);
  });

  test("removes a photo", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(0, 0, ["a", "b"]);
    });
    const id = result.current.markers[0].id;

    act(() => {
      result.current.removePhoto(id!, "a");
    });

    expect(result.current.markers[0].photos).toEqual(["b"]);
  });

  test("removing last photo deletes marker", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(0, 0, ["a"]);
    });
    const id = result.current.markers[0].id;

    act(() => {
      result.current.removePhoto(id!, "a");
    });

    expect(result.current.markers.length).toBe(0);
  });

  test("deleteMarker removes marker", () => {
    const { result } = renderHook(() => useMarkers());
    act(() => {
      result.current.addMarker(0, 0, []);
    });
    const id = result.current.markers[0].id;

    act(() => {
      result.current.deleteMarker(id!);
    });

    expect(result.current.markers.length).toBe(0);
  });

  test("editMarker updates marker", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(0, 0, []);
    });
    const id = result.current.markers[0].id;

    act(() => {
      result.current.editMarker(id!, (old) => ({
        ...old,
        x: 100,
      }));
    });

    expect(result.current.markers[0].x).toBe(100);
  });

  test("editMarker throws if marker not found", () => {
    const { result } = renderHook(() => useMarkers());

    expect(() => {
      act(() => {
        result.current.editMarker("invalid", (m) => m);
      });
    }).toThrow(RangeError);
  });

  test("tryGetMarker returns closest marker", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(10, 10, []);
      result.current.addMarker(100, 100, []);
    });

    const found = result.current.tryGetMarker(12, 12);

    expect(found).not.toBeNull();
    expect(found?.x).toBe(10);
  });

  test("tryGetMarker returns null if none nearby", () => {
    const { result } = renderHook(() => useMarkers());

    act(() => {
      result.current.addMarker(100, 100, []);
    });

    const found = result.current.tryGetMarker(0, 0);

    expect(found).toBeNull();
  });
});
