import type {
  DeepPartial,
  Mutable,
  ValueOf,
  EnsureArray,
  Callback,
  AsyncCallback,
  CodedError,
} from '../utils';

describe('Utility Types', () => {
  it('should create DeepPartial type correctly', () => {
    interface ComplexType {
      id: string;
      data: {
        name: string;
        settings: {
          enabled: boolean;
          count: number;
        };
      };
      items: string[];
    }

    const partial: DeepPartial<ComplexType> = {
      data: {
        settings: {
          enabled: true,
        },
      },
    };

    expect(partial.id).toBeUndefined();
    expect(partial.data?.name).toBeUndefined();
    expect(partial.data?.settings?.enabled).toBe(true);
    expect(partial.data?.settings?.count).toBeUndefined();
  });

  it('should create Mutable type correctly', () => {
    interface ReadonlyType {
      readonly id: string;
      readonly count: number;
      readonly items: readonly string[];
    }

    const mutable: Mutable<ReadonlyType> = {
      id: 'test',
      count: 5,
      items: ['a', 'b'],
    };

    // Should be able to mutate
    mutable.id = 'changed';
    mutable.count = 10;
    mutable.items.push('c');

    expect(mutable.id).toBe('changed');
    expect(mutable.count).toBe(10);
    expect(mutable.items).toEqual(['a', 'b', 'c']);
  });

  it('should extract ValueOf type correctly', () => {
    type Config = {
      theme: 'dark';
      count: 42;
      enabled: true;
    };

    type ConfigValue = ValueOf<Config>;
    
    const value1: ConfigValue = 'dark';
    const value2: ConfigValue = 42;
    const value3: ConfigValue = true;

    expect(value1).toBe('dark');
    expect(value2).toBe(42);
    expect(value3).toBe(true);
  });

  it('should handle EnsureArray type correctly', () => {
    type SingleOrArray = string | string[];
    
    const ensured1: EnsureArray<string> = ['test'];
    const ensured2: EnsureArray<string[]> = ['test1', 'test2'];
    const ensured3: EnsureArray<SingleOrArray> = ['test'];

    expect(Array.isArray(ensured1)).toBe(true);
    expect(Array.isArray(ensured2)).toBe(true);
    expect(Array.isArray(ensured3)).toBe(true);
  });

  it('should handle Callback types correctly', () => {
    const voidCallback: Callback = () => {
      console.log('no params');
    };

    const stringCallback: Callback<string> = (message: string) => {
      console.log(message);
    };

    const complexCallback: Callback<{ id: string; value: number }> = (data) => {
      console.log(data.id, data.value);
    };

    expect(typeof voidCallback).toBe('function');
    expect(typeof stringCallback).toBe('function');
    expect(typeof complexCallback).toBe('function');
  });

  it('should handle AsyncCallback types correctly', () => {
    const asyncVoid: AsyncCallback = async () => {
      await Promise.resolve();
    };

    const asyncString: AsyncCallback<string> = async (message: string) => {
      await Promise.resolve(message);
    };

    const asyncComplex: AsyncCallback<{ id: string }> = async (data) => {
      await Promise.resolve(data.id);
    };

    expect(asyncVoid()).toBeInstanceOf(Promise);
    expect(asyncString('test')).toBeInstanceOf(Promise);
    expect(asyncComplex({ id: 'test' })).toBeInstanceOf(Promise);
  });

  it('should handle CodedError correctly', () => {
    const error: CodedError = {
      name: 'ValidationError',
      message: 'Invalid zone geometry',
      code: 'INVALID_GEOMETRY',
      details: {
        zoneId: 'zone-1',
        reason: 'Self-intersecting polygon',
      },
    };

    expect(error.code).toBe('INVALID_GEOMETRY');
    expect(error.details.zoneId).toBe('zone-1');
    expect(error.message).toBe('Invalid zone geometry');
  });
});