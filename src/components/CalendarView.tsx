// src/components/CalendarView.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Target, Wrench, Calendar as CalendarIcon, Users, Filter, Lock, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
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
  type: 'hunt' | 'maintenance' | 'event'
  status?: string
  member?: string
  location?: string
  priority?: string
  isPublic?: boolean
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [currentDate, user])

  async function fetchEvents() {
    setLoading(true)
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
        .eq('is_public', true) // Only fetch public events for non-authenticated users
        .order('event_date')

      let allEvents: CalendarEvent[] = []

      // Add public club events
      if (clubEvents) {
        allEvents = [
          ...allEvents,
          ...clubEvents.map(event => ({
            id: `event-${event.id}`,
            title: event.title,
            date: event.event_date,
            type: 'event' as const,
            member: event.members?.full_name || 'Club',
            location: event.location || undefined,
            isPublic: true
          }))
        ]
      }

      // If user is authenticated, fetch additional private data
      if (user) {
        // Fetch private club events
        const { data: privateEvents } = await supabase
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

        // Add private events
        if (privateEvents) {
          allEvents = [
            ...allEvents,
            ...privateEvents.map(event => ({
              id: `event-${event.id}`,
              title: event.title,
              date: event.event_date,
              type: 'event' as const,
              member: event.members?.full_name || 'Club',
              location: event.location || undefined,
              isPublic: false
            }))
          ]
        }

        // Add hunt logs
        if (huntLogs) {
          allEvents = [
            ...allEvents,
            ...huntLogs.map(hunt => ({
              id: `hunt-${hunt.id}`,
              title: `${hunt.game_harvested ? 'Harvest' : 'Hunt'} - ${hunt.stands?.name || 'Unknown Stand'}`,
              date: hunt.hunt_date,
              type: 'hunt' as const,
              member: hunt.members?.full_name || 'Unknown',
              location: hunt.stands?.name || undefined
            }))
          ]
        }

        // Add maintenance tasks
        if (maintenanceTasks) {
          allEvents = [
            ...allEvents,
            ...maintenanceTasks.map(task => ({
              id: `maintenance-${task.id}`,
              title: task.title,
              date: task.due_date,
              type: 'maintenance' as const,
              status: task.status,
              member: task.members?.full_name || 'Unassigned',
              priority: task.priority
            }))
          ]
        }
      }

      setEvents(allEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    return event.type === filter
  })

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  })

  function getEventsForDate(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return filteredEvents.filter(event => event.date === dateStr)
  }

  function getEventColor(type: string) {
    switch (type) {
      case 'hunt': return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'event': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  function getEventIcon(type: string) {
    switch (type) {
      case 'hunt': return Target
      case 'maintenance': return Wrench
      case 'event': return CalendarIcon
      default: return CalendarIcon
    }
  }

  function nextMonth() {
    setCurrentDate(addMonths(currentDate, 1))
  }

  function prevMonth() {
    setCurrentDate(subMonths(currentDate, 1))
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date)
    setShowEventModal(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Auth Status Banner */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye size={20} className="text-blue-600" />
              <span className="text-blue-800 font-medium">Public View</span>
            </div>
            <div className="text-sm text-blue-700">
              Showing public events only. 
              <Link href="/login" className="ml-1 underline hover:text-blue-900">
                Sign in
              </Link> to view all club activities.
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
                        {dayEvents.slice(0, 2).map(event => {
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
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 2} more
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
                  {user ? events.filter(e => e.type === 'hunt').length : '?'}
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
                  {user ? events.filter(e => e.type === 'maintenance').length : '?'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarIcon size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Club Events</span>
                </div>
                <span className="font-medium">{events.filter(e => e.type === 'event').length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions - Only for authenticated users */}
          {user && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center px-3 py-2 text-left text-sm bg-green-50 hover:bg-green-100 rounded-md transition-colors">
                  <Target size={16} className="mr-2 text-green-600" />
                  Log a Hunt
                </button>
                <button className="w-full flex items-center px-3 py-2 text-left text-sm bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors">
                  <Wrench size={16} className="mr-2 text-yellow-600" />
                  Add Maintenance Task
                </button>
                <button className="w-full flex items-center px-3 py-2 text-left text-sm bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                  <Users size={16} className="mr-2 text-blue-600" />
                  Schedule Club Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
