// src/lib/utils/date.ts
// Centralized date utilities to handle timezone issues consistently
// 
// CRITICAL: This fixes the issue where database date strings (YYYY-MM-DD)
// get interpreted as UTC by JavaScript's Date constructor, causing dates
// to display as the previous day in local timezone (Eastern Time)

/**
 * Parse a date string from the database safely in local timezone
 * This prevents the common issue where "2025-08-01" gets interpreted as UTC
 * and displays as "2025-07-31" in Eastern time
 * 
 * @param dateString - Date string from database (usually YYYY-MM-DD format)
 * @returns Date object in local timezone, or null if invalid
 */
export function parseDBDate(dateString: string | null): Date | null {
  if (!dateString) return null
  
  // Handle date-only strings (YYYY-MM-DD) by treating them as local dates
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // Month is 0-indexed in JavaScript
  }
  
  // For other date formats (with time), use standard parsing
  return new Date(dateString)
}

/**
 * Format options for date display
 */
export interface FormatDateOptions {
  /** Display style: 'full', 'short', 'relative', or 'hunt' */
  style?: 'full' | 'short' | 'relative' | 'hunt'
  /** Include year in display */
  includeYear?: boolean
}

/**
 * Format a date for display with proper timezone handling
 * 
 * @param dateString - Date string from database
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | null, 
  options: FormatDateOptions = {}
): string {
  if (!dateString) return 'Never'
  
  const { style = 'short', includeYear = false } = options
  const date = parseDBDate(dateString)
  
  if (!date) return 'Invalid date'
  
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  // UPDATED: Hunt-focused formatting - only Today/Yesterday, then actual dates
  if (style === 'hunt') {
    // For anything else, show the actual date
    const formatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    }
    if (includeYear || date.getFullYear() !== now.getFullYear()) {
      formatOptions.year = 'numeric'
    }
    const dateString = date.toLocaleDateString('en-US', formatOptions)

    if (diffInDays === 0) return `Today (${dateString})`
    if (diffInDays === 1) return `Yesterday (${dateString})`

    return dateString
  }

  // Relative formatting for recent dates
  if (style === 'relative' || (style === 'short' && Math.abs(diffInDays) < 7)) {
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays === -1) return 'Tomorrow'
    if (diffInDays > 0 && diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 0 && diffInDays > -7) return `In ${Math.abs(diffInDays)} days`
    if (diffInDays >= 7 && diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays <= -7 && diffInDays > -30) return `In ${Math.floor(Math.abs(diffInDays) / 7)} weeks`
    if (diffInDays >= 30 && diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    if (diffInDays <= -30 && diffInDays > -365) return `In ${Math.floor(Math.abs(diffInDays) / 30)} months`
  }
  
  // Standard formatting
  const formatOptions: Intl.DateTimeFormatOptions = {}
  
  if (style === 'full') {
    formatOptions.weekday = 'long'
    formatOptions.year = 'numeric'
    formatOptions.month = 'long'
    formatOptions.day = 'numeric'
  } else {
    formatOptions.weekday = 'short'
    formatOptions.month = 'short'
    formatOptions.day = 'numeric'
    if (includeYear || date.getFullYear() !== now.getFullYear()) {
      formatOptions.year = 'numeric'
    }
  }
  
  return date.toLocaleDateString('en-US', formatOptions)
}

/**
 * Format a date specifically for hunt logs with optimized display
 * 
 * @param dateString - Hunt date from database
 * @returns Formatted date string optimized for hunt context
 */
export function formatHuntDate(dateString: string | null): string {
  return formatDate(dateString, { style: 'hunt', includeYear: false })
}

/**
 * Format a date for HTML input fields (YYYY-MM-DD format)
 * 
 * @param date - Date object, date string, or null
 * @returns Date string in YYYY-MM-DD format for input fields
 */
