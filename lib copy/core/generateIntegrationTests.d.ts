import ts from 'typescript';
interface TestCase {
    effectType: string;
    tsType: string;
}
/**
 * Generate integration tests to validate if the generated effect schemas
 * are equals to the originals types.
 *
 * ```ts
 * expectType<${tsType}>({} as ${effectType})
 * expectType<${effectType}>({} as ${tsType})
 * ```
 */
export declare function generateIntegrationTests(testCases: TestCase[]): ts.CallExpression[];
export {};
