import { useState } from 'react'
import { StatCard } from '../components/ui/StatCard'
import { dashboardStats, recentActivity } from '../data/mockData'

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1)
  
  // Stat Cards Data
  const statCardsData = dashboardStats

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

    </div>
  )
}
