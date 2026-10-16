import React from 'react';
import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { useEclipseStore, WORLD_STATE_THEMES } from '../../store/useEclipseStore';

export const ReflectiveAbyssFloor: React.FC = () => {
  const worldState = useEclipseStore((s) => s.worldState);
  const theme = WORLD_STATE_THEMES[worldState];

  return (
    <group>
      {/* 50m x 50m Planar Mirror Obsidian Water Floor at y = -2.2 */}
      <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={0.85}
          mixStrength={60}
          roughness={0.25}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050608"
          metalness={0.8}
          mirror={0.85}
        />
      </mesh>

      {/* Subtle Engraved Golden Sanctuary Ritual Circles on the Mirror Surface */}
      <group position={[0, -2.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[2.2, 3.6, 6.5].map((radius, idx) => (
          <mesh key={idx}>
            <ringGeometry args={[radius - 0.025, radius, 96]} />
            <meshBasicMaterial
              color={idx === 1 ? theme.secondaryHex : theme.primaryHex}
              transparent
              opacity={0.38}
            />
          </mesh>
        ))}
      </group>

      {/* Dual-Layer Grounding Contact Shadows directly beneath the Boss & Portals */}
      <ContactShadows
        position={[0, -2.19, 0]}
        opacity={0.85}
        scale={18}
        blur={2.2}
        far={6}
        color="#000000"
      />
    </group>
  );
};
