import { Environment, Lightformer } from '@react-three/drei'

// Entorno de reflejos armado en código (sin mapas descargados): paneles de luz fríos
// arriba y a los costados, como un estudio técnico.
export default function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#04060b']} />
      <Lightformer form="rect" intensity={2.2} color="#dbe9ff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#9cc8ff" position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={0.8} color="#ffe3c2" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer form="ring" intensity={0.6} color="#7cc8ff" position={[0, 1, -8]} scale={4} />
    </Environment>
  )
}
