import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import FeedEffects from './pond/FeedEffects.jsx'
import Fish from './pond/animals/Fish.jsx'
import Turtle from './pond/animals/Turtle.jsx'
import PondEnvironment from './pond/environment/PondEnvironment.jsx'
import PondPlants from './pond/environment/PondPlants.jsx'

function PondWorld({ isNight, fishFood, turtleFood, turtleSignal, fish, turtles, onFeed, onTurtle }) {
  return (
    <>
      <PondEnvironment isNight={isNight} onFeed={onFeed} />
      <PondPlants />
      {fish.map((fishData, index) => (
        <Fish
          key={fishData.id}
          fish={fishData}
          index={index}
          fishFood={fishFood}
          turtleFood={turtleFood}
          isNight={isNight}
        />
      ))}
      {turtles.map((turtleData, index) => (
        <Turtle
          key={turtleData.id}
          turtle={turtleData}
          index={index}
          signal={turtleSignal}
          turtleFood={turtleFood}
          onTurtle={onTurtle}
          isNight={isNight}
        />
      ))}
      <FeedEffects fishFood={fishFood} turtleFood={turtleFood} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={7.2}
        maxDistance={14}
        minPolarAngle={0.56}
        maxPolarAngle={1.32}
        target={[0, -0.05, 0]}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  )
}

export default function PondScene(props) {
  return (
    <div className="canvas-wrap">
      <Canvas
        shadows
        dpr={[1, 1.65]}
        camera={{ position: [8.7, 4.8, 9.7], fov: 39, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <PondWorld {...props} />
      </Canvas>
    </div>
  )
}
