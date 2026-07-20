/** Splits CSS values only at separators outside parentheses. */
export function splitCssTopLevel(input: string, separator: 'comma' | 'space'): string[] {
  const tokens: string[] = []
  let depth = 0
  let current = ''
  for (const character of input) {
    if (character === '(')
      depth += 1
    else if (character === ')')
      depth = Math.max(0, depth - 1)

    const isSeparator = depth === 0 && (separator === 'comma' ? character === ',' : /\s/.test(character))
    if (isSeparator) {
      if (current.trim())
        tokens.push(current.trim())
      current = ''
    }
    else {
      current += character
    }
  }
  if (current.trim())
    tokens.push(current.trim())
  return tokens
}
