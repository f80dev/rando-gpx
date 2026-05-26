import { TestBed } from '@angular/core/testing';
import { GpxParserService } from './gpx-parser.service';

const VALID_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="46.6034" lon="2.5"><ele>200</ele></trkpt>
      <trkpt lat="46.6134" lon="2.51"><ele>210</ele></trkpt>
      <trkpt lat="46.6234" lon="2.52"><ele>205</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

const TRACK_WITH_TIMES = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>With Times</name>
    <trkseg>
      <trkpt lat="46.6034" lon="2.5"><ele>200</ele><time>2024-01-01T08:00:00Z</time></trkpt>
      <trkpt lat="46.6134" lon="2.51"><ele>220</ele><time>2024-01-01T10:00:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('GpxParserService', () => {
  let service: GpxParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpxParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseXml', () => {
    it('parses valid GPX and returns GpxData', () => {
      const result = service.parseXml(VALID_GPX);
      expect(result.name).toBe('Test Track');
      expect(result.trackpoints).toHaveSize(3);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    it('extracts lat/lon from trkpt', () => {
      const result = service.parseXml(VALID_GPX);
      expect(result.trackpoints[0].lat).toBeCloseTo(46.6034, 4);
      expect(result.trackpoints[0].lon).toBeCloseTo(2.5, 4);
    });

    it('extracts elevation when present', () => {
      const result = service.parseXml(VALID_GPX);
      expect(result.trackpoints[0].ele).toBe(200);
    });

    it('computes total distance in km', () => {
      const result = service.parseXml(VALID_GPX);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    it('computes elevation gain and loss', () => {
      const result = service.parseXml(VALID_GPX);
      expect(result.totalElevationGain).toBeGreaterThanOrEqual(0);
      expect(result.totalElevationLoss).toBeGreaterThanOrEqual(0);
    });

    it('computes bounds (north/south/east/west)', () => {
      const result = service.parseXml(VALID_GPX);
      expect(result.bounds.north).toBeGreaterThan(result.bounds.south);
      expect(result.bounds.east).toBeGreaterThan(result.bounds.west);
    });

    it('extracts time when present', () => {
      const result = service.parseXml(TRACK_WITH_TIMES);
      expect(result.trackpoints[0].time).toBeTruthy();
    });
  });

  describe('parseGpx (File API)', () => {
    it('returns an Observable that emits GpxData', (done) => {
      const blob = new Blob([VALID_GPX], { type: 'application/xml' });
      const file = new File([blob], 'test.gpx');
      service.parseGpx(file).subscribe((result) => {
        expect(result.name).toBe('Test Track');
        expect(result.trackpoints).toHaveSize(3);
        done();
      });
    });
  });
});