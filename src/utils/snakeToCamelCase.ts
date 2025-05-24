// Converts a snake_case to camelCase
export const snakeToCamelCase = (str: string): string =>
  str.replace(/([-_][a-z0-9])/gi, ($1) =>
    $1.toUpperCase().replace('-', '').replace('_', '')
  );

export const convertObjectFromSnakeToCamelCase = <T>(
  obj: Record<string, unknown> // Change this line
): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj as T; // Return non-objects directly
  }

  if (Array.isArray(obj)) {
    // If it's an array, recursively convert each item
    return obj.map(item => convertObjectFromSnakeToCamelCase(item as Record<string, unknown>)) as T;
  }

  // If it's an object, reduce it by converting keys
  return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => {
    const camelCaseKey = snakeToCamelCase(key);
    // Recursively convert nested objects/arrays
    acc[camelCaseKey] = convertObjectFromSnakeToCamelCase(obj[key] as Record<string, unknown>);
    return acc;
  }, {}) as T;
};
