// src/components/CalendarView.tsx (Fixed - only client-side imports)
'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Target, Wrench, Calendar as CalendarIcon, Users, Filter, Lock, Eye, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { clientGoogleCalendarService } from '@/lib/services/clientGoogleCalendar'
import Link from 'next/link'
import type { Database } from '@/lib/types/database'

type HuntLog = Database['public']['Tables']['hunt_logs']['Row'] & {
  members: { full_name: string | null } | null
  stands: { name: string } | null
}

type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row'] & {
  members: { full_name: string | null } | null
}

type ClubEvent = Database['public']['Tables']['club_events']['Row'] & {
  members: { full_name: string | null } | null
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'hunt' | 'maintenance' | 'event' | 'google'
  status?: string
  member?: string
  location?: string
  priority?: string
  isPublic?: boolean
  source?: 'supabase' | 'google'
  isAllDay?: boolean
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showGoogleEvents, setShowGoogleEvents] = useState(true)
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchAllEvents()
  }, [currentDate, user])

  async function fetchSupabaseEvents(): Promise<CalendarEvent[]> {
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      // Fetch public club events (always visible)
      const { data: clubEvents } = await supabase
        .from('club_events')
        .select(`
          *,
          members:created_by (full_name)
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .eq('is_public', true)
        .order('event_date')

      let allEvents: CalendarEvent[] = []

      // Add public club events
      if (clubEvents) {
        allEvents.push(...clubEvents.map(event => ({
          id: `club-${event.id}`,
          title: event.title,
          date: event.event_date,
          type: 'event' as const,
          member: event.members?.full_name || 'Unknown',
          location: event.location || undefined,
          isPublic: event.is_public,
          source: 'supabase' as const
        })))
      }

      // If user is authenticated, fetch member-only events
      if (user) {
        // Fetch private club events
        const { data: privateClubEvents } = await supabase
          .from('club_events')
          .select(`
            *,
            members:created_by (full_name)
          `)
          .gte('event_date', startDate)
          .lte('event_date', endDate)
          .eq('is_public', false)
          .order('event_date')

        // Fetch hunt logs
        const { data: huntLogs } = await supabase
          .from('hunt_logs')
          .select(`
            *,
            members:member_id (full_name),
            stands:stand_id (name)
          `)
          .gte('hunt_date', startDate)
          .lte('hunt_date', endDate)
          .order('hunt_date')

        // Fetch maintenance tasks
        const { data: maintenanceTasks } = await supabase
          .from('maintenance_tasks')
          .select(`
            *,
            members:assigned_to (full_name)
          `)
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date')

        // Add private club events
        if (privateClubEvents) {
          allEvents.push(...privateClubEvents.map(event => ({
            id: `club-private-${event.id}`,
            title: event.title,
            date: event.event_date,
            type: 'event' as const,
            member: event.members?.full_name || 'Unknown',
            location: event.location || undefined,
            isPublic: event.is_public,
            source: 'supabase' as const
          })))
        }

        // Add hunt logs
        if (huntLogs) {
          allEvents.push(...huntLogs.map(hunt => ({
            id: `hunt-${hunt.id}`,
            title: `Hunt - ${hunt.stands?.name || 'Unknown Stand'}`,
            date: hunt.hunt_date,
            type: 'hunt' as const,
            member: hunt.members?.full_name || 'Unknown',
            location: hunt.stands?.name || undefined,
            isPublic: false,
            source: 'supabase' as const
          })))
        }

        // Add maintenance tasks
        if (maintenanceTasks) {
          allEvents.push(...maintenanceTasks.map(task => ({
            id: `maintenance-${task.id}`,
            title: task.task,
            date: task.due_date,
            type: 'maintenance' as const,
            status: task.status,
            member: task.members?.full_name || 'Unassigned',
            priority: task.priority,
            isPublic: false,
            source: 'supabase' as const
          })))
        }
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching Supabase events:', error)
      return []
    }
  }

  async function fetchGoogleEvents(): Promise<CalendarEvent[]> {
    if (!showGoogleEvents) return []
    
    setGoogleCalendarLoading(true)
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      console.log('Fetching Google Calendar events...')
      const googleEvents = await clientGoogleCalendarService.getEvents(startDate, endDate)
      console.log(`Retrieved ${googleEvents.length} Google Calendar events`)
      
      return googleEvents.map(event => ({
        id: `google-${event.id}`,
        title: event.title,
        date: event.start.split('T')[0], // Extract date part
        type: 'google' as const,
        location: event.location || undefined,
        isPublic: event.isPublic,
        source: 'google' as const,
        isAllDay: event.isAllDay
      }))
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error)
      return []
    } finally {
      setGoogleCalendarLoading(false)
    }
  }

  async function fetchAllEvents() {
    setLoading(true)
    try {
      const [supabaseEvents, googleCalendarEvents] = await Promise.all([
        fetchSupabaseEvents(),
        fetchGoogleEvents()
      ])

      setEvents(supabaseEvents)
      setGoogleEvents(googleCalendarEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle Google Calendar toggle
  const handleGoogleCalendarToggle = async (enabled: boolean) => {
    setShowGoogleEvents(enabled)
    if (enabled) {
      // Fetch Google events if enabling
      const googleCalendarEvents = await fetchGoogleEvents()
      setGoogleEvents(googleCalendarEvents)
    } else {
      // Clear Google events if disabling
      setGoogleEvents([])
    }
  }

  // Combine all events for display
  const allEvents = [...events, ...googleEvents]

  // Filter events based on current filter
  const filteredEvents = allEvents.filter(event => {
    if (filter === 'all') return true
    return event.type === filter
  })

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowEventModal(true)
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(new Date(event.date), date))
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'hunt':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'event':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'google':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'hunt':
        return Target
      case 'maintenance':
        return Wrench
      case 'event':
        return CalendarIcon
      case 'google':
        return Globe
      default:
        return CalendarIcon
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Public notice for non-authenticated users */}
      {!user && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-blue-400 mr-2" />
            <div>
              <p className="text-sm text-blue-700">
                <strong>Public View:</strong> You're seeing public events only.{' '}
                <Link href="/login" className="ml-1 underline hover:text-blue-900">
                  Sign in
                </Link> to view all club activities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Google Calendar Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showGoogleEvents}
                  onChange={(e) => handleGoogleCalendarToggle(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  Show Google Calendar
                  {googleCalendarLoading && (
                    <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  )}
                </span>
              </label>

              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Events</option>
                <option value="hunt">Hunts</option>
                <option value="maintenance">Maintenance</option>
                <option value="event">Club Events</option>
                <option value="google">Google Calendar</option>
              </select>

              {/* Add Event Button - Only for authenticated users */}
              {user && (
                <button
                  onClick={() => setShowEventModal(true)}
                  className="flex items-center px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Add Event
                </button>
              )}
            </div>
          </div>

          {/* Event Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-200 rounded border border-green-300"></div>
              <span>Hunts {!user && '(Members Only)'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-200 rounded border border-yellow-300"></div>
              <span>Maintenance {!user && '(Members Only)'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded border border-blue-300"></div>
              <span>Club Events</span>
            </div>
            {showGoogleEvents && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-200 rounded border border-purple-300"></div>
                <span>Google Calendar</span>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading calendar...</p>
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {calendarDays.map(date => {
                  const dayEvents = getEventsForDate(date)
                  const isCurrentMonth = isSameMonth(date, currentDate)
                  const isCurrentDay = isToday(date)
                  
                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors
                        ${!isCurrentMonth ? 'text-gray-400' : ''}
                        ${isCurrentDay ? 'bg-green-50' : ''}
                      `}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentDay ? 'text-green-800' : ''}
                      `}>
                        {format(date, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const Icon = getEventIcon(event.type)
                          return (
                            <div
                              key={event.id}
                              className={`
                                text-xs px-2 py-1 rounded border truncate flex items-center space-x-1
                                ${getEventColor(event.type)}
                              `}
                            >
                              <Icon size={10} />
                              <span className="truncate">
                                {event.title}
                                {!user && !event.isPublic && <Lock size={10} className="inline ml-1" />}
                              </span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:flex lg:space-x-6">
        <div className="lg:w-1/3 space-y-6">
          {/* Event Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-green-600" />
                  <span className="text-sm text-gray-600">
                    Hunts {!user && '(Members Only)'}
                  </span>
                </div>
                <span className="font-medium">
                  {user ? allEvents.filter(e => e.type === 'hunt').length : '?'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench size={16} className="text-yellow-600" />
                  <span className="text-sm text-gray-600">
                    Maintenance {!user && '(Members Only)'}
                  </span>
                </div>
                <span className="font-medium">
                  {user ? allEvents.filter(e => e.type === 'maintenance').length : '?'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarIcon size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Club Events</span>
                </div>
                <span className="font-medium">
                  {allEvents.filter(e => e.type === 'event').length}
                </span>
              </div>
              {showGoogleEvents && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe size={16} className="text-purple-600" />
                    <span className="text-sm text-gray-600">Google Calendar</span>
                  </div>
                  <span className="font-medium">
                    {googleEvents.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedDate ? `Events for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Add Event'}
              </h3>
              {selectedDate && (
                <div className="mb-4">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border mb-2 ${getEventColor(event.type)}`}>
                      <div className="flex items-center space-x-2">
                        {React.createElement(getEventIcon(event.type), { size: 16 })}
                        <span className="font-medium">{event.title}</span>
                        {!user && !event.isPublic && <Lock size={12} />}
                        {event.source === 'google' && <Globe size={12} />}
                      </div>
                      {event.member && (
                        <p className="text-sm mt-1">By: {event.member}</p>
                      )}
                      {event.location && (
                        <p className="text-sm mt-1">Location: {event.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-gray-600 mb-6">
                {user 
                  ? "Event creation forms will be implemented in the next phase."
                  : "Please sign in to create and manage events."
                }
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                {!user && (
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
