export const convertAssertionsToQueryParams = (code: string) => code.replace(
    /import\s+(?:[\W\w]*?\sfrom\s+(?:"(?:[^"]|\\")*"|'(?:[^']|\\')*')(\s+assert\s+([^}]+\})))/gm,
    (statement, assertions, assertionType) => {
      return assertions
        ? statement.slice(0, -assertions.length - 1) +
            '?' +
            new URLSearchParams(JSON.parse(assertionType.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": '))).toString() +
            statement[statement.length - assertions.length - 1]
        : statement;
    }
  )