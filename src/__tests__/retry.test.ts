import { retry } from '../retry';

describe('retry', () => {

  it('should return the fn value if the process was ok', async () => {
    const fn = jest.fn(async () => 10);

    const result = await retry(fn, { maxRetries: 2 });
    expect(result).toEqual(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should stop retrying is the process was ok', async () => {
    let firstCall = true;
    const fn = jest.fn(async () => {
      if (firstCall) {
        firstCall = false;
        throw new Error('First call')
      } else {
        return 10;
      }
    });

    const result = await retry(fn, { maxRetries: 2 });
    expect(result).toEqual(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should stop if maxRetries is reached', async () => {
    const fn = jest.fn(async () => {
      throw new Error('Fail')
    });

    let error;
    try {
      await retry(fn, { maxRetries: 3 });
    } catch (e) {
      error = e;
    }

    expect(error?.message).toMatch(/Process failed/);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
