// src/components/CalendarView.tsx
'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Target, Wrench, Calendar as CalendarIcon, Users, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
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
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'hunt' | 'maintenance' | 'event'>('all')
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Fetch calendar events
  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  async function fetchEvents() {
    setLoading(true)
    try {
      const startDate = format(calendarStart, 'yyyy-MM-dd')
      const endDate = format(calendarEnd, 'yyyy-MM-dd')

      // Fetch hunt logs
      const { data: huntLogs } = await supabase
        .from('hunt_logs')
        .select(`
          *,
          members:member_id(full_name),
          stands:stand_id(name)
        `)
        .gte('hunt_date', startDate)
        .lte('hunt_date', endDate)
        .order('hunt_date')

      // Fetch maintenance tasks
      const { data: maintenanceTasks } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          members:assigned_to(full_name)
        `)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date')

      // Fetch club events
      const { data: clubEvents } = await supabase
        .from('club_events')
        .select(`
          *,
          members:created_by(full_name)
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date')

      // Combine and format events
      const allEvents: CalendarEvent[] = []

      // Add hunt logs
      huntLogs?.forEach(hunt => {
        allEvents.push({
          id: hunt.id,
          title: hunt.game_type ? `Hunt - ${hunt.game_type}` : 'Hunt Log',
          date: hunt.hunt_date,
          type: 'hunt',
          member: hunt.members?.full_name || 'Unknown',
          location: hunt.stands?.name || 'Unknown location'
        })
      })

      // Add maintenance tasks
      maintenanceTasks?.forEach(task => {
        allEvents.push({
          id: task.id,
          title: task.title,
          date: task.due_date || '',
          type: 'maintenance',
          status: task.status,
          member: task.members?.full_name || 'Unassigned',
          priority: task.priority
        })
      })

      // Add club events
      clubEvents?.forEach(event => {
        allEvents.push({
          id: event.id,
          title: event.title,
          date: event.event_date,
          type: 'event',
          member: event.members?.full_name || 'Unknown',
          location: event.location || undefined
        })
      })

      setEvents(allEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  function getEventsForDate(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(event => 
      event.date === dateStr && 
      (filter === 'all' || event.type === filter)
    )
  }

  function getEventTypeColor(type: string) {
    switch (type) {
      case 'hunt': return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200'
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
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800"
              >
                <option value="all">All Events</option>
                <option value="hunt">Hunt Logs</option>
                <option value="maintenance">Maintenance</option>
                <option value="event">Club Events</option>
              </select>
              
              <button
                onClick={() => handleDateClick(new Date())}
                className="flex items-center px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 text-sm font-medium"
              >
                <Plus size={16} className="mr-2" />
                Add Event
              </button>
            </div>
          </div>
          
          {/* Event Legend */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Hunt Logs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Club Events</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const dayEvents = getEventsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isTodayDate = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                      } ${isTodayDate ? 'ring-2 ring-green-800' : ''}`}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDate ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const Icon = getEventIcon(event.type)
                          return (
                            <div
                              key={event.id}
                              className={`px-2 py-1 rounded text-xs border ${getEventTypeColor(event.type)}`}
                            >
                              <div className="flex items-center space-x-1">
                                <Icon size={10} />
                                <span className="truncate">{event.title}</span>
                              </div>
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

      {/* Today's Events Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Today's Activities</h3>
            </div>
            <div className="p-6">
              {getEventsForDate(new Date()).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activities scheduled for today</p>
              ) : (
                <div className="space-y-4">
                  {getEventsForDate(new Date()).map(event => {
                    const Icon = getEventIcon(event.type)
                    return (
                      <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          event.type === 'hunt' ? 'bg-green-100' :
                          event.type === 'maintenance' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          <Icon size={20} className={
                            event.type === 'hunt' ? 'text-green-600' :
                            event.type === 'maintenance' ? 'text-amber-600' : 'text-blue-600'
                          } />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {event.member && `${event.member}`}
                            {event.location && ` • ${event.location}`}
                          </p>
                        </div>
                        {event.priority && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.priority === 'high' ? 'bg-red-100 text-red-800' :
                            event.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {event.priority}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-green-600" />
                  <span className="text-sm text-gray-600">Hunt Logs</span>
                </div>
                <span className="font-medium">{events.filter(e => e.type === 'hunt').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench size={16} className="text-amber-600" />
                  <span className="text-sm text-gray-600">Maintenance</span>
                </div>
                <span className="font-medium">{events.filter(e => e.type === 'maintenance').length}</span>
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

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center px-3 py-2 text-left text-sm bg-green-50 hover:bg-green-100 rounded-md transition-colors">
                <Target size={16} className="mr-2 text-green-600" />
                Log a Hunt
              </button>
              <button className="w-full flex items-center px-3 py-2 text-left text-sm bg-amber-50 hover:bg-amber-100 rounded-md transition-colors">
                <Wrench size={16} className="mr-2 text-amber-600" />
                Add Maintenance Task
              </button>
              <button className="w-full flex items-center px-3 py-2 text-left text-sm bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                <Users size={16} className="mr-2 text-blue-600" />
                Schedule Club Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal Placeholder */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Event for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <p className="text-gray-600 mb-6">
                Event creation forms will be implemented in the next phase. For now, this shows the calendar structure.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
