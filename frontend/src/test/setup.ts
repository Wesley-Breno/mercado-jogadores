import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom has the <dialog> element but not showModal().
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true
}
