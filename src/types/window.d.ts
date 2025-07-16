// // This file extends the global Window interface to include the kakao object
// // The actual types are provided by the Kakao Maps SDK

// declare global {
//   interface Window {
//     kakao: {
//       maps: {
//         // Core
//         Map: any;
//         LatLng: any;
//         LatLngBounds: any;

//         // Controls
//         ZoomControl: any;
//         MapTypeControl: any;

//         // Drawing
//         Marker: any;
//         MarkerImage: any;
//         Polyline: any;
//         Rectangle: any;
//         Circle: any;
//         Ellipse: any;
//         Polygon: any;

//         // Services
//         services: any;

//         // Event
//         event: {
//           addListener: (target: any, type: string, callback: () => void) => void;
//           removeListener: (target: any, type: string, callback: () => void) => void;
//           trigger: (target: any, type: string) => void;
//         };

//         // Utility
//         Point: any;
//         Size: any;

//         // Loading
//         load: (callback: () => void) => void;
//       };
//     };
//   }
// }
