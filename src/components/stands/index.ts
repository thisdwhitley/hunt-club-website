// src/components/stands/index.ts
// Barrel export for stand components

export { default as StandCard } from './StandCard'
export { default as StandCardDemo } from './StandCardDemo'

// Export types that components might need
export type { Stand, StandFormData, StandFilters } from '@/lib/stands'