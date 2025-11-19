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

function useScrollTop() {
  const [scrollTop, setScrollTop] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const top = window.pageYOffset || document.documentElement.scrollTop;
      setScrollTop(top);
    };

    update();

    // 使用 requestAnimationFrame 来优化性能和确保及时更新
    const handleScroll = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(update);
    };

    // 监听 window 的滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { scrollTop } as const;
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
    const { scrollTop } = useScrollTop();

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

      const content = contentRef.current;
      if (!content) {
        return itemSpaces;
      }

      // 获取容器相对于文档的偏移量
      const contentRect = content.getBoundingClientRect();
      const contentOffsetTop = scrollTop + contentRect.top;

      const [topPreloadScreenCount, bottomPreloadScreenCount] = preloadScreenCount;
      const viewportHeight = window.innerHeight;

      // 计算可见区域的范围（相对于容器顶部）
      // scrollTop 是当前滚动位置
      // contentOffsetTop 是容器距离文档顶部的距离
      // 可见区域的顶部 = scrollTop - contentOffsetTop
      const visibleTop = scrollTop - contentOffsetTop;
      const visibleBottom = visibleTop + viewportHeight;

      // 加上预加载区域
      const minLimit = visibleTop - topPreloadScreenCount * viewportHeight;
      const maxLimit = visibleBottom + bottomPreloadScreenCount * viewportHeight;

      const result: VirtualWaterfallItemSpace[] = [];
      for (let i = 0; i < length; i++) {
        const v = itemSpaces[i];
        const t = v.top;
        const b = v.bottom;
        
        // 判断元素是否在可见区域内（包括预加载区域）
        if (
          (t >= minLimit && t <= maxLimit) ||
          (b >= minLimit && b <= maxLimit) ||
          (t < minLimit && b > maxLimit)
        ) {
          result.push(v);
        }
      }
      
      // 调试信息：打印虚拟列表过滤结果
      if (process.env.NODE_ENV === 'development' && length > 0) {
        console.log('Virtual List:', {
          total: length,
          rendered: result.length,
          scrollTop,
          contentOffsetTop,
          visibleTop,
          visibleBottom,
          minLimit,
          maxLimit,
          viewportHeight
        });
      }
      
      return result;
    }, [itemSpaces, virtual, preloadScreenCount, scrollTop]);

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
