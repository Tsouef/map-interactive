import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed', delay: 500 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Rapid changes
    rerender({ value: 'change1', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    rerender({ value: 'change2', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    rerender({ value: 'change3', delay: 500 });
    
    // Should still have initial value
    expect(result.current).toBe('initial');

    // Complete delay from last change
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should have the last value
    expect(result.current).toBe('change3');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change delay
    rerender({ value: 'initial', delay: 200 });
    rerender({ value: 'changed', delay: 200 });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(result.current).toBe('changed');
  });

  it('should handle different value types', () => {
    // Number
    const { result: numberResult } = renderHook(() => useDebounce(42, 100));
    expect(numberResult.current).toBe(42);

    // Object
    const obj = { name: 'test' };
    const { result: objectResult } = renderHook(() => useDebounce(obj, 100));
    expect(objectResult.current).toBe(obj);

    // Array
    const arr = [1, 2, 3];
    const { result: arrayResult } = renderHook(() => useDebounce(arr, 100));
    expect(arrayResult.current).toBe(arr);
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'changed', delay: 500 });
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'changed', delay: 0 });
    
    act(() => {
      jest.runAllTimers();
    });
    
    expect(result.current).toBe('changed');
  });
});