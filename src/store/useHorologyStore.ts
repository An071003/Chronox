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
    name: '18K ROSE GOLD & RUTHENIUM',
    shortName: '18K Rose Gold',
    subtitle: 'Flagship Dress Edition',
    swatchPrimary: '#E5AE88',
    swatchSecondary: '#3E4656',
    caseColor: '#E5AE88',
    caseMetalness: 0.89,
    caseRoughness: 0.21,
    bezelBoltColor: '#E2E8F0',
    bridgeColor: '#434C5E',
    bridgeMetalness: 0.88,
    bridgeRoughness: 0.24,
    gearPrimaryColor: '#F3C66F',
    gearSecondaryColor: '#E5AE88',
    tourbillonCageColor: '#F1F5F9',
    balanceWheelColor: '#F3C66F',
    handColor: '#F8D8BE',
    chronoHandColor: '#EF4444',
    lumeDayColor: '#FEF9EE',
    strapColor: '#12151C',
  },
  titanium: {
    id: 'titanium',
    name: 'GRADE-5 TITANIUM & CYBER BLUE',
    shortName: 'Grade-5 Titanium',
    subtitle: 'Sport Calibre',
    swatchPrimary: '#C8D2DC',
    swatchSecondary: '#38BDF8',
    caseColor: '#C8D2DC',
    caseMetalness: 0.88,
    caseRoughness: 0.22,
    bezelBoltColor: '#F8FAFC',
    bridgeColor: '#3B4758',
    bridgeMetalness: 0.88,
    bridgeRoughness: 0.24,
    gearPrimaryColor: '#38BDF8',
    gearSecondaryColor: '#E2E8F0',
    tourbillonCageColor: '#F1F5F9',
    balanceWheelColor: '#38BDF8',
    handColor: '#F8FAFC',
    chronoHandColor: '#FF5500',
    lumeDayColor: '#E0F2FE',
    strapColor: '#0F172A',
  },
  carbon: {
    id: 'carbon',
    name: 'ANTHRACITE STEEL & CRIMSON',
    shortName: 'PVD Anthracite',
    subtitle: 'Racing Concept',
    swatchPrimary: '#363C48',
    swatchSecondary: '#EF4444',
    caseColor: '#363C48',
    caseMetalness: 0.86,
    caseRoughness: 0.24,
    bezelBoltColor: '#F3C66F',
    bridgeColor: '#2B303C',
    bridgeMetalness: 0.86,
    bridgeRoughness: 0.25,
    gearPrimaryColor: '#F3C66F',
    gearSecondaryColor: '#EF4444',
    tourbillonCageColor: '#F1F5F9',
    balanceWheelColor: '#EF4444',
    handColor: '#F8FAFC',
    chronoHandColor: '#EF4444',
    lumeDayColor: '#FEE2E2',
    strapColor: '#0B0D13',
  },
  platinum: {
    id: 'platinum',
    name: '950 PLATINUM & EMERALD',
    shortName: '950 Platinum',
    subtitle: 'Haute Joaillerie',
    swatchPrimary: '#ECF1F8',
    swatchSecondary: '#10B981',
    caseColor: '#ECF1F8',
    caseMetalness: 0.91,
    caseRoughness: 0.16,
    bezelBoltColor: '#94A3B8',
    bridgeColor: '#3A4852',
    bridgeMetalness: 0.88,
    bridgeRoughness: 0.22,
    gearPrimaryColor: '#F3C66F',
    gearSecondaryColor: '#10B981',
    tourbillonCageColor: '#F8FAFC',
    balanceWheelColor: '#10B981',
    handColor: '#FFFFFF',
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
