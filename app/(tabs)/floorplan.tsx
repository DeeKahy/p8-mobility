// https://shopify.github.io/react-native-skia/docs/shapes/polygons
// import { Canvas, Points, vec } from "@shopify/react-native-skia";

// const floorPlanData = [
//   [-0.393, -1.099],
//   [-1.866, -1.090],
//   [-1.935, -1.093],
//   [-0.645, -1.095],
// ];

// Scaling factor to make your coordinates visible on the canvas
// const SCALE = 100;
// Optional offset to center them
// const OFFSET_X = 150;
// const OFFSET_Y = 200;

// const PointsDemo = () => {
//   Convert floorPlanData to vec objects
//   const points = floorPlanData.map(([x, y]) =>
//     vec(x * SCALE + OFFSET_X, y * SCALE + OFFSET_Y)
//   );

//   Close the polygon by adding the first point at the end
//   points.push(points[0]);

//   return (
//     <Canvas style={{ flex: 1 }}>
//       <Points
//         points={points}
//         mode="polygon"
//         color="lightblue"
//         style="stroke"
//         strokeWidth={4}
//       />
//     </Canvas>
//   );
// };

// export default PointsDemo;

//Noget som GPT har lavet som virker:
// import { View } from 'react-native';
// import Svg, { Polygon } from 'react-native-svg';

// const floorPlanData = [
//   [-0.393, -1.099],
//   [-1.866, -1.090],
//   [-1.935, -1.093],
//   [-0.645, -1.095],
// ];

// export default function FloorPlan2D() {
//   // Sort points clockwise
//   const cx = floorPlanData.reduce((sum, p) => sum + p[0], 0) / floorPlanData.length;
//   const cy = floorPlanData.reduce((sum, p) => sum + p[1], 0) / floorPlanData.length;
//   const sortedPoints = [...floorPlanData].sort(
//     (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)
//   );

//   // Bounding box for scaling
//   const xs = sortedPoints.map(p => p[0]);
//   const ys = sortedPoints.map(p => p[1]);
//   const minX = Math.min(...xs), maxX = Math.max(...xs);
//   const minY = Math.min(...ys), maxY = Math.max(...ys);

//   const SVG_SIZE = 400;
//   const points = sortedPoints
//     .map(([x, y]) => `${((x - minX) / (maxX - minX)) * (SVG_SIZE - 20) + 10},${((y - minY) / (maxY - minY)) * (SVG_SIZE - 20) + 10}`)
//     .join(' ');

//   return (
//     <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//       <Svg height={SVG_SIZE} width={SVG_SIZE}>
//         <Polygon points={points} fill="lightcoral" stroke="red" strokeWidth="2" />
//       </Svg>
//     </View>
//   );
// }