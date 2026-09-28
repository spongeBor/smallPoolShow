import { useCallback, useRef, useState } from 'react'
import PondScene from './PondScene.jsx'

const randomPondPoint = () => {
  const angle = Math.random() * Math.PI * 2
  const radius = Math.sqrt(Math.random()) * 2.45
  return {
    x: Math.cos(angle) * radius * 1.25,
    z: Math.sin(angle) * radius * 0.72,
  }
}

const MAX_FISH = 30
const MAX_TURTLES = 8

const createFish = (id) => ({
  id: `fish-${id}`,
  size: 0.7 + Math.random() * 0.55,
  phase: Math.random() * Math.PI * 2,
  pace: 0.86 + Math.random() * 0.3,
  orbit: 0.86 + Math.random() * 0.28,
})

const createTurtle = (id) => ({
  id: `turtle-${id}`,
  size: 0.75 + Math.random() * 0.45,
  phase: Math.random() * Math.PI * 2,
  pace: 0.82 + Math.random() * 0.28,
  orbit: 0.82 + Math.random() * 0.3,
})

function App() {
  const [isNight, setIsNight] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [fishFood, setFishFood] = useState(null)
  const [turtleFood, setTurtleFood] = useState(null)
  const [feedCount, setFeedCount] = useState(0)
  const [turtleSignal, setTurtleSignal] = useState(0)
  const [message, setMessage] = useState('拖动观察池塘，点击水面即可投喂')
  const [fish, setFish] = useState(() => Array.from({ length: 8 }, (_, index) => createFish(index)))
  const [turtles, setTurtles] = useState(() => [createTurtle(0)])
  const audioContext = useRef(null)
  const animalSequence = useRef(8)

  const playWaterTone = useCallback((kind = 'drop') => {
    if (!soundOn) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = audioContext.current || new AudioContext()
    audioContext.current = context

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = kind === 'turtle' ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(kind === 'turtle' ? 260 : 540, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(
      kind === 'turtle' ? 390 : 180,
      context.currentTime + 0.28,
    )
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.32)
  }, [soundOn])

  const feedPond = useCallback((point) => {
    const nextPoint = point || randomPondPoint()
    setFishFood({ ...nextPoint, id: Date.now(), startedAt: performance.now() })
    setFeedCount((count) => count + 1)
    setMessage('鱼群发现了新鲜的食物')
    playWaterTone('drop')
  }, [playWaterTone])

  const greetTurtle = useCallback(() => {
    setTurtleSignal((signal) => signal + 1)
    setMessage(turtles.length > 1 ? '小龟们探出头来回应你的呼唤' : '小龟探出头来和你打招呼')
    playWaterTone('turtle')
  }, [playWaterTone, turtles.length])

  const feedTurtles = useCallback(() => {
    const nextPoint = randomPondPoint()
    setTurtleFood({ ...nextPoint, id: Date.now(), startedAt: performance.now() })
    setFeedCount((count) => count + 1)
    setMessage(turtles.length > 1 ? '龟群立刻朝龟粮冲了过去' : '小龟立刻朝龟粮游了过去')
    playWaterTone('turtle')
  }, [playWaterTone, turtles.length])

  const addFish = () => {
    if (fish.length >= MAX_FISH) {
      setMessage(`池塘最多容纳 ${MAX_FISH} 尾鱼`)
      return
    }
    animalSequence.current += 1
    setFish((current) => [...current, createFish(animalSequence.current)])
    setMessage('一尾体型各异的新鱼游入了池塘')
  }

  const addTurtle = () => {
    if (turtles.length >= MAX_TURTLES) {
      setMessage(`池塘最多容纳 ${MAX_TURTLES} 只龟`)
      return
    }
    animalSequence.current += 1
    setTurtles((current) => [...current, createTurtle(animalSequence.current)])
    setMessage('一只新龟慢慢游入了池塘')
  }

  return (
    <main className={isNight ? 'app app--night' : 'app'}>
      <section className="pond-stage" aria-label="互动式三维池塘">
        <PondScene
          isNight={isNight}
          fishFood={fishFood}
          turtleFood={turtleFood}
          turtleSignal={turtleSignal}
          fish={fish}
          turtles={turtles}
          onFeed={feedPond}
          onTurtle={greetTurtle}
        />

        <header className="topbar">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">青</span>
            <div>
              <p className="eyebrow">一方自然</p>
              <h1>青屿池塘</h1>
            </div>
          </div>
          <div className="topbar__actions">
            <button
              className="icon-button"
              type="button"
              aria-label={isNight ? '切换到白天' : '切换到夜晚'}
              aria-pressed={isNight}
              onClick={() => setIsNight((value) => !value)}
            >
              <span aria-hidden="true">{isNight ? '☾' : '☀'}</span>
              <span>{isNight ? '夜色' : '日光'}</span>
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label={soundOn ? '关闭音效' : '开启音效'}
              aria-pressed={soundOn}
              onClick={() => setSoundOn((value) => !value)}
            >
              <span aria-hidden="true">{soundOn ? '♪' : '×'}</span>
              <span>{soundOn ? '音景' : '静音'}</span>
            </button>
          </div>
        </header>

        <aside className="observation-card" aria-label="池塘观察记录">
          <p className="eyebrow">今日池畔</p>
          <p className="observation-card__time">{isNight ? '月影初上' : '风和日暖'}</p>
          <div className="observation-card__stats">
            <span><strong>{fish.length}</strong> 尾鱼</span>
            <span><strong>{turtles.length}</strong> 只龟</span>
            <span><strong>{feedCount}</strong> 次投喂</span>
          </div>
          <p className="observation-card__note">轻轻转动视角，看看睡莲下藏着谁。</p>
        </aside>

        <div className="interaction-panel">
          <p className="interaction-panel__status" role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {message}
          </p>
          <div className="interaction-panel__buttons">
            <button className="primary-action" type="button" onClick={() => feedPond()}>
              <span className="primary-action__icon" aria-hidden="true">•••</span>
              撒一把鱼食
            </button>
            <button className="secondary-action" type="button" onClick={feedTurtles}>
              投喂龟粮
            </button>
            <button
              className="add-action"
              type="button"
              onClick={addFish}
              disabled={fish.length >= MAX_FISH}
              aria-label={`增加一尾随机大小的鱼，当前 ${fish.length} 尾，最多 ${MAX_FISH} 尾`}
            >
              <span aria-hidden="true">＋</span> 添一尾鱼
            </button>
            <button
              className="add-action"
              type="button"
              onClick={addTurtle}
              disabled={turtles.length >= MAX_TURTLES}
              aria-label={`增加一只随机大小的龟，当前 ${turtles.length} 只，最多 ${MAX_TURTLES} 只`}
            >
              <span aria-hidden="true">＋</span> 添一只龟
            </button>
          </div>
        </div>

        <div className="gesture-hint" aria-hidden="true">
          <span className="gesture-hint__mouse" />
          拖动旋转 · 滚轮缩放
        </div>

        <footer>
          <span>© 2026 青屿池塘</span>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
            粤ICP备2025360682号-1
          </a>
        </footer>
      </section>
    </main>
  )
}

export default App
