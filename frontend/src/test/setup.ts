import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// On a busy machine the first screen of a test file can take longer than the default 1 s to render.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => {
  cleanup()
})

// jsdom has the <dialog> element but not showModal().
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true
}