export function formatDateForInput(date: Date | string | null): string {
  if (!date) return ''
  
  let parsedDate: Date
  if (typeof date === 'string') {
    parsedDate = parseDBDate(date) || new Date()
  } else {
    parsedDate = date
  }
  
  // Format as YYYY-MM-DD for input fields
  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in YYYY-MM-DD format for database storage
 * 
 * @returns Today's date in database format
 */
export function getTodayForDB(): string {
  return formatDateForInput(new Date())
}

/**
 * Check if a date string represents today
 * 
 * @param dateString - Date string to check
 * @returns True if the date is today
 */
export function isToday(dateString: string | null): boolean {
  if (!dateString) return false
  
  const date = parseDBDate(dateString)
  if (!date) return false
  
  const today = new Date()
  
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

/**
 * Check if a date string represents yesterday
 * 
 * @param dateString - Date string to check
 * @returns True if the date is yesterday
 */
export function isYesterday(dateString: string | null): boolean {
  if (!dateString) return false
  
  const date = parseDBDate(dateString)
  if (!date) return false
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  )
}

/**
 * Format time string for display (handles null/undefined gracefully)
 * 
 * @param timeString - Time string in HH:MM format
 * @returns Formatted time string in 12-hour format, or null if invalid
 */
export function formatTime(timeString?: string | null): string | null {
  if (!timeString) return null
  
  try {
    const [hour, minute] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hour), parseInt(minute))
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } catch (error) {
    console.warn('Invalid time format:', timeString)
    return timeString // Return original if parsing fails
  }
}

/**
 * Calculate days between two dates (accounting for timezone)
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between the dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? parseDBDate(date1) : date1
  const d2 = typeof date2 === 'string' ? parseDBDate(date2) : date2
  
  if (!d1 || !d2) return 0
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format date range for display
 * 
 * @param startDate - Start date string
 * @param endDate - End date string  
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return 'No dates'
  if (!startDate) return `Until ${formatDate(endDate)}`
  if (!endDate) return `From ${formatDate(startDate)}`
  
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  
  if (start === end) return start
  return `${start} - ${end}`
}

/**
 * Validate that a date string is not in the future (for hunt dates)
 * 
 * @param dateString - Date string to validate
 * @returns True if the date is valid for hunt logging
 */
export function isValidHuntDate(dateString: string): boolean {
  const date = parseDBDate(dateString)
  if (!date) return false
  
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  return date <= today
}

/**
 * Convert a local date to the format expected by the database
 * 
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format for database storage
 */
export function formatForDB(date: Date | string): string {
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    date = parseDBDate(date) || new Date()
  }
  
  return formatDateForInput(date)
}

/**
 * Get a human-readable explanation of how long ago a date was
 * Enhanced version of formatDate with 'relative' style
 * 
 * @param dateString - Date string to format
 * @returns Human-readable relative time string
 */
export function getRelativeTimeString(dateString: string | null): string {
  return formatDate(dateString, { style: 'relative' })
}

/**
 * Get hunt type badge styling and label
 * Returns consistent styling for AM/PM/ALL DAY hunt type badges
 *
 * @param huntType - Hunt type string ('AM', 'PM', 'All Day', etc.)
 * @returns Badge configuration with label and styling classes
 */
export function getHuntTypeBadge(huntType?: string | null): {
  label: string
  className: string
} {
  if (!huntType) {
    return {
      label: '?',
      className: 'bg-weathered-wood/10 text-weathered-wood border border-weathered-wood/30'
    }
  }

  const type = huntType.toUpperCase()

  if (type === 'AM' || type.includes('MORNING')) {
    return {
      label: 'AM',
      className: 'bg-bright-orange/10 text-bright-orange border border-bright-orange/30'
    }
  }

  if (type === 'PM' || type.includes('EVENING') || type.includes('AFTERNOON')) {
    return {
      label: 'PM',
      className: 'bg-clay-earth/10 text-clay-earth border border-clay-earth/30'
    }
  }

  if (type === 'ALL DAY' || type.includes('ALL') || type === 'FULL') {
    return {
      label: 'ALL',
      className: 'bg-olive-green/10 text-olive-green border border-olive-green/30'
    }
  }

  // Default fallback
  return {
    label: type.substring(0, 3),
    className: 'bg-weathered-wood/10 text-weathered-wood border border-weathered-wood/30'
  }
}

// Export common combinations for convenience
export const DateFormatters = {
  /** Standard date formatting for most UI contexts */
  standard: (date: string | null) => formatDate(date, { style: 'short' }),

  /** Full date formatting for detailed displays */
  full: (date: string | null) => formatDate(date, { style: 'full' }),

  /** Relative formatting (Today, Yesterday, X days ago) */
  relative: (date: string | null) => formatDate(date, { style: 'relative' }),

  /** Hunt-specific formatting */
  hunt: formatHuntDate,

  /** Input field formatting */
  input: formatDateForInput,

  /** Database storage formatting */
  database: formatForDB
} as const