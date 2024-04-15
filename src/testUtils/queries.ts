/**
 * https://testing-library.com/docs/react-testing-library/api/#queries
 */

import { queryHelpers } from '@testing-library/dom';
import { queries as testingLibraryQueries } from '@testing-library/react';

function getAllBySelector(container: HTMLElement, selector: string) {
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

function getBySelector(container: HTMLElement, selector: string) {
  const result = getAllBySelector(container, selector);

  if (result.length > 1) {
    throw queryHelpers.getElementError(`Found multiple elements with the selector ${selector}`, container);
  }
  return result[0] || null;
}

export const queries = {
  ...testingLibraryQueries,
  getAllBySelector,
  getBySelector,
};
