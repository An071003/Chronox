import { create } from 'zustand';

export type WorldStateId = 'solar_eclipse' | 'crimson_valkyrie' | 'astral_void';
export type PortalRealmId = 'crimson_blades' | 'golden_astrolabe' | 'neptune_void';
export type ExperienceMode = 'eclipse' | 'chronox';

export interface WorldStateTheme {
  id: WorldStateId;
  name: string;
  subtitle: string;
  bgHex: string;
  primaryHex: string;
  secondaryHex: string;
  auraHex: string;
  obsidianHex: string;
  goldHex: string;
}

export const WORLD_STATE_THEMES: Record<WorldStateId, WorldStateTheme> = {
  solar_eclipse: {
    id: 'solar_eclipse',
    name: 'SOLAR ECLIPSE',
    subtitle: 'Imperial Corona & Moonlight',
    bgHex: '#040508',
    primaryHex: '#F59E0B',
    secondaryHex: '#38BDF8',
    auraHex: '#FDE047',
    obsidianHex: '#131722',
    goldHex: '#E5C17B',
  },
  crimson_valkyrie: {
    id: 'crimson_valkyrie',
    name: 'CRIMSON VALKYRIE',
    subtitle: 'Scarlet Lightning & Blood Qi',
    bgHex: '#090304',
    primaryHex: '#EF4444',
    secondaryHex: '#F97316',
    auraHex: '#FF2E4C',
    obsidianHex: '#1C1014',
    goldHex: '#FCA5A5',
  },
  astral_void: {
    id: 'astral_void',
    name: 'ASTRAL VOID',
    subtitle: 'Bioluminescent Abyss & Nebula',
    bgHex: '#03070B',
    primaryHex: '#00F5D4',
    secondaryHex: '#8B5CF6',
    auraHex: '#38BDF8',
    obsidianHex: '#0F1B29',
    goldHex: '#A7F3D0',
  },
};

export interface ActLoreData {
  act: 1 | 2 | 3 | 4 | 5;
  roman: string;
  title: string;
  subtitle: string;
  tarotName: string;
  description: string;
  telemetry: string;
}

export const ECLIPSE_ACTS: ActLoreData[] = [
  {
    act: 1,
    roman: 'ACT I',
    title: 'THE SHATTERED SANCTUARY',
    subtitle: 'Horizon of the Black Mirror',
    tarotName: '0. THE ECLIPSE ALTAR',
    description:
      'Suspended above an infinite obsidian sea, sixty ancient basalt monoliths guard the dormant Sovereign of Resonance.',
    telemetry: 'ALTITUDE: -2.2m // GRAVITY: 0.04G // RESONANCE: DORMANT',
  },
  {
    act: 2,
    roman: 'ACT II',
    title: 'THE ASTRAL SERAPHIM',
    subtitle: 'Crown of XXIV Telekinetic Blades',
    tarotName: 'I. THE VALKYRIE SOVEREIGN',
    description:
      'Forged from fractured star-glass and imperial gold, the Seraphim tracks every mortal gaze while twenty-four living sword-feathers ripple in zero gravity.',
    telemetry: 'BLADE ARRAY: 24 UNITS // HALO: 12-SPOKE SOLAR // IK TRACKING: ACTIVE',
  },
  {
    act: 3,
    roman: 'ACT III',
    title: 'ANATOMY OF RESONANCE',
    subtitle: 'Singularity Core & Astrolabe Dissection',
    tarotName: 'II. THE SINGULARITY HEART',
    description:
      'The outer obsidian pauldrons and chestplate separate to expose a contained naked singularity pulsing at harmonic frequencies.',
    telemetry: 'CORE TEMP: 14,200K // ARMOR STATE: EXPLODED // ASTROLABE: 3-AXIS',
  },
  {
    act: 4,
    roman: 'ACT IV',
    title: 'GATES OF THE MULTIVERSE',
    subtitle: 'Three Monolith Dimensional Rifts',
    tarotName: 'III. THE TRINITY GATES',
    description:
      'Three towering basalt archways tear open windows into parallel dimensions: the Storm of Crimson Blades, the Golden Astrolabe Archive, and the Neptune Void.',
    telemetry: 'PORTALS: 3 ACTIVE // RIFT STABILITY: 98.4% // CLICK GATE TO ENTER',
  },
  {
    act: 5,
    roman: 'ACT V',
    title: 'ETERNAL CONVERGENCE',
    subtitle: 'Free Orbit & Boss Awakening',
    tarotName: 'IV. THE CROWN OF ETERNITY',
    description:
      'Take full orbital command of the Sanctuary, hold SPACE to unleash the 24-Blade Sword Formation Overdrive, or trigger the cinematic Boss Intro Cutscene.',
    telemetry: 'CAMERA: FREE ORBIT // OVERDRIVE: READY [HOLD SPACE / CLICK]',
  },
];

interface EclipseState {
  experienceMode: ExperienceMode;
  worldState: WorldStateId;
  scrollProgress: number; // 0 to 1
  currentAct: 1 | 2 | 3 | 4 | 5;
  isAwakened: boolean; // Hold click / Hold Space -> Divine Awakening Overdrive
  isArmorExploded: boolean;
  activePortalId: PortalRealmId | null;
  isCutscenePlaying: boolean;
  isAudioEnabled: boolean;

  // Actions
  setExperienceMode: (mode: ExperienceMode) => void;
  setWorldState: (state: WorldStateId) => void;
  setScrollProgress: (progress: number) => void;
  jumpToAct: (act: 1 | 2 | 3 | 4 | 5) => void;
  setAwakened: (awakened: boolean) => void;
  toggleArmorExploded: () => void;
  enterPortal: (portalId: PortalRealmId | null) => void;
  setCutscenePlaying: (playing: boolean) => void;
  toggleAudio: () => void;
}

export const useEclipseStore = create<EclipseState>((set) => ({
  experienceMode: 'eclipse',
  worldState: 'solar_eclipse',
  scrollProgress: 0,
  currentAct: 1,
  isAwakened: false,
  isArmorExploded: false,
  activePortalId: null,
  isCutscenePlaying: false,
  isAudioEnabled: false,

  setExperienceMode: (experienceMode) => set({ experienceMode }),

  setWorldState: (worldState) => set({ worldState }),

  setScrollProgress: (raw) => {
    const clamped = Math.max(0, Math.min(1, raw));
    const actIndex = Math.min(5, Math.max(1, Math.floor(clamped * 5) + 1)) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    set({
      scrollProgress: clamped,
      currentAct: actIndex,
      isArmorExploded: actIndex === 3,
    });
  },

  jumpToAct: (act) => {
    const targetProgress = (act - 1) * 0.22 + 0.05;
    set({
      currentAct: act,
      scrollProgress: Math.min(0.98, targetProgress),
      isArmorExploded: act === 3,
    });
  },

  setAwakened: (isAwakened) => set({ isAwakened }),

  toggleArmorExploded: () =>
    set((state) => ({ isArmorExploded: !state.isArmorExploded })),

  enterPortal: (activePortalId) => set({ activePortalId }),

  setCutscenePlaying: (isCutscenePlaying) => set({ isCutscenePlaying }),

  toggleAudio: () =>
    set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
}));
