import './App.css'
import { VirtualWaterfall } from './VirtualWaterfall'
import Card, { type ItemOption } from './Card'
import useWaterfall from './useWaterfall'

function App() {
  const { vw, backTop, waterfallOption, setWaterfallOption, data, calcItemHeight } = useWaterfall()

  return (
    <>
      <header className="app-header">
        <strong>Vue瀑布流</strong>
        <small>
          <span className="badge">React Demo</span>
        </small>
      </header>
      <main className="app-main">
        <section className="waterfall-wrapper">
          <VirtualWaterfall<ItemOption>
            ref={vw}
            virtual={waterfallOption.virtual}
            gap={waterfallOption.gap}
            enableCache={waterfallOption.enableCache}
            padding={waterfallOption.padding}
            preloadScreenCount={[
              waterfallOption.topPreloadScreenCount,
              waterfallOption.bottomPreloadScreenCount,
            ]}
            itemMinWidth={waterfallOption.itemMinWidth}
            maxColumnCount={waterfallOption.maxColumnCount}
            minColumnCount={waterfallOption.minColumnCount}
            items={data.list}
            calcItemHeight={calcItemHeight}
            renderItem={(item) => (
              <Card item={item} onlyImage={waterfallOption.onlyImage} />
            )}
          />
        </section>
        <aside className="app-aside">
          <form>
            <div className="form-group">
              <label>
                间隔 <code>[0:100]</code>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  value={waterfallOption.gap}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      gap: Number(e.target.value) || 0,
                    }))
                  }
                />
                <span className="input-addon">px</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                填充 <code>[0:100]</code>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  value={waterfallOption.padding}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      padding: Number(e.target.value) || 0,
                    }))
                  }
                />
                <span className="input-addon">px</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                每个元素的最小宽度 <code>[100:600]</code>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  value={waterfallOption.itemMinWidth}
                  min={100}
                  max={600}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      itemMinWidth: Number(e.target.value) || 100,
                    }))
                  }
                />
                <span className="input-addon">px</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                距离底部多少加载更多 <code>[0:10000]</code>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  value={waterfallOption.bottomDistance}
                  min={0}
                  max={10000}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      bottomDistance: Number(e.target.value) || 0,
                    }))
                  }
                />
                <span className="input-addon">px</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                最小列数 <code>[0:{waterfallOption.maxColumnCount}]</code>，最大列数{' '}
                <code>[{waterfallOption.minColumnCount}:10]</code>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  value={waterfallOption.minColumnCount}
                  min={0}
                  max={waterfallOption.maxColumnCount}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      minColumnCount: Number(e.target.value) || 0,
                    }))
                  }
                />
                <span className="input-addon">列</span>
                <input
                  type="number"
                  value={waterfallOption.maxColumnCount}
                  min={waterfallOption.minColumnCount}
                  max={10}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      maxColumnCount: Number(e.target.value) || prev.maxColumnCount,
                    }))
                  }
                />
                <span className="input-addon">列</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                (顶部/底部)预加载屏 <code>[0:5]</code>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  value={waterfallOption.topPreloadScreenCount}
                  min={0}
                  max={5}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      topPreloadScreenCount: Number(e.target.value) || 0,
                    }))
                  }
                />
                <input
                  type="number"
                  value={waterfallOption.bottomPreloadScreenCount}
                  min={0}
                  max={5}
                  step={1}
                  onChange={(e) =>
                    setWaterfallOption((prev) => ({
                      ...prev,
                      bottomPreloadScreenCount: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-switch">
              <label>开启虚拟列表</label>
              <input
                type="checkbox"
                checked={waterfallOption.virtual}
                onChange={(e) =>
                  setWaterfallOption((prev) => ({ ...prev, virtual: e.target.checked }))
                }
              />
            </div>

            <div className="form-switch">
              <label>开启列表缓存</label>
              <input
                type="checkbox"
                checked={waterfallOption.enableCache}
                onChange={(e) =>
                  setWaterfallOption((prev) => ({ ...prev, enableCache: e.target.checked }))
                }
              />
            </div>

            <div className="form-switch">
              <label>仅展示图片</label>
              <input
                type="checkbox"
                checked={waterfallOption.onlyImage}
                onChange={(e) =>
                  setWaterfallOption((prev) => ({ ...prev, onlyImage: e.target.checked }))
                }
              />
            </div>

            <div className="form-group">
              <label>数据展示</label>
              <p>每页条数: {data.size}</p>
              <p>
                当前页码: {data.page} / {data.max}
              </p>
              <p>
                已加载量: {data.list.length} / {data.total}
              </p>
              <p>等待加载: {String(waterfallOption.loading)}</p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={backTop}
            >
              回到顶部
            </button>
          </form>
        </aside>
      </main>
    </>
  )
}

export default App
