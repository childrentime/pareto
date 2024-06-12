import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import ttiPolyfill from "tti-polyfill";

export function reportWebVitals() {
  const addToQueue = (metric) => {
    if(!window["__WEB_VITALS__"]){
      window["__WEB_VITALS__"] = [];
    }
    window["__WEB_VITALS__"].push([metric.name, metric.value]);
  };

  onCLS(addToQueue);
  onFCP(addToQueue);
  onLCP(addToQueue);
  onTTFB(addToQueue);
  onINP(addToQueue);

  ttiPolyfill.getFirstConsistentlyInteractive({}).then((ttid) => {
    if(!window["__WEB_VITALS__"]){
      window["__WEB_VITALS__"] = [];
    }

    window["__WEB_VITALS__"].push(["TTI", ttid]);
});
}
