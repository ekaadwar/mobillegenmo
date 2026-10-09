import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {useDebounce} from '../android/app/src/hooks/useDebounce';
import {normalizeYearRange} from '../android/app/src/components/cars/YearRangeFilter';

function DebounceProbe({value}: {value: string}) {
  const debouncedValue = useDebounce(value, 1000);
  return <Text>{debouncedValue}</Text>;
}

describe('catalog filter behavior', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits 1000ms and restarts the debounce on rapid input changes', () => {
    jest.useFakeTimers();
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(<DebounceProbe value="M" />);
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    act(() => {
      renderer.update(<DebounceProbe value="Ma" />);
    });
    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(renderer.root.findByType(Text).props.children).toBe('M');

    act(() => jest.advanceTimersByTime(1));
    expect(renderer.root.findByType(Text).props.children).toBe('Ma');
    act(() => renderer.unmount());
  });

  it('normalizes reversed and identical year selections', () => {
    expect(normalizeYearRange(2026, 2019)).toEqual({start_year: 2019, end_year: 2026});
    expect(normalizeYearRange(2022, 2022)).toEqual({start_year: 2022, end_year: 2022});
  });
});