export default function Head() {
  return (
    <>
      <title>Pareto — Lightweight React SSR Framework</title>
      <meta
        name="description"
        content="SSR, streaming, file-based routing, state management — everything you need, nothing you don't."
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('pareto-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
        }}
      />
    </>
  )
}
