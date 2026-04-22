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
        id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1-555-010-9988',
        email: 'j.doe@globalpower.com',
        product_id: 'prod-101',
        details: 'Urgent maintenance quote for HV Transformer - Grid X9. Need breakdown of labor costs.',
        custom_product_name: null,
        file_url: 'https://storage.sys/docs/x9-specs.pdf',
        status: 'new',
        created_at: '2024-05-24T10:00:00Z'
    },
    {
        id: '671f9511-f30c-52e5-b827-557766551111',
        first_name: 'Sarah',
        last_name: 'Jenkins',
        phone: '+1-555-022-3344',
        email: 's.jenkins@adv-dynamics.net',
        product_id: null,
        details: 'Custom bulk supply request for Type-C Circuit Breakers with reinforced casing.',
        custom_product_name: 'Type-C Circuit Breaker (Reinforced)',
        file_url: null,
        status: 'contacted',
        created_at: '2024-05-23T14:30:00Z'
    }
];

export const visitRequests = [
    {
        id: '772g0622-g41d-63f6-c938-668877662222',
        factory_name: 'Urban Infra Corp - Site A',
        factory_activity: 'New Industrial Complex Construction',
        name: 'Michael Chen',
        phone_number: '+1-555-888-0000',
        whatsapp_number: '+15558880000',
        email: 'm.chen@urbaninfra.org',
        address: '404 Industrial Way, North Sector',
        preferred_date: '2024-06-15',
        details: 'Site survey needed to assess power grid connectivity for the new phase.',
        status: 'new',
        created_at: '2024-05-23T09:15:00Z'
    },
    {
        id: '883h1733-h52e-74g7-d049-779988773333',
        factory_name: 'NRB Facility B',
        factory_activity: 'Regulatory Compliance Audit',
        name: 'Elena Rodriguez',
        phone_number: '+1-555-111-2222',
        whatsapp_number: '+15551112222',
        email: 'e.rodriguez@nrb.gov',
        address: '10 Government Plaza, Central District',
        preferred_date: '2024-06-10',
        details: 'Annual safety and compliance audit. Require access to all transformer rooms.',
        status: 'contacted',
        created_at: '2024-05-22T11:45:00Z'
    }
];

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

export const contactMessages = [
    {
        id: '994i2844-i63f-85h8-e150-880099884444',
        first_name: 'David',
        last_name: 'Miller',
        email: 'd.miller@techgrid.com',
        phone_number: '+1-555-999-8888',
        whatsapp_number: '+15559998888',
        message: 'Hello, we are interested in a long-term partnership for transformer components. Who is the right person to speak with regarding procurement?',
        created_at: '2024-05-21T08:00:00Z'
    },
    {
        id: '005j3955-j74g-96i9-f261-991100995555',
        first_name: 'Sophia',
        last_name: 'Wang',
        email: 'sophia.w@buildcorp.cn',
        phone_number: '+86-10-8888-9999',
        whatsapp_number: null,
        message: 'I am writing to report a technical issue with the Type-C circuit breaker installed last week at our East Facility. It seems to be tripping under nominal load.',
        created_at: '2024-05-20T16:20:00Z'
    }
];