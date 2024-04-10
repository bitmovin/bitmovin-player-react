/**
 * https://testing-library.com/docs/react-testing-library/api/#queries
 */

import { queryHelpers } from "@testing-library/dom";
import { queries as testingLibraryQueries } from "@testing-library/react";

function getAllByTagName(
  container: HTMLElement,
  tagName: keyof JSX.IntrinsicElements,
) {
  return Array.from(container.querySelectorAll<HTMLElement>(tagName));
}

function getByTagName(
  container: HTMLElement,
  tagName: keyof JSX.IntrinsicElements,
) {
  const result = getAllByTagName(container, tagName);

  if (result.length > 1) {
    throw queryHelpers.getElementError(
      `Found multiple elements with the tag ${tagName}`,
      container,
    );
  }
  return result[0] || null;
}

export const queries = {
  ...testingLibraryQueries,
  getAllByTagName,
  getByTagName,
};
