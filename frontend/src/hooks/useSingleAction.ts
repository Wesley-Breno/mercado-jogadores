import { useState } from 'react'

/**
 * Runs an action that is not a form, such as confirming a deletion. The flag turns on in the click
 * itself, so the button is already disabled for a second click; a refusal keeps its `message`.
 */
export function useSingleAction() {
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  function run<T>(request: () => Promise<T>, onDone: (result: T) => void) {
    setPending(true)
    setError(undefined)
    request().then(
      (result) => {
        setPending(false)
        onDone(result)
      },
      (failure: Error) => {
        setPending(false)
        setError(failure.message)
      },
    )
  }

  return { run, isPending, error }
}
