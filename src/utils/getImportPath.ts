import { parse, relative } from 'path'
import slash from 'slash'

/**
 * Resolve the path of an import.
 *
 * @param from path of the current file
 * @param to path of the import file
 * @returns relative path without extension
 */
export function getImportPath(from: string, to: string) {
  const relativePath = slash(relative(from, to).slice(1))
  const { dir, name } = parse(relativePath)

  return `${dir}/${name}`
}
