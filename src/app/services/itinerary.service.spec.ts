import { TestBed } from '@angular/core/testing';
import { ItineraryService } from './itinerary.service';
import { Stage, Accommodation, Meal } from '../models/itinerary.model';

const MOCK_STAGE: Stage = {
  id: 'stage-1',
  name: 'Test Stage',
  distance: 25,
  duration: 180,
  elevationGain: 500,
  elevationLoss: 300,
  startPoint: [2.5, 46.6],
  endPoint: [2.6, 46.7],
  gpxCoordinates: [[2.5, 46.6], [2.55, 46.65], [2.6, 46.7]],
  pois: [],
  disabled: false,
};

describe('ItineraryService', () => {
  let service: ItineraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItineraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('starts with empty stages', () => {
      expect(service.stages()).toHaveSize(0);
    });

    it('starts with hasGpx = false', () => {
      expect(service.hasGpx()).toBe(false);
    });
  });

  describe('setStages', () => {
    it('updates stages signal', () => {
      service.setStages([MOCK_STAGE]);
      expect(service.stages()).toHaveSize(1);
    });
  });

  describe('computed signals', () => {
    it('activeStages excludes disabled stages', () => {
      const disabled = { ...MOCK_STAGE, id: 'disabled', disabled: true };
      service.setStages([MOCK_STAGE, disabled]);
      expect(service.activeStages()).toHaveSize(1);
    });

    it('totalDistance sums active stage distances', () => {
      const stage2 = { ...MOCK_STAGE, id: 'stage-2', distance: 30 };
      service.setStages([MOCK_STAGE, stage2]);
      expect(service.totalDistance()).toBeCloseTo(55, 1);
    });

    it('totalElevationGain sums active stage gains', () => {
      const stage2 = { ...MOCK_STAGE, id: 'stage-2', elevationGain: 400 };
      service.setStages([MOCK_STAGE, stage2]);
      expect(service.totalElevationGain()).toBe(900);
    });
  });

  describe('toggleStageDisabled', () => {
    it('toggles the disabled flag of a stage', () => {
      service.setStages([MOCK_STAGE]);
      expect(service.stages()[0].disabled).toBe(false);
      service.toggleStageDisabled('stage-1');
      expect(service.stages()[0].disabled).toBe(true);
      service.toggleStageDisabled('stage-1');
      expect(service.stages()[0].disabled).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      service.setStages([MOCK_STAGE]);
      service.reset();
      expect(service.stages()).toHaveSize(0);
    });
  });
});