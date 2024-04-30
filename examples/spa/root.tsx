import { ParetoPage, Scripts } from "@pareto/core";
import serializeJavascript from "serialize-javascript";

interface AppProps {
  Page: ParetoPage | null;
  Links: JSX.Element[];
  Scripts: JSX.Element[];
  initialData?: Record<string, any>;
}

export default function App(props: AppProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {props.Links.map((Link) => Link)}
      </head>
      <body>
        <div id="main">
          {props.Page && <props.Page initialData={props.initialData || {}} />}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL_DATA__ = ${serializeJavascript(
              props.initialData,
              { isJSON: true }
            )};`,
          }}
        />
        {props.Scripts.map((Script) => Script)}
        <Scripts />
      </body>
    </html>
  );
}
