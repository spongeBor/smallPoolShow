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

function App() {
  const [isNight, setIsNight] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [food, setFood] = useState(null)
  const [feedCount, setFeedCount] = useState(0)
  const [turtleSignal, setTurtleSignal] = useState(0)
  const [message, setMessage] = useState('拖动观察池塘，点击水面即可投喂')
  const audioContext = useRef(null)

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
    setFood({ ...nextPoint, id: Date.now(), startedAt: performance.now() })
    setFeedCount((count) => count + 1)
    setMessage('鱼群发现了新鲜的食物')
    playWaterTone('drop')
  }, [playWaterTone])

  const callTurtle = useCallback(() => {
    setTurtleSignal((signal) => signal + 1)
    setMessage('小龟探出头来和你打招呼')
    playWaterTone('turtle')
  }, [playWaterTone])

  return (
    <main className={isNight ? 'app app--night' : 'app'}>
      <section className="pond-stage" aria-label="互动式三维池塘">
        <PondScene
          isNight={isNight}
          food={food}
          turtleSignal={turtleSignal}
          onFeed={feedPond}
          onTurtle={callTurtle}
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
            <span><strong>8</strong> 尾鱼</span>
            <span><strong>1</strong> 只龟</span>
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
            <button className="secondary-action" type="button" onClick={callTurtle}>
              呼唤小龟
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
