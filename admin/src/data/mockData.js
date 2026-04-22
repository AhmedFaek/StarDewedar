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
        category: 'Transformers',
        price: 12500,
        stock: 24,
    },
    {
        id: 2,
        name: 'Circuit Breaker Type-C',
        category: 'Breakers',
        price: 450,
        stock: 156,
    },
    {
        id: 3,
        name: 'Power Distribution Panel',
        category: 'Panels',
        price: 8900,
        stock: 8,
    }
]

export const projects = [
    {
        id: 1,
        name: 'Industrial Grid Modernization',
        client: 'National Power Authority',
        endDate: '2024-08-15',
        startDate: '2024-05-01',
        budget: 500000
    },
    {
        id: 2,
        name: 'Factory Electrification Project',
        client: 'Global Manufacturing Inc',
        endDate: '2024-09-30',
        startDate: '2024-05-01',
        budget: 350000
    },
    {
        id: 3,
        name: 'Smart Grid Implementation',
        client: 'Urban Development Corp',
        endDate: '2024-07-20',
        startDate: '2024-05-01',
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

export const categories = [
    {
        id: 'c0e2a1b4-5781-4f1e',
        name: 'Transformer Assemblies',
        type: 'Product',
        createdDate: '2023-10-12 09:42'
    },
    {
        id: 'f47ac10b-58cc-4372',
        name: 'Substation Grid Renewal',
        type: 'Project',
        createdDate: '2023-11-04 14:20'
    },
    {
        id: 'd12f3b9a-7e11-49a2',
        name: 'Smart Metering Modules',
        type: 'Product',
        createdDate: '2023-12-01 08:15'
    },
    {
        id: 'a98b7c6d-3e4f-4a1b',
        name: 'Voltage Regulation Phase II',
        type: 'Project',
        createdDate: '2024-01-14 16:55'
    },
    {
        id: 'b7f9e2c1-4a3d-5b6e',
        name: 'Distribution Network Infrastructure',
        type: 'Product',
        createdDate: '2024-02-08 11:30'
    },
    {
        id: 'e5d8a1c2-9f7e-3g4h',
        name: 'Industrial Automation Solutions',
        type: 'Product',
        createdDate: '2024-02-20 13:45'
    }
]
