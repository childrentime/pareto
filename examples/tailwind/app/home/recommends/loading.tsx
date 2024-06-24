export const RecommendsSkeleton = () => {
  const feeds = Array.from({ length: 5 }).fill(0)

  return (
    <div className="mt-5">
      <div className="text-black">Recommends</div>
      <div className="mt-3">
        {feeds.map((_item, index) => (
          <div
            className="flex flex-col justify-start items-center bg-slate-400 p-3 mt-4 first:mt-0"
            key={index}
            style={{
              width: 335,
              height: 100,
              flexShrink: 0,
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}
