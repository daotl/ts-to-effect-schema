import { Thread, Worker, spawn } from 'threads'
import {
  ValidateGeneratedTypesProps,
  validateGeneratedTypes,
} from '../core/validateGeneratedTypes'

/**
 * Validate generated types in a worker.
 *
 * @param props
 * @returns List of errors
 */
export async function validateGeneratedTypesInWorker(
  props: ValidateGeneratedTypesProps,
) {
  const validatorWorker = await spawn<typeof validateGeneratedTypes>(
    new Worker('./validator.worker'),
  )

  const errors = await validatorWorker(props)
  Thread.terminate(validatorWorker)

  return errors
}
