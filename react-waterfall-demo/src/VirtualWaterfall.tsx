import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface VirtualWaterfallItemSpace<T = any> {
  index: number;
  item: T;
  column: number;
  top: number;
  left: number;
  bottom: number;
  height: number;
}

export interface VirtualWaterfallProps<T = any> {
  virtual?: boolean;
  rowKey?: keyof T | 'id';
  enableCache?: boolean;
  gap?: number;
  padding?: number | string;
  preloadScreenCount?: [number, number];
  itemMinWidth?: number;
  maxColumnCount?: number;
  minColumnCount?: number;
  items: T[];
  calcItemHeight: (item: T, itemWidth: number) => number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export interface VirtualWaterfallHandle<T = any> {
  withItemSpaces: (cb: (spaces: readonly VirtualWaterfallItemSpace<T>[]) => void) => void;
}

function isNumber(value: any): value is number {
  return Object.prototype.toString.call(value) === '[object Number]';
}

function useElementSize(targetRef: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.contentRect;
        setWidth(box.width);
      }
    });

    resizeObserver.observe(el);

    // 初始化一次
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) {
      const styleWidth = window.getComputedStyle(el).width;
      const w = Number.parseInt(styleWidth);
      if (!Number.isNaN(w)) setWidth(w);
    } else {
      setWidth(rect.width);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [targetRef]);

  return { width } as const;
}

function useElementTop(targetRef: React.RefObject<HTMLElement | null>) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setTop(rect.top);
    };

    update();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetRef]);

  return { top } as const;
}

export const VirtualWaterfall = React.forwardRef<VirtualWaterfallHandle<any>, VirtualWaterfallProps<any>>(
  (
    {
      virtual = true,
      rowKey = 'id',
      enableCache = true,
      gap = 15,
      padding = 15,
      preloadScreenCount = [0, 0],
      itemMinWidth = 220,
      maxColumnCount = 10,
      minColumnCount = 2,
      items,
      calcItemHeight,
      renderItem,
    },
    ref,
  ) => {
    const contentRef = useRef<HTMLDivElement | null>(null);

    const { width: contentWidth } = useElementSize(contentRef);
    const { top: contentTop } = useElementTop(contentRef);

    const [columnsTop, setColumnsTop] = useState<number[]>([]);
    const [itemSpaces, setItemSpaces] = useState<VirtualWaterfallItemSpace[]>([]);

    const columnCount = useMemo(() => {
      if (!contentWidth) return 0;
      const cWidth = contentWidth;
      if (cWidth >= itemMinWidth * 2) {
        const count = Math.floor(cWidth / itemMinWidth);
        if (maxColumnCount && count > maxColumnCount) return maxColumnCount;
        return count;
      }
      return minColumnCount;
    }, [contentWidth, itemMinWidth, maxColumnCount, minColumnCount]);

    const itemWidth = useMemo(() => {
      if (!contentWidth || columnCount <= 0) return 0;
      const gapTotal = (columnCount - 1) * gap;
      return Math.ceil((contentWidth - gapTotal) / columnCount);
    }, [contentWidth, columnCount, gap]);

    useEffect(() => {
      const length = items.length;
      if (!columnCount || !length || !itemWidth) {
        setItemSpaces([]);
        setColumnsTop(new Array(columnCount || 0).fill(0));
        return;
      }

      const spaces = new Array<VirtualWaterfallItemSpace>(length);
      let localColumnsTop: number[];
      let start = 0;

      const useCache = enableCache && itemSpaces.length && length > itemSpaces.length;

      if (useCache) {
        localColumnsTop = [...columnsTop];
        start = itemSpaces.length;
        for (let i = 0; i < start; i++) {
          spaces[i] = itemSpaces[i];
        }
      } else {
        localColumnsTop = new Array(columnCount).fill(0);
      }

      const getColumnIndex = (): number => {
        let min = Number.POSITIVE_INFINITY;
        let idx = 0;
        for (let i = 0; i < localColumnsTop.length; i++) {
          if (localColumnsTop[i] < min) {
            min = localColumnsTop[i];
            idx = i;
          }
        }
        return idx;
      };

      for (let i = start; i < length; i++) {
        const columnIndex = getColumnIndex();
        const h = calcItemHeight(items[i], itemWidth);
        const top = localColumnsTop[columnIndex];
        const left = (itemWidth + gap) * columnIndex;

        const space: VirtualWaterfallItemSpace = {
          index: i,
          item: items[i],
          column: columnIndex,
          top,
          left,
          bottom: top + h,
          height: h,
        };

        localColumnsTop[columnIndex] += h + gap;
        spaces[i] = space;
      }

      setColumnsTop(localColumnsTop);
      setItemSpaces(spaces);
    }, [items, columnCount, itemWidth, gap, enableCache, calcItemHeight]);

    const itemRenderList = useMemo(() => {
      const length = itemSpaces.length;
      if (!length) return [] as VirtualWaterfallItemSpace[];
      if (!virtual) return itemSpaces;

      const parent = contentRef.current?.parentElement;
      if (!parent) return itemSpaces;

      const parentTop = parent.offsetTop;
      const tp = -contentTop + parentTop;

      const [topPreloadScreenCount, bottomPreloadScreenCount] = preloadScreenCount;
      const innerHeight = parent.clientHeight;

      const minLimit = tp - topPreloadScreenCount * innerHeight;
      const maxLimit = tp + (bottomPreloadScreenCount + 1) * innerHeight;

      const result: VirtualWaterfallItemSpace[] = [];
      for (let i = 0; i < length; i++) {
        const v = itemSpaces[i];
        const t = v.top;
        const b = v.bottom;
        if (
          (t >= minLimit && t <= maxLimit) ||
          (b >= minLimit && b <= maxLimit) ||
          (t < minLimit && b > maxLimit)
        ) {
          result.push(v);
        }
      }
      return result;
    }, [itemSpaces, virtual, preloadScreenCount, contentTop]);

    React.useImperativeHandle(
      ref,
      () => ({
        withItemSpaces: (cb) => {
          cb(itemSpaces);
        },
      }),
      [itemSpaces],
    );

    const paddingStyle = isNumber(padding) ? `${padding}px` : padding;
    const containerHeight = columnsTop.length ? Math.max(...columnsTop) : 0;

    return (
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          willChange: 'height',
          height: `${containerHeight}px`,
          padding: paddingStyle,
        }}
      >
        {itemRenderList.map((data) => {
          const key =
            (rowKey && typeof data.item === 'object' && data.item[rowKey as keyof typeof data.item]) ??
            data.index;
          return (
            <div
              key={key as React.Key}
              style={{
                position: 'absolute',
                contentVisibility: 'auto',
                width: `${itemWidth}px`,
                height: `${data.height}px`,
                transform: `translate(${data.left}px, ${data.top}px)`,
                containIntrinsicSize: `${itemWidth}px ${data.height}px`,
              }}
              data-index={data.index}
            >
              {renderItem(data.item, data.index)}
            </div>
          );
        })}
      </div>
    );
  },
);

VirtualWaterfall.displayName = 'VirtualWaterfall';
