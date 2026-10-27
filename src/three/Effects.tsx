import { Bloom, EffectComposer, N8AO, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

// Postprocesado: brillo solo en lo que supera el umbral (ventanas, luces, flujos),
// antialiasing, viñeta, grano fino y tone mapping ACES Filmic. Con `ao`, oclusión ambiental
// en pantalla (N8AO) para el hangar. En calidad baja se queda lo mínimo.
export default function Effects({ low, ao }: { low: boolean; ao: boolean }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO enabled={ao && !low} aoRadius={0.9} distanceFalloff={0.6} intensity={2.4} quality="medium" halfRes />
      <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={low ? 0.6 : 0.9} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
      {low ? <></> : <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} />}
      {low ? <></> : <SMAA />}
    </EffectComposer>
  )
}
