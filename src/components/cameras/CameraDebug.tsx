// src/components/cameras/CameraDebug.tsx
// Debug component to test camera operations

'use client'

import React, { useState } from 'react'
import { AlertTriangle, Database, Trash2 } from 'lucide-react'
import { deleteCameraHardware, deactivateCameraDeployment } from '@/lib/cameras/database'
import type { CameraWithStatus } from '@/lib/cameras/types'

interface CameraDebugProps {
  camera: CameraWithStatus
  onRefresh: () => void
}

export function CameraDebug({ camera, onRefresh }: CameraDebugProps) {
  const [debugOutput, setDebugOutput] = useState<string[]>([])
  const [isDebugging, setIsDebugging] = useState(false)

  const addDebugLine = (message: string) => {
    setDebugOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDeleteOperation = async () => {
    if (!camera.hardware?.id) {
      addDebugLine('ERROR: No hardware ID found')
      return
    }

    setIsDebugging(true)
    setDebugOutput([])
    
    try {
      addDebugLine(`Starting delete test for camera ${camera.hardware.device_id}`)
      addDebugLine(`Hardware ID: ${camera.hardware.id}`)
      addDebugLine(`Deployment ID: ${camera.deployment?.id || 'None'}`)
      addDebugLine(`Deployment Active: ${camera.deployment?.active || 'N/A'}`)

      // Test deactivate deployment first if needed
      if (camera.deployment?.active && camera.deployment.id) {
        addDebugLine('Attempting to deactivate deployment...')
        const deactivateResult = await deactivateCameraDeployment(camera.deployment.id)
        addDebugLine(`Deactivate result: ${JSON.stringify(deactivateResult)}`)
        
        if (!deactivateResult.success) {
          addDebugLine(`ERROR: Failed to deactivate deployment: ${deactivateResult.error}`)
          return
        }
      }

      // Test delete hardware
      addDebugLine('Attempting to delete hardware...')
      const deleteResult = await deleteCameraHardware(camera.hardware.id)
      addDebugLine(`Delete result: ${JSON.stringify(deleteResult)}`)
      
      if (deleteResult.success) {
        addDebugLine('SUCCESS: Hardware deleted successfully')
        onRefresh()
      } else {
        addDebugLine(`ERROR: Failed to delete hardware: ${deleteResult.error}`)
      }

    } catch (error) {
      addDebugLine(`EXCEPTION: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Debug delete error:', error)
    } finally {
      setIsDebugging(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="font-medium text-yellow-800">Debug Tools</h3>
      </div>
      
      <button
        onClick={testDeleteOperation}
        disabled={isDebugging}
        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
      >
        {isDebugging ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        ) : (
          <Trash2 size={12} />
        )}
        Test Delete Operation
      </button>

      {debugOutput.length > 0 && (
        <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
          {debugOutput.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}
    </div>
  )
}
