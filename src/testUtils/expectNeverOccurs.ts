import { waitFor } from '@testing-library/react';

export async function expectNeverOccurs(negativeAssertionFn: () => unknown) {
  await expect(waitFor(negativeAssertionFn)).rejects.toThrow();
}
