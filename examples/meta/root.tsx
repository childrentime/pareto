import { Helmet, ParetoPage, Scripts } from "@pareto/core";
import serializeJavascript from "serialize-javascript";

interface AppProps {
  Page: ParetoPage
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
        <Helmet>
          <title>My Pareto App</title>
        </Helmet>
        {props.Links.map((Link) => Link)}
      </head>
      <body>
        <div id="main">
          <props.Page initialData={props.initialData || {}} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__INITIAL_DATA__ = ${serializeJavascript(
                props.initialData,
                { isJSON: true }
              )};`,
            }}
          />
          {props.Scripts.map((Script) => Script)}
          <Scripts/>
        </div>
      </body>
    </html>
  );
}
