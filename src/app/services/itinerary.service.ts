import { Injectable, signal, computed } from '@angular/core';
import {
  GpxData,
  ItineraryPreferences,
  Stage,
  Accommodation,
  Meal,
  ActivityType,
} from '../models/itinerary.model';

export interface ItineraryState {
  gpxData: GpxData | null;
  preferences: Partial<ItineraryPreferences>;
  stages: Stage[];
  accommodations: Accommodation[];
  meals: Meal[];
  currentStep: number;
}

const DEFAULT_STATE: ItineraryState = {
  gpxData: null,
  preferences: {
    activityType: 'bike',
    maxDistancePerDay: 80,
    maxElevationPerDay: 800,
    departureTime: '08:00',
    maxAccommodationPrice: 90,
    maxMealPrice: 25,
    needTrainOnStartEnd: false,
    startDate: new Date().toISOString().split('T')[0],
    numberOfDays: 7,
  },
  stages: [],
  accommodations: [],
  meals: [],
  currentStep: 1,
};

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  // ─── State ──────────────────────────────────────────────────
  private _state = signal<ItineraryState>(DEFAULT_STATE);

  // ─── Selectors (computed signals) ──────────────────────────
  readonly gpxData = computed(() => this._state().gpxData);
  readonly preferences = computed(() => this._state().preferences);
  readonly stages = computed(() => this._state().stages);
  readonly accommodations = computed(() => this._state().accommodations);
  readonly meals = computed(() => this._state().meals);
  readonly currentStep = computed(() => this._state().currentStep);

  readonly activeStages = computed(() =>
    this.stages().filter((s) => !s.disabled)
  );

  readonly totalDistance = computed(() =>
    this.activeStages().reduce((sum, s) => sum + s.distance, 0)
  );

  readonly totalElevationGain = computed(() =>
    this.activeStages().reduce((sum, s) => sum + s.elevationGain, 0)
  );

  readonly hasGpx = computed(() => this._state().gpxData !== null);

  // ─── Mutations ─────────────────────────────────────────────
  setGpxData(gpxData: GpxData | null): void {
    this._state.update((s) => ({ ...s, gpxData }));
  }

  setPreferences(prefs: Partial<ItineraryPreferences>): void {
    this._state.update((s) => ({
      ...s,
      preferences: { ...s.preferences, ...prefs },
    }));
  }

  setStages(stages: Stage[]): void {
    this._state.update((s) => ({ ...s, stages }));
  }

  updateStage(id: string, patch: Partial<Stage>): void {
    this._state.update((s) => ({
      ...s,
      stages: s.stages.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    }));
  }

  removeStage(id: string): void {
    this._state.update((s) => ({
      ...s,
      stages: s.stages.filter((st) => st.id !== id),
    }));
  }

  toggleStageDisabled(id: string): void {
    this._state.update((s) => ({
      ...s,
      stages: s.stages.map((st) =>
        st.id === id ? { ...st, disabled: !st.disabled } : st
      ),
    }));
  }

  setAccommodations(accommodations: Accommodation[]): void {
    this._state.update((s) => ({ ...s, accommodations }));
  }

  updateAccommodation(id: string, patch: Partial<Accommodation>): void {
    this._state.update((s) => ({
      ...s,
      accommodations: s.accommodations.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    }));
  }

  setMeals(meals: Meal[]): void {
    this._state.update((s) => ({ ...s, meals }));
  }

  updateMeal(id: string, patch: Partial<Meal>): void {
    this._state.update((s) => ({
      ...s,
      meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  setCurrentStep(step: number): void {
    this._state.update((s) => ({ ...s, currentStep: step }));
  }

  // ─── Reset ──────────────────────────────────────────────────
  reset(): void {
    this._state.set(DEFAULT_STATE);
  }

  // ─── Persistence (localStorage) ────────────────────────────
  saveToLocalStorage(): void {
    const state = this._state();
    const serializable = {
      ...state,
      gpxData: null, // GPX trop volumineux, ne pas persister
    };
    localStorage.setItem('rando-itinerary', JSON.stringify(serializable));
  }

  loadFromLocalStorage(): boolean {
    const raw = localStorage.getItem('rando-itinerary');
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as ItineraryState;
      this._state.set(parsed);
      return true;
    } catch {
      return false;
    }
  }
}