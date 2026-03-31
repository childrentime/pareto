import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/home.tsx'),
  route('/data', './routes/data.tsx'),
  route('/stream', './routes/stream.tsx'),
  route('/api/data', './routes/api-data.ts'),
] satisfies RouteConfig
