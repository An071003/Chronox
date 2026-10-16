import { create } from 'zustand';

export type EditionId = 'rosegold' | 'titanium' | 'carbon' | 'platinum';

export type CameraPresetId =
  | 'dial_hero'
  | 'macro_tourbillon'
  | 'crown_pushers'
  | 'caseback'
  | 'side_profile';

export interface EditionConfig {
  id: EditionId;
  name: string;
  shortName: string;
  subtitle: string;
  swatchPrimary: string;
  swatchSecondary: string;
  caseColor: string;
  caseMetalness: number;
  caseRoughness: number;
  bezelBoltColor: string;
  bridgeColor: string;
  bridgeMetalness: number;
  bridgeRoughness: number;
  gearPrimaryColor: string;
  gearSecondaryColor: string;
  tourbillonCageColor: string;
  balanceWheelColor: string;
  handColor: string;
  chronoHandColor: string;
  lumeDayColor: string;
  strapColor: string;
}

export const HOROLOGY_EDITIONS: Record<EditionId, EditionConfig> = {
  rosegold: {
    id: 'rosegold',
    name: '18K ROSE GOLD & OBSIDIAN',
    shortName: '18K Rose Gold',
    subtitle: 'Flagship Dress Edition',
    swatchPrimary: '#E6A87C',
    swatchSecondary: '#18181B',
    caseColor: '#E6A87C',
    caseMetalness: 0.94,
    caseRoughness: 0.18,
    bezelBoltColor: '#D4AF37',
    bridgeColor: '#18181B',
    bridgeMetalness: 0.72,
    bridgeRoughness: 0.42,
    gearPrimaryColor: '#F59E0B',
    gearSecondaryColor: '#E6A87C',
    tourbillonCageColor: '#E2E8F0',
    balanceWheelColor: '#F59E0B',
    handColor: '#E6A87C',
    chronoHandColor: '#EF4444',
    lumeDayColor: '#FEF3C7',
    strapColor: '#111216',
  },
  titanium: {
    id: 'titanium',
    name: 'GRADE-5 TITANIUM & CYBER BLUE',
    shortName: 'Grade-5 Titanium',
    subtitle: 'Sport Calibre',
    swatchPrimary: '#94A3B8',
    swatchSecondary: '#38BDF8',
    caseColor: '#94A3B8',
    caseMetalness: 0.88,
    caseRoughness: 0.26,
    bezelBoltColor: '#E2E8F0',
    bridgeColor: '#1E293B',
    bridgeMetalness: 0.76,
    bridgeRoughness: 0.36,
    gearPrimaryColor: '#38BDF8',
    gearSecondaryColor: '#E2E8F0',
    tourbillonCageColor: '#38BDF8',
    balanceWheelColor: '#E2E8F0',
    handColor: '#F1F5F9',
    chronoHandColor: '#FF4D00',
    lumeDayColor: '#E0F2FE',
    strapColor: '#0F172A',
  },
  carbon: {
    id: 'carbon',
    name: 'FORGED CARBON & CRIMSON',
    shortName: 'Forged Carbon',
    subtitle: 'Racing Concept',
    swatchPrimary: '#181A20',
    swatchSecondary: '#EF4444',
    caseColor: '#15181F',
    caseMetalness: 0.65,
    caseRoughness: 0.32,
    bezelBoltColor: '#EF4444',
    bridgeColor: '#090A0F',
    bridgeMetalness: 0.7,
    bridgeRoughness: 0.45,
    gearPrimaryColor: '#EF4444',
    gearSecondaryColor: '#D97706',
    tourbillonCageColor: '#EF4444',
    balanceWheelColor: '#D97706',
    handColor: '#F8FAFC',
    chronoHandColor: '#EF4444',
    lumeDayColor: '#FEE2E2',
    strapColor: '#090A0F',
  },
  platinum: {
    id: 'platinum',
    name: 'PLATINUM ICE & EMERALD',
    shortName: '950 Platinum',
    subtitle: 'Haute Joaillerie',
    swatchPrimary: '#F1F5F9',
    swatchSecondary: '#10B981',
    caseColor: '#F1F5F9',
    caseMetalness: 0.98,
    caseRoughness: 0.08,
    bezelBoltColor: '#94A3B8',
    bridgeColor: '#161F24',
    bridgeMetalness: 0.8,
    bridgeRoughness: 0.32,
    gearPrimaryColor: '#10B981',
    gearSecondaryColor: '#FBBF24',
    tourbillonCageColor: '#F1F5F9',
    balanceWheelColor: '#10B981',
    handColor: '#F8FAFC',
    chronoHandColor: '#10B981',
    lumeDayColor: '#D1FAE5',
    strapColor: '#071F18',
  },
};

