import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {makeSculpture, SETTINGS} from './sculpture';

const Sculpture = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const model = useMemo(() => makeSculpture(), []);
  const seconds = frame / fps;
  return (
    <group
      position={[0, 0.13 + Math.sin(seconds * 0.8) * 0.025, 0]}
      rotation={[0.48 + Math.sin(seconds * 0.6) * 0.055, -0.65 + seconds * 0.18, -0.23]}
    >
      <primitive object={model} />
    </group>
  );
};

export const ChromaticBloom = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: SETTINGS.background}}>
      <div style={{position: 'absolute', left: '30%', top: '83%', width: '40%', height: '1.1%',
        backgroundColor: '#788182', opacity: 0.12, borderRadius: '50%', filter: 'blur(15px)'}} />
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        camera={{position: [0, 0, 8], zoom: width / 3.72, near: 0.1, far: 30}}
        gl={{antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.98}}
      >
        <ambientLight intensity={0.3} />
        <hemisphereLight args={['#f4edff', '#5c7070', 0.65]} />
        <directionalLight position={[-3, 5, 6]} color="#ffffff" intensity={1.7} />
        <directionalLight position={[4, 1, -3]} color="#e0eaff" intensity={1.5} />
        <Sculpture />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
