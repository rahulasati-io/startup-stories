export const SIDEBAR_IMAGE_WIDTHS = [88, 176, 264] as const;
export const SIDEBAR_IMAGE_QUALITY = 65;

export function sidebarImageUrl(src: string, width: number) {
  const size = SIDEBAR_IMAGE_WIDTHS.find(value => value >= width) ?? 264;
  if (src.startsWith('/api/article-thumbnail/')) {
    const url = new URL(src, 'https://misterstory.in');
    url.searchParams.set('variant', 'sidebar');
    url.searchParams.set('width', String(size));
    return `${url.pathname}${url.search}`;
  }
  if (!src.startsWith('https://cdn.sanity.io/images/')) return src;
  const url = new URL(src);
  const previousWidth = Number(url.searchParams.get('w'));
  const previousHeight = Number(url.searchParams.get('h'));
  url.searchParams.set('w', String(size));
  if (previousWidth && previousHeight) {
    url.searchParams.set('h', String(Math.max(1, Math.round(size * previousHeight / previousWidth))));
  }
  if (!url.searchParams.has('fit')) url.searchParams.set('fit', previousHeight ? 'min' : 'max');
  url.searchParams.set('auto', 'format');
  url.searchParams.set('q', String(SIDEBAR_IMAGE_QUALITY));
  return url.href;
}

export function sidebarImageProps(src: string) {
  const canResize = src.startsWith('https://cdn.sanity.io/images/') || src.startsWith('/api/article-thumbnail/');
  return {
    src: sidebarImageUrl(src, 88),
    srcSet: canResize ? SIDEBAR_IMAGE_WIDTHS.map(width => `${sidebarImageUrl(src, width)} ${width}w`).join(', ') : undefined,
  };
}

export function generatedThumbnailSize(requestUrl: string) {
  const params = new URL(requestUrl).searchParams;
  if (params.get('variant') !== 'sidebar') return {width: 1200, height: 675};
  const requested = Number(params.get('width'));
  const width = SIDEBAR_IMAGE_WIDTHS.find(size => size === requested) ?? 176;
  return {width, height: Math.round(width * 675 / 1200)};
}
