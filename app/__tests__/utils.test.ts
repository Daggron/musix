import {fmtTime} from '../src/utils';

describe('fmtTime', () => {
  it('formats zero seconds', () => {
    expect(fmtTime(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(fmtTime(5)).toBe('0:05');
    expect(fmtTime(45)).toBe('0:45');
  });

  it('formats exact minutes', () => {
    expect(fmtTime(60)).toBe('1:00');
    expect(fmtTime(120)).toBe('2:00');
  });

  it('formats minutes and seconds', () => {
    expect(fmtTime(65)).toBe('1:05');
    expect(fmtTime(193)).toBe('3:13');
  });

  it('pads single-digit seconds', () => {
    expect(fmtTime(61)).toBe('1:01');
    expect(fmtTime(609)).toBe('10:09');
  });

  it('handles large values', () => {
    expect(fmtTime(3661)).toBe('61:01');
  });

  it('floors fractional seconds', () => {
    expect(fmtTime(62.7)).toBe('1:02');
    expect(fmtTime(0.9)).toBe('0:00');
  });
});
