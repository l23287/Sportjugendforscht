// C9: Neuer Context – Trainer-Funktionen (Zielgruppe, Schwierigkeitsgrad) app-weit ein-/ausschalten.
// Gilt für die ganze App, nicht je Sportart (Abstimmung im Team): Die Schalter beschreiben, wie jemand als
// Trainer:in arbeitet, nicht die Sportart. Ausschalten blendet nur aus – gespeicherte Werte bleiben erhalten.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';
import { sanitizeTrainerFeatures, type TrainerFeatureKey, type TrainerFeatures } from '../lib/trainerFeatures';

interface TrainerFeaturesContextValue {
  features: TrainerFeatures;
  setFeature: (key: TrainerFeatureKey, enabled: boolean) => void;
}

const TrainerFeaturesContext = createContext<TrainerFeaturesContextValue | null>(null);

export function TrainerFeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<TrainerFeatures>(() =>
    sanitizeTrainerFeatures(loadJSON<unknown>('trainerFeatures', null)),
  );

  useEffect(() => saveJSON('trainerFeatures', features), [features]);

  const value = useMemo<TrainerFeaturesContextValue>(
    () => ({
      features,
      setFeature: (key, enabled) => setFeatures((prev) => ({ ...prev, [key]: enabled })),
    }),
    [features],
  );

  return <TrainerFeaturesContext.Provider value={value}>{children}</TrainerFeaturesContext.Provider>;
}

export function useTrainerFeatures(): TrainerFeaturesContextValue {
  const ctx = useContext(TrainerFeaturesContext);
  if (!ctx) throw new Error('useTrainerFeatures must be used within TrainerFeaturesProvider');
  return ctx;
}
