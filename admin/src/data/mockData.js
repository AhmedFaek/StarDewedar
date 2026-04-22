// Sample data for development and testing
// Can be replaced with API calls later

export const dashboardStats = [
    {
        label: 'Total Products',
        value: '1,284',
        icon: 'inventory_2',
        variant: 'default'
    },
    {
        label: 'Total Projects',
        value: '42',
        icon: 'architecture',
        variant: 'default'
    },
    {
        label: 'New Quote Requests',
        value: '18',
        icon: 'request_quote',
        variant: 'tertiary',
        badge: true
    },
    {
        label: 'New Visit Requests',
        value: '07',
        icon: 'calendar_today',
        variant: 'gradient'
    }
]

export const recentActivity = [
    {
        id: 1,
        type: 'Quote',
        typeIcon: 'request_quote',
        subject: 'HV Transformer Maintenance - Grid X9',
        requester: 'Global Power Solutions',
        date: '2024-05-24 | 09:42',
        status: 'Pending Action'
    },
    {
        id: 2,
        type: 'Visit',
        typeIcon: 'calendar_today',
        subject: 'Site Survey: New Industrial Complex',
        requester: 'Urban Infra Corp',
        date: '2024-05-23 | 14:15',
        status: 'Under Review'
    },
    {
        id: 3,
        type: 'Quote',
        typeIcon: 'request_quote',
        subject: 'Bulk Supply: Type-C Circuit Breakers',
        requester: 'Advanced Dynamics',
        date: '2024-05-23 | 11:30',
        status: 'Sent to Client'
    },
    {
        id: 4,
        type: 'Visit',
        typeIcon: 'calendar_today',
        subject: 'Compliance Audit - Facility B',
        requester: 'National Regulatory Body',
        date: '2024-05-22 | 16:45',
        status: 'Action Required'
    }
]

export const products = [
    {
        id: 1,
        name: 'High Voltage Transformer',
        sku: 'HVT-2400-A1',
        category: 'Transformers',
        price: 12500,
        stock: 24,
        status: 'In Stock'
    },
    {
        id: 2,
        name: 'Circuit Breaker Type-C',
        sku: 'CB-200-C',
        category: 'Breakers',
        price: 450,
        stock: 156,
        status: 'In Stock'
    },
    {
        id: 3,
        name: 'Power Distribution Panel',
        sku: 'PDP-1200-X',
        category: 'Panels',
        price: 8900,
        stock: 8,
        status: 'Low Stock'
    }
]

export const projects = [
    {
        id: 1,
        name: 'Industrial Grid Modernization',
        client: 'National Power Authority',
        status: 'On-Track',
        progress: 65,
        dueDate: '2024-08-15',
        budget: 500000
    },
    {
        id: 2,
        name: 'Factory Electrification Project',
        client: 'Global Manufacturing Inc',
        status: 'On-Track',
        progress: 45,
        dueDate: '2024-09-30',
        budget: 350000
    },
    {
        id: 3,
        name: 'Smart Grid Implementation',
        client: 'Urban Development Corp',
        status: 'At Risk',
        progress: 30,
        dueDate: '2024-07-20',
        budget: 750000
    }
]

export const quoteRequests = [
    {
        id: 1,
        type: 'Quote',
        subject: 'HV Transformer Maintenance - Grid X9',
        requester: 'Global Power Solutions',
        date: '2024-05-24',
        status: 'Pending Action'
    },
    {
        id: 2,
        type: 'Quote',
        subject: 'Bulk Supply: Type-C Circuit Breakers',
        requester: 'Advanced Dynamics',
        date: '2024-05-23',
        status: 'Sent to Client'
    }
]

export const visitRequests = [
    {
        id: 1,
        type: 'Visit',
        subject: 'Site Survey: New Industrial Complex',
        requester: 'Urban Infra Corp',
        date: '2024-05-23',
        status: 'Under Review'
    },
    {
        id: 2,
        type: 'Visit',
        subject: 'Compliance Audit - Facility B',
        requester: 'National Regulatory Body',
        date: '2024-05-22',
        status: 'Action Required'
    }
]
