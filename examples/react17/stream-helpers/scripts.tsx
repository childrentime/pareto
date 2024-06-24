// import { promiseMap } from "./server.promise";
// import { STREAMING_SERIALIZATION_EVENT } from "./constant";

// export function Scripts() {;
//   const promises = [...promiseMap.values()];
//   const keys = [...promiseMap.keys()];

//   return (
//     <>
//       {promises.map((promise, index) => (
//           <Script promise={promise} path={keys[index]} key={index} />
//       ))}
//     </>
//   );
// }

// export function Script(props: { promise: Promise<any>; path: string }) {
//   const { promise, path } = props;
//   const jsonData = JSON.stringify([path,data]);

//   return (
//     <script
//       suppressHydrationWarning
//       dangerouslySetInnerHTML={{
//         __html: `
//               if (!window.__STREAM_DATA__) {
//                 window.__STREAM_DATA__ = {};
//               }
//               window.__STREAM_DATA__["${path}"] = ${jsonData};
//               const event = new CustomEvent('${STREAMING_SERIALIZATION_EVENT}', {
//                 detail: '${jsonData}'
//               });document.dispatchEvent(event);
//             `,
//       }}
//     />
//   );
// }
