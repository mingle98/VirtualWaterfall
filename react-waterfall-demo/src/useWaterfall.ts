import { useEffect, useRef, useState } from 'react'
import type { VirtualWaterfallHandle } from './VirtualWaterfall'
import type { ItemOption } from './Card'

export interface WaterfallOption {
  loading: boolean
  bottomDistance: number
  onlyImage: boolean
  topPreloadScreenCount: number
  bottomPreloadScreenCount: number
  virtual: boolean
  enableCache: boolean
  gap: number
  padding: number
  itemMinWidth: number
  minColumnCount: number
  maxColumnCount: number
}

export interface WaterfallData {
  page: number
  size: number
  total: number
  max: number
  list: ItemOption[]
  end: boolean
}

let measureDom: HTMLDivElement | null = null

function getRealHeight(item: ItemOption, realWidth: number) {
  if (!measureDom) return 0
  const el = document.createElement('div')
  el.style.width = `${realWidth}px`
  el.style.boxSizing = 'border-box'
  el.style.padding = '12px'
  el.style.visibility = 'hidden'
  el.innerHTML = `
    <h3 style="margin:0;padding:0;font-weight:bolder;font-size:14px;">${item.title}</h3>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
      <div style="display:flex;align-items:center;">
        <img src="${item.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" />
        <span style="margin-left:4px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.user}</span>
      </div>
      <div style="font-size:12px;">❤️ ${item.views > 999 ? '999+' : item.views}</div>
    </div>
  `
  measureDom.appendChild(el)
  const height = el.clientHeight
  measureDom.removeChild(el)
  return height
}

export function useWaterfall() {
  const vw = useRef<VirtualWaterfallHandle<ItemOption> | null>(null)
  const dataRef = useRef<WaterfallData | null>(null)
  const optionRef = useRef<WaterfallOption | null>(null)

  const [waterfallOption, setWaterfallOption] = useState<WaterfallOption>({
    loading: false,
    bottomDistance: 0,
    onlyImage: false,
    topPreloadScreenCount: 0,
    bottomPreloadScreenCount: 0,
    virtual: true,
    enableCache: true,
    gap: 15,
    padding: 15,
    itemMinWidth: 220,
    minColumnCount: 2,
    maxColumnCount: 10,
  })

  const [data, setData] = useState<WaterfallData>({
    page: 0,
    size: 30,
    total: 0,
    max: 0,
    list: [],
    end: false,
  })

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    optionRef.current = waterfallOption
  }, [waterfallOption])

  const backTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  const loadData = async () => {
    const currentData = dataRef.current ?? data
    if (currentData.end) return
    const nextPage = currentData.page + 1
    const response = await fetch(
      `https://mock.yuan.sh/images?page=${nextPage}&size=${data.size}&mode=simple`,
    )
    const result = await response.json()
    if (!result.list.length) {
      setData((prev) => ({ ...prev, end: true }))
      return
    }
    setData((prev) => ({
      ...prev,
      page: nextPage,
      total: result.total,
      max: result.max,
      list: [...prev.list, ...result.list],
    }))
  }

  const checkScrollPosition = async () => {
    const option = optionRef.current ?? waterfallOption
    if (option.loading) return
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    if (distanceFromBottom <= option.bottomDistance) {
      setWaterfallOption((prev) => ({ ...prev, loading: true }))
      await loadData()
      setWaterfallOption((prev) => ({ ...prev, loading: false }))
    }
    requestAnimationFrame(() => {
      void checkScrollPosition()
    })
  }

  useEffect(() => {
    measureDom = document.createElement('div')
    measureDom.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;box-sizing:border-box;'
    document.body.appendChild(measureDom)

    const init = async () => {
      setWaterfallOption((prev) => ({ ...prev, loading: true }))
      await loadData()
      setWaterfallOption((prev) => ({ ...prev, loading: false }))
      void checkScrollPosition()
    }

    void init()

    return () => {
      if (measureDom && measureDom.parentElement) {
        measureDom.parentElement.removeChild(measureDom)
      }
      measureDom = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calcItemHeight = (item: ItemOption, itemWidth: number) => {
    let height = 0
    if (!waterfallOption.onlyImage) {
      height = getRealHeight(item, itemWidth)
    }
    return (item.height * (itemWidth / item.width)) + height
  }

  return {
    vw,
    backTop,
    waterfallOption,
    setWaterfallOption,
    data,
    setData,
    calcItemHeight,
  }
}

export default useWaterfall
