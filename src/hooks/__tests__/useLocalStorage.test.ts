import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  const originalSetItem = Storage.prototype.setItem;
  
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    // Restore original localStorage methods
    Storage.prototype.setItem = originalSetItem;
  });

  it('should return initial value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should read from localStorage if available', () => {
    localStorage.setItem('test-key', JSON.stringify('stored value'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('stored value');
  });

  it('should write to localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(result.current[0]).toBe('new value');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new value'));
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('test-key')).toBe('1');
  });

  it('should handle different value types', () => {
    // Object
    const { result: objectResult } = renderHook(() => 
      useLocalStorage('object-key', { name: 'test' })
    );
    expect(objectResult.current[0]).toEqual({ name: 'test' });

    // Array
    const { result: arrayResult } = renderHook(() => 
      useLocalStorage('array-key', [1, 2, 3])
    );
    expect(arrayResult.current[0]).toEqual([1, 2, 3]);

    // Boolean
    const { result: boolResult } = renderHook(() => 
      useLocalStorage('bool-key', true)
    );
    expect(boolResult.current[0]).toBe(true);
  });

  it('should handle errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock localStorage to throw error
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle disabled option', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'initial', { enabled: false })
    );
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(result.current[0]).toBe('new value');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('should sync across tabs/windows', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('from another tab'),
      storageArea: localStorage
    });
    
    act(() => {
      window.dispatchEvent(storageEvent);
    });
    
    expect(result.current[0]).toBe('from another tab');
  });

  it('should handle maxItems option for arrays', () => {
    const { result } = renderHook(() => 
      useLocalStorage<string[]>('test-key', [], { maxItems: 3 })
    );
    
    act(() => {
      result.current[1](['a', 'b', 'c', 'd', 'e']);
    });
    
    expect(result.current[0]).toEqual(['a', 'b', 'c']);
    expect(JSON.parse(localStorage.getItem('test-key') || '[]')).toEqual(['a', 'b', 'c']);
  });

  it('should apply maxItems when using function update', () => {
    const { result } = renderHook(() => 
      useLocalStorage<string[]>('test-key', ['a', 'b'], { maxItems: 3 })
    );
    
    act(() => {
      result.current[1](prev => [...prev, 'c', 'd', 'e']);
    });
    
    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('should not apply maxItems to non-array values', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'string value', { maxItems: 3 })
    );
    
    act(() => {
      result.current[1]('long string value');
    });
    
    expect(result.current[0]).toBe('long string value');
  });
});