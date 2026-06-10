// Ethics tab — restricted to users with ethicsAccess = true
// Access check is done server-side; this component is only rendered if allowed

export default function EthicsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 font-medium">Restricted access — Ethics file</p>
        <p className="text-xs text-yellow-700 mt-1">
          Ethics reports and documentation will be displayed here in a future phase.
          This tab is visible only to HR staff with ethics access clearance.
        </p>
      </div>
    </div>
  )
}
