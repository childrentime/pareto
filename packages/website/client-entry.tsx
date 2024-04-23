import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

const startApp = (Page: () => JSX.Element) => {
  const root = document.getElementById("main") as HTMLElement;
  hydrateRoot(
    root,
    <StrictMode>
      <Page />
    </StrictMode>
  );
};
export { startApp };
