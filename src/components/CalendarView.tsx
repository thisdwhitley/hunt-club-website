// src/components/CalendarView.tsx (Enhanced with hunting club colors and restored functionality)
'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Target, Wrench, Calendar, Users, Eye, Lock, Globe, Star, Filter } from 'lucide-react'
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
  calendarName?: string
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'hunt' | 'maintenance' | 'event'>('all')
  const [showGoogleEvents, setShowGoogleEvents] = useState(false)
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchAllEvents()
  }, [])

  async function fetchSupabaseEvents(): Promise<CalendarEvent[]> {
    try {
      let allEvents: CalendarEvent[] = []

      // Always fetch public events
      const { data: publicEvents } = await supabase
        .from('club_events')
        .select(`
          id,
          title,
          description,
          event_date,
          event_type,
          created_by,
          is_public,
          members:created_by(full_name)
        `)
        .eq('is_public', true)
        .order('event_date', { ascending: false })

      if (publicEvents) {
        allEvents.push(...publicEvents.map(event => ({
          id: `event-${event.id}`,
          title: event.title,
          date: event.event_date,
          type: 'event' as const,
          member: event.members?.full_name || 'Unknown',
          isPublic: true,
          source: 'supabase' as const
        })))
      }

      // If user is authenticated, fetch additional private events
      if (user) {
        // Fetch hunt logs
        const { data: hunts } = await supabase
          .from('hunt_logs')
          .select(`
            id,
            hunt_date,
            member_id,
            stand_id,
            species,
            success,
            members:member_id(full_name),
            stands:stand_id(name)
          `)
          .order('hunt_date', { ascending: false })

        if (hunts) {
          allEvents.push(...hunts.map(hunt => ({
            id: `hunt-${hunt.id}`,
            title: `${hunt.species || 'Hunt'} - ${hunt.members?.full_name || 'Unknown'}`,
            date: hunt.hunt_date,
            type: 'hunt' as const,
            status: hunt.success ? 'successful' : 'unsuccessful',
            member: hunt.members?.full_name || 'Unknown',
            location: hunt.stands?.name || undefined,
            isPublic: false,
            source: 'supabase' as const
          })))
        }

        // Fetch maintenance tasks
        const { data: maintenanceTasks } = await supabase
          .from('maintenance_tasks')
          .select(`
            id,
            title,
            description,
            priority,
            status,
            due_date,
            assigned_to,
            members:assigned_to(full_name)
          `)
          .order('due_date', { ascending: true })

        if (maintenanceTasks) {
          allEvents.push(...maintenanceTasks.map(task => ({
            id: `maintenance-${task.id}`,
            title: task.title,
            date: task.due_date,
            type: 'maintenance' as const,
            status: task.status,
            member: task.members?.full_name || 'Unassigned',
            priority: task.priority,
            isPublic: false,
            source: 'supabase' as const
          })))
        }

        // Fetch private club events
        const { data: privateEvents } = await supabase
          .from('club_events')
          .select(`
            id,
            title,
            description,
            event_date,
            event_type,
            created_by,
            is_public,
            members:created_by(full_name)
          `)
          .eq('is_public', false)
          .order('event_date', { ascending: false })

        if (privateEvents) {
          allEvents.push(...privateEvents.map(event => ({
            id: `private-event-${event.id}`,
            title: event.title,
            date: event.event_date,
            type: 'event' as const,
            member: event.members?.full_name || 'Unknown',
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

      const googleEvents = await clientGoogleCalendarService.getEvents(startDate, endDate)
      
      return googleEvents.map(event => ({
        id: `google-${event.id}`,
        title: event.title,
        date: event.start.split('T')[0], // Extract date part
        type: 'google' as const,
        location: event.location || undefined,
        isPublic: event.isPublic,
        source: 'google' as const,
        isAllDay: event.isAllDay,
        calendarName: event.calendarName
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
      const googleCalendarEvents = await fetchGoogleEvents()
      setGoogleEvents(googleCalendarEvents)
    } else {
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

  const getEventColor = (type: string, status?: string, priority?: string, calendarName?: string) => {
    switch (type) {
      case 'hunt':
        return status === 'successful' 
          ? 'bg-olive-green/10 border-olive-green text-olive-green'
          : 'bg-pine-needle/10 border-pine-needle text-pine-needle'
      case 'maintenance':
        if (priority === 'high') return 'bg-clay-earth/10 border-clay-earth text-clay-earth'
        if (priority === 'medium') return 'bg-muted-gold/10 border-muted-gold text-muted-gold'
        return 'bg-sunset-amber/10 border-sunset-amber text-sunset-amber'
      case 'event':
        return 'bg-burnt-orange/10 border-burnt-orange text-burnt-orange'
      case 'google':
        if (calendarName === 'Holidays') {
          return 'bg-clay-earth/10 border-clay-earth text-clay-earth'
        }
        return 'bg-dark-teal/10 border-dark-teal text-dark-teal'
      default:
        return 'bg-weathered-wood/10 border-weathered-wood text-weathered-wood'
    }
  }

  const getEventIcon = (type: string, calendarName?: string) => {
    switch (type) {
      case 'hunt':
        return Target
      case 'maintenance':
        return Wrench
      case 'event':
        return Calendar
      case 'google':
        if (calendarName === 'Holidays') {
          return Star
        }
        return Globe
      default:
        return Calendar
    }
  }

  // Group Google events by calendar for the legend
  const googleCalendarTypes = [...new Set(googleEvents.map(e => e.calendarName))].filter(Boolean)

  if (loading) {
    return (
      <div className="bg-white rounded-lg club-shadow p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green mx-auto"></div>
          <p className="text-weathered-wood mt-2">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Public notice for non-authenticated users */}
      {!user && (
        <div className="bg-burnt-orange/10 border-l-4 border-burnt-orange p-4 mb-6">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-burnt-orange mr-2" />
            <div>
              <p className="text-sm text-clay-earth">
                <strong>Public View:</strong> You're seeing public events only.{' '}
                <Link href="/login" className="ml-1 underline hover:text-forest-shadow">
                  Sign in
                </Link> to view all club activities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="bg-white rounded-lg club-shadow mb-6">
        <div className="p-6 border-b border-morning-mist">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-2xl font-bold text-forest-shadow">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-morning-mist rounded-md"
                >
                  <ChevronLeft size={20} className="text-weathered-wood" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-morning-mist rounded-md"
                >
                  <ChevronRight size={20} className="text-weathered-wood" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Event Type Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-weathered-wood" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-olive-green"
                >
                  <option value="all">All Events</option>
                  <option value="hunt">Hunts</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="event">Club Events</option>
                </select>
              </div>

              {/* Google Calendar Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showGoogleEvents}
                  onChange={(e) => handleGoogleCalendarToggle(e.target.checked)}
                  className="text-olive-green focus:ring-olive-green"
                  disabled={googleCalendarLoading}
                />
                <span className="text-sm text-weathered-wood">Google Calendar</span>
                {googleCalendarLoading && (
                  <div className="w-4 h-4 border-2 border-olive-green border-t-transparent rounded-full animate-spin"></div>
                )}
              </label>

              {/* Add Event Button */}
              {user && (
                <Link
                  href="/events/new"
                  className="inline-flex items-center px-4 py-2 bg-burnt-orange text-white rounded-md hover:bg-clay-earth transition-colors text-sm font-medium"
                >
                  <Plus size={16} className="mr-2" />
                  Add Event
                </Link>
              )}
            </div>
          </div>

          {/* Event Type Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-olive-green/20 border border-olive-green rounded"></div>
              <span className="text-weathered-wood">Hunts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted-gold/20 border border-muted-gold rounded"></div>
              <span className="text-weathered-wood">Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-burnt-orange/20 border border-burnt-orange rounded"></div>
              <span className="text-weathered-wood">Club Events</span>
            </div>
            {googleCalendarTypes.map((calendarName) => (
              <div key={calendarName} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded border ${
                  calendarName === 'Holidays' 
                    ? 'bg-clay-earth/20 border-clay-earth' 
                    : 'bg-dark-teal/20 border-dark-teal'
                }`}></div>
                <span className="text-weathered-wood">{calendarName}</span>
              </div>
            ))}
            {showGoogleEvents && googleCalendarTypes.length === 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-dark-teal/20 rounded border border-dark-teal"></div>
                <span className="text-weathered-wood">Google Calendar</span>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-weathered-wood">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-morning-mist rounded-lg overflow-hidden">
            {calendarDays.map(date => {
              const dayEvents = getEventsForDate(date)
              const isCurrentMonth = isSameMonth(date, currentDate)
              const isCurrentDay = isToday(date)
              const IconComponent = dayEvents.length > 0 ? getEventIcon(dayEvents[0].type, dayEvents[0].calendarName) : null
              
              return (
                <div
                  key={date.toISOString()}
                  className={`
                    bg-white p-2 min-h-[100px] cursor-pointer hover:bg-morning-mist/50 transition-colors
                    ${!isCurrentMonth ? 'text-weathered-wood' : ''}
                    ${isCurrentDay ? 'bg-olive-green/5' : ''}
                  `}
                  onClick={() => handleDateClick(date)}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isCurrentDay ? 'text-olive-green font-bold' : isCurrentMonth ? 'text-forest-shadow' : 'text-weathered-wood'}
                  `}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const EventIcon = getEventIcon(event.type, event.calendarName)
                      return (
                        <div
                          key={event.id}
                          className={`
                            text-xs px-2 py-1 rounded border truncate flex items-center
                            ${getEventColor(event.type, event.status, event.priority, event.calendarName)}
                          `}
                          title={event.title}
                        >
                          <EventIcon size={12} className="mr-1 flex-shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-weathered-wood px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg club-shadow max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-forest-shadow mb-4">
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <div className="space-y-2 mb-4">
              {getEventsForDate(selectedDate).map((event) => {
                const EventIcon = getEventIcon(event.type, event.calendarName)
                return (
                  <div
                    key={event.id}
                    className={`p-3 rounded border ${getEventColor(event.type, event.status, event.priority, event.calendarName)}`}
                  >
                    <div className="flex items-center">
                      <EventIcon size={16} />
                      <span className="ml-2 font-medium">{event.title}</span>
                    </div>
                    {event.member && (
                      <div className="text-sm mt-1">Member: {event.member}</div>
                    )}
                    {event.location && (
                      <div className="text-sm mt-1">Location: {event.location}</div>
                    )}
                    {event.status && (
                      <div className="text-sm mt-1">Status: {event.status}</div>
                    )}
                    {event.priority && (
                      <div className="text-sm mt-1">Priority: {event.priority}</div>
                    )}
                  </div>
                )
              })}
              {getEventsForDate(selectedDate).length === 0 && (
                <div className="text-weathered-wood text-center py-4">
                  No events scheduled for this date
                </div>
              )}
            </div>
            <button
              onClick={() => setShowEventModal(false)}
              className="w-full px-4 py-2 bg-olive-green text-white rounded-md hover:bg-pine-needle transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