interface HorologyState {
  edition: EditionId;
  isNightLume: boolean;
  isAudioEnabled: boolean;
  explodedProgress: number;
  timeMultiplier: 1 | 60 | 0.1;
  powerReserve: number; // 0 to 100 (%)
  crownTorque: number; // 0 to 100 live visual feedback
  crownWindAngle: number; // cumulative radians rotated
  isChronoRunning: boolean;
  chronoElapsedMs: number;
  pusherStartDepressed: boolean;
  pusherResetDepressed: boolean;
  flybackSnapTrigger: number;
  cameraPreset: CameraPresetId;

  // Actions
  setEdition: (edition: EditionId) => void;
  toggleNightLume: () => void;
  toggleAudio: () => void;
  setExplodedProgress: (val: number) => void;
  toggleBlueprintExplode: () => void;
  setTimeMultiplier: (mult: 1 | 60 | 0.1) => void;
  windMainspring: (amount?: number) => void;
  depletePowerReserve: (deltaPercent: number) => void;
  decayCrownTorque: (delta: number) => void;
  toggleChrono: () => void;
  resetChrono: () => void;
  tickChrono: (deltaMs: number) => void;
  setCameraPreset: (preset: CameraPresetId) => void;
}

export const useHorologyStore = create<HorologyState>((set, get) => ({
  edition: 'rosegold',
  isNightLume: false,
  isAudioEnabled: false,
  explodedProgress: 0,
  timeMultiplier: 1,
  powerReserve: 94,
  crownTorque: 0,
  crownWindAngle: 0,
  isChronoRunning: false,
  chronoElapsedMs: 0,
  pusherStartDepressed: false,
  pusherResetDepressed: false,
  flybackSnapTrigger: 0,
  cameraPreset: 'dial_hero',

  setEdition: (edition) => set({ edition }),

  toggleNightLume: () => set((state) => ({ isNightLume: !state.isNightLume })),

  toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),

  setExplodedProgress: (val) =>
    set({ explodedProgress: Math.max(0, Math.min(1, val)) }),

  toggleBlueprintExplode: () =>
    set((state) => ({
      explodedProgress: state.explodedProgress > 0.3 ? 0 : 1,
    })),

  setTimeMultiplier: (timeMultiplier) => set({ timeMultiplier }),

  windMainspring: (amount = 15) => {
    set((state) => ({
      powerReserve: Math.min(100, state.powerReserve + amount),
      crownTorque: Math.min(100, state.crownTorque + 45),
      crownWindAngle: state.crownWindAngle + Math.PI * 0.85,
    }));
  },

  depletePowerReserve: (deltaPercent) =>
    set((state) => ({
      powerReserve: Math.max(5, state.powerReserve - deltaPercent),
    })),

  decayCrownTorque: (delta) =>
    set((state) => ({
      crownTorque: Math.max(0, state.crownTorque - delta * 65),
    })),

  toggleChrono: () => {
    set((state) => ({
      isChronoRunning: !state.isChronoRunning,
      pusherStartDepressed: true,
    }));
    setTimeout(() => {
      set({ pusherStartDepressed: false });
    }, 180);
  },

  resetChrono: () => {
    set((state) => ({
      chronoElapsedMs: 0,
      pusherResetDepressed: true,
      flybackSnapTrigger: state.flybackSnapTrigger + 1,
    }));
    setTimeout(() => {
      set({ pusherResetDepressed: false });
    }, 200);
  },

  tickChrono: (deltaMs) => {
    if (!get().isChronoRunning) return;
    set((state) => ({
      chronoElapsedMs: state.chronoElapsedMs + deltaMs,
    }));
  },

  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
}));
