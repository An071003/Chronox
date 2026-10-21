import { create } from 'zustand';

export type WatchModelId = 'classique' | 'tourbillon';

export type EditionId = 'rosegold' | 'titanium' | 'carbon' | 'platinum';

export type ClassiqueEditionId =
  | 'everose_diamond'
  | 'yellow_fluted'
  | 'steel_azure'
  | 'white_mint';

export type CameraPresetId =
  | 'dial_hero'
  | 'macro_tourbillon'
  | 'crown_pushers'
  | 'caseback'
  | 'side_profile'
  | 'cyclops_date'
  | 'bezel_macro'
  | 'bracelet';

export interface WatchModelConfig {
  id: WatchModelId;
  name: string;
  reference: string;
  calibre: string;
  beatsPerSecond: number;
  frequencyLabel: string;
  powerReserveHours: number;
  cameraPresets: { id: CameraPresetId; label: string }[];
}

export const WATCH_MODELS: Record<WatchModelId, WatchModelConfig> = {
  classique: {
    id: 'classique',
    name: 'Classique Date 36',
    reference: 'REF. CX-126 CLASSIQUE DATE 36',
    calibre: 'Calibre CX-3235 Automatic',
    beatsPerSecond: 8,
    frequencyLabel: '4.0 Hz / 28,800 VPH',
    powerReserveHours: 70,
    cameraPresets: [
      { id: 'dial_hero', label: 'Dial Hero' },
      { id: 'cyclops_date', label: 'Cyclops Date (3h)' },
      { id: 'bezel_macro', label: 'Bezel Macro' },
      { id: 'bracelet', label: 'Jubilee Bracelet' },
      { id: 'side_profile', label: 'Case Profile' },
      { id: 'caseback', label: 'Exhibition Caseback' },
    ],
  },
  tourbillon: {
    id: 'tourbillon',
    name: 'Skeleton Tourbillon',
    reference: 'REF. RM-026 SKELETON TOURBILLON',
    calibre: 'Calibre RM-026 Flying Tourbillon',
    beatsPerSecond: 6,
    frequencyLabel: '3.0 Hz / 21,600 VPH',
    powerReserveHours: 72,
    cameraPresets: [
      { id: 'dial_hero', label: 'Dial Hero' },
      { id: 'macro_tourbillon', label: 'Macro Tourbillon (6h)' },
      { id: 'crown_pushers', label: 'Crown & Pushers (3h)' },
      { id: 'caseback', label: 'Exhibition Caseback' },
      { id: 'side_profile', label: 'Side Calibre Profile' },
    ],
  },
};

export interface ClassiqueEditionConfig {
  id: ClassiqueEditionId;
  name: string;
  shortName: string;
  subtitle: string;
  swatchPrimary: string;
  swatchSecondary: string;
  caseColor: string;
  goldColor: string;
  bezelStyle: 'diamond' | 'fluted' | 'smooth';
  dialStyle: 'fluted_motif' | 'sunray';
  dialColor: string;
  dialEdgeColor: string;
  printColor: string;
  printSecondaryColor: string;
  braceletOuterColor: string;
  braceletCenterColor: string;
  lumeDayColor: string;
  specs: { label: string; value: string }[];
}

