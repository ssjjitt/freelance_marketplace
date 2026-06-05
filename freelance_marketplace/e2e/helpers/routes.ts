/** HashRouter: маршруты приложения вида `/#/path`. */
export function hashRoute(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/#${normalized}`;
}
