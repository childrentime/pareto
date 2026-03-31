export function loader() {
  return Response.json({
    timestamp: new Date().toISOString(),
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      key: `item-${i + 1}`,
      value: Math.random(),
    })),
  })
}