export const CLASSIQUE_EDITIONS: Record<ClassiqueEditionId, ClassiqueEditionConfig> = {
  everose_diamond: {
    id: 'everose_diamond',
    name: 'ROSE GOLD TWO-TONE · DIAMOND BEZEL',
    shortName: 'Rose Gold Diamond',
    subtitle: 'Silver Fluted Motif Dial',
    swatchPrimary: '#F2C3A8',
    swatchSecondary: '#D9DCE0',
    caseColor: '#CDD0D4',
    goldColor: '#F4C1A4',
    bezelStyle: 'diamond',
    dialStyle: 'fluted_motif',
    dialColor: '#E9E6E1',
    dialEdgeColor: '#C9C5BF',
    printColor: '#1D1D20',
    printSecondaryColor: '#6B6A6C',
    braceletOuterColor: '#CDD0D4',
    braceletCenterColor: '#F4C1A4',
    lumeDayColor: '#F6F1E7',
    specs: [
      { label: 'Case', value: '36 mm 904L steel' },
      { label: 'Bezel', value: '18K rose gold · 52 brilliants' },
      { label: 'Dial', value: 'Silver fluted motif' },
      { label: 'Bracelet', value: 'Jubilee 5-link two-tone' },
      { label: 'Crystal', value: 'Sapphire · cyclops 2.5×' },
      { label: 'Water', value: '100 m / 330 ft' },
    ],
  },
  yellow_fluted: {
    id: 'yellow_fluted',
    name: 'YELLOW TWO-TONE · FLUTED BEZEL',
    shortName: 'Yellow Fluted',
    subtitle: 'Champagne Sunray Dial',
    swatchPrimary: '#F3D58A',
    swatchSecondary: '#D9DCE0',
    caseColor: '#CDD0D4',
    goldColor: '#F6D688',
    bezelStyle: 'fluted',
    dialStyle: 'sunray',
    dialColor: '#D8BE86',
    dialEdgeColor: '#9C824F',
    printColor: '#2A2316',
    printSecondaryColor: '#5E4F33',
    braceletOuterColor: '#CDD0D4',
    braceletCenterColor: '#F6D688',
    lumeDayColor: '#F7F0DC',
    specs: [
      { label: 'Case', value: '36 mm 904L steel' },
      { label: 'Bezel', value: '18K yellow gold · fluted' },
      { label: 'Dial', value: 'Champagne sunray' },
      { label: 'Bracelet', value: 'Jubilee 5-link two-tone' },
      { label: 'Crystal', value: 'Sapphire · cyclops 2.5×' },
      { label: 'Water', value: '100 m / 330 ft' },
    ],
  },
  steel_azure: {
    id: 'steel_azure',
    name: '904L STEEL · SMOOTH BEZEL',
    shortName: 'Steel Azure',
    subtitle: 'Azure Blue Sunray Dial',
    swatchPrimary: '#2F5DB8',
    swatchSecondary: '#D9DCE0',
    caseColor: '#CDD0D4',
    goldColor: '#E4E7EA',
    bezelStyle: 'smooth',
    dialStyle: 'sunray',
    dialColor: '#2C58B0',
    dialEdgeColor: '#0E2050',
    printColor: '#F4F6FA',
    printSecondaryColor: '#B8C6E6',
    braceletOuterColor: '#CDD0D4',
    braceletCenterColor: '#E4E7EA',
    lumeDayColor: '#EEF3FF',
    specs: [
      { label: 'Case', value: '36 mm 904L steel' },
      { label: 'Bezel', value: 'Polished domed steel' },
      { label: 'Dial', value: 'Azure blue sunray' },
      { label: 'Bracelet', value: 'Jubilee 5-link steel' },
      { label: 'Crystal', value: 'Sapphire · cyclops 2.5×' },
      { label: 'Water', value: '100 m / 330 ft' },
    ],
  },
  white_mint: {
    id: 'white_mint',
    name: 'WHITE GOLD · FLUTED BEZEL',
    shortName: 'Mint Fluted',
    subtitle: 'Mint Green Sunray Dial',
    swatchPrimary: '#9CCDB6',
    swatchSecondary: '#E6E8EA',
    caseColor: '#CDD0D4',
    goldColor: '#E6E7E8',
    bezelStyle: 'fluted',
    dialStyle: 'sunray',
    dialColor: '#9CCAB4',
    dialEdgeColor: '#4F7F6A',
    printColor: '#13261E',
    printSecondaryColor: '#3D5C4E',
    braceletOuterColor: '#CDD0D4',
    braceletCenterColor: '#E6E7E8',
    lumeDayColor: '#F1F7F3',
    specs: [
      { label: 'Case', value: '36 mm 904L steel' },
      { label: 'Bezel', value: '18K white gold · fluted' },
      { label: 'Dial', value: 'Mint green sunray' },
      { label: 'Bracelet', value: 'Jubilee 5-link steel' },
      { label: 'Crystal', value: 'Sapphire · cyclops 2.5×' },
      { label: 'Water', value: '100 m / 330 ft' },
    ],
  },
};

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
  model: WatchModelId;
  edition: EditionId;
  classiqueEdition: ClassiqueEditionId;
  dateOffsetDays: number;
  showcaseSpinTrigger: number; // bumps on edition change -> 3D turntable spin
  isIntroComplete: boolean;
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
  setModel: (model: WatchModelId) => void;
  setEdition: (edition: EditionId) => void;
  setClassiqueEdition: (edition: ClassiqueEditionId) => void;
  advanceDate: () => void;
  resetDate: () => void;
  setIntroComplete: () => void;
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
  model: 'classique',
  edition: 'rosegold',
  classiqueEdition: 'everose_diamond',
  dateOffsetDays: 0,
  showcaseSpinTrigger: 0,
  isIntroComplete: false,
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

  setModel: (model) => {
    if (get().model === model) return;
    set({
      model,
      cameraPreset: 'dial_hero',
      explodedProgress: 0,
      isChronoRunning: false,
      chronoElapsedMs: 0,
    });
  },

  setEdition: (edition) => {
    if (get().edition === edition) return;
    set((state) => ({ edition, showcaseSpinTrigger: state.showcaseSpinTrigger + 1 }));
  },

  setClassiqueEdition: (classiqueEdition) => {
    if (get().classiqueEdition === classiqueEdition) return;
    set((state) => ({
      classiqueEdition,
      showcaseSpinTrigger: state.showcaseSpinTrigger + 1,
    }));
  },

  advanceDate: () => set((state) => ({ dateOffsetDays: state.dateOffsetDays + 1 })),

  resetDate: () => set({ dateOffsetDays: 0 }),

  setIntroComplete: () => set({ isIntroComplete: true }),

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
