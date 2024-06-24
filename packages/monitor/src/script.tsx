const pageStart = `
  (function (window) {
    const tm = (window.__TIME_METRICS__ = window.__TIME_METRICS__ || []);
    tm.push(["ps", +new Date()]);
    const requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.setTimeout;
    requestAnimationFrame(function () {
      tm.push(["fraf", +new Date()]);
    });
  })(window);
  (function () {
    if ("PerformanceLongTaskTiming" in window) {
      var g = (window.__tti = { e: [] });
      g.o = new PerformanceObserver(function (l) {
        g.e = g.e.concat(l.getEntries());
      });
      g.o.observe({ entryTypes: ["longtask"] });
    }
  })();
`

const firstPaint = `
  (function (window) {
    const tm = (window.__TIME_METRICS__ = window.__TIME_METRICS__ || []);
    tm.push(["fp", +new Date()]);

    document.addEventListener("DOMContentLoaded", function () {
      tm.push(["dr", +new Date()]);
    });

    window.addEventListener("load", function () {
      tm.push(["ld", +new Date()]);
    });
  })(window);`

const firstScreen = `
  (function (window, document) {
      const tm = (window.__TIME_METRICS__ = window.__TIME_METRICS__ || []);
      const key = 'fsn';

      let latestTime = +new Date();
      tm.push([key, latestTime]);
  })(window, document);`

export const PageStart = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: pageStart,
    }}
  />
)

export const FirstPaint = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: firstPaint,
    }}
  />
)

export const FirstScreen = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: firstScreen,
    }}
  />
)
