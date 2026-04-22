import { useState } from 'react'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { TableCard } from '../components/ui/TableCard'
import { Pagination } from '../components/ui/Pagination'
import { dashboardStats, recentActivity } from '../data/mockData'

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  
  // Stat Cards Data
  const statCardsData = dashboardStats

  // Recent Activity Data
  const activityColumns = [
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 flex items-center justify-center text-white ${
            row.type === 'Quote' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-container'
          }`}>
            <span className="material-symbols-outlined text-sm">
              {row.typeIcon}
            </span>
          </div>
          <span className="text-sm font-bold text-primary">{row.type}</span>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <div>
          <p className="text-sm text-primary font-medium">{row.subject}</p>
          <p className="text-xs text-secondary">Requested by: {row.requester}</p>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="text-sm text-secondary font-mono tracking-tight">{row.date}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const statusVariants = {
          'Pending Action': 'error',
          'Under Review': 'warning',
          'Sent to Client': 'success',
          'Action Required': 'error'
        }
        return <Badge variant={statusVariants[row.status]}>{row.status}</Badge>
      }
    }
  ]

  const activityData = [
    {
      type: 'Quote',
      typeIcon: 'request_quote',
      subject: 'HV Transformer Maintenance - Grid X9',
      requester: 'Global Power Solutions',
      date: '2024-05-24 | 09:42',
      status: 'Pending Action'
    },
    {
      type: 'Visit',
      typeIcon: 'calendar_today',
      subject: 'Site Survey: New Industrial Complex',
      requester: 'Urban Infra Corp',
      date: '2024-05-23 | 14:15',
      status: 'Under Review'
    },
    {
      type: 'Quote',
      typeIcon: 'request_quote',
      subject: 'Bulk Supply: Type-C Circuit Breakers',
      requester: 'Advanced Dynamics',
      date: '2024-05-23 | 11:30',
      status: 'Sent to Client'
    },
    {
      type: 'Visit',
      typeIcon: 'calendar_today',
      subject: 'Compliance Audit - Facility B',
      requester: 'National Regulatory Body',
      date: '2024-05-22 | 16:45',
      status: 'Action Required'
    }
  ]

  // Calculate pagination
  const totalPages = Math.ceil(activityData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedActivity = activityData.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-12">
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary uppercase leading-none">
          Operational Overview
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 bg-outline-variant bg-opacity-10 mb-12">
        {statCardsData.map((stat, index) => (
          <StatCard
            key={index}
            {...stat}
          />
        ))}
      </div>

      {/* Recent Activity Table */}
      <TableCard
        title="Recent Request Activity"
        columns={activityColumns}
        data={displayedActivity}
        actions={true}
        viewAllLink="#"
          />
           <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalDisplayed={displayedActivity.length}
          totalItems={activityData.length}
          variant="table"
        />
    </div>
  )
}
