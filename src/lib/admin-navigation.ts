export type AdminTool={title:string;description:string;href:string;developerOnly?:boolean};
export const adminNavigation: {title:string;items:AdminTool[]}[] = [
  {
    "title": "People",
    "items": [
      {
        "title": "User Management",
        "description": "Edit roles, ban, and manage all accounts",
        "href": "/admin/dashboard/users"
      },
      {
        "title": "Enrollments",
        "description": "Approve and manage student enrollments",
        "href": "/admin/dashboard/enrollments"
      },
      {
        "title": "Partners",
        "description": "Referral programme — commission rates & partner management",
        "href": "/partners/admin"
      },
      {
        "title": "Email Campaign",
        "description": "Send the re-engagement email to registered users",
        "href": "/admin/campaign"
      },
      {
        "title": "IELTS Enrolments",
        "description": "Assign paid IELTS students to a batch · email + WhatsApp",
        "href": "/admin/dashboard/ielts-enrollments"
      }
    ]
  },
  {
    "title": "Courses & content",
    "items": [
      {
        "title": "Course Management",
        "description": "Add, edit, or delete courses & lessons",
        "href": "/admin/dashboard/courses"
      },
      {
        "title": "PTE Batch Manager",
        "description": "Open batches students register & pay to join",
        "href": "/admin/dashboard/pte-batches"
      },
      {
        "title": "Class Recordings",
        "description": "Bunny video links, pricing & student access",
        "href": "/admin/dashboard/recordings"
      },
      {
        "title": "Recorded Packages",
        "description": "Monthly recorded-session bundles from Bunny",
        "href": "/admin/dashboard/recorded-packages"
      },
      {
        "title": "Resource Library",
        "description": "Upload and organise learning materials",
        "href": "/admin/dashboard/resources"
      },
      {
        "title": "Blog Management",
        "description": "Publish and edit articles & announcements",
        "href": "/admin/dashboard/blog"
      },
      {
        "title": "Workshop Management",
        "description": "Free monthly workshops — dates & slots",
        "href": "/admin/dashboard/workshops"
      },
      {
        "title": "Webinar Management",
        "description": "Webinar registrations and recordings",
        "href": "/admin/dashboard/webinars"
      },
      {
        "title": "Session Manager",
        "description": "Active Zoom session links for live classes",
        "href": "/admin/dashboard/sessions"
      }
    ]
  },
  {
    "title": "Payments & credits",
    "items": [
      {
        "title": "Payment Settings",
        "description": "PayHere merchant config and course prices",
        "href": "/admin/dashboard/payments/settings"
      },
      {
        "title": "Payment History",
        "description": "Browse and export all transactions",
        "href": "/admin/dashboard/payments"
      },
      {
        "title": "AI Credits Earnings",
        "description": "Successful AI-credit payments — weekly, monthly and yearly totals",
        "href": "/admin/dashboard/ai-credits-earnings"
      },
      {
        "title": "Credit Manager",
        "description": "All students holding credits + gift/deduct universal AI credits",
        "href": "/admin/dashboard/credit-manager"
      },
      {
        "title": "Essay Credit Manager",
        "description": "Give or adjust essay scoring & gen credits",
        "href": "/admin/dashboard/essay-credits"
      },
      {
        "title": "IELTS Essay Credits",
        "description": "Give or adjust IELTS essay scoring credits",
        "href": "/admin/dashboard/ielts-essay-credits"
      }
    ]
  },
  {
    "title": "Practice & results",
    "items": [
      {
        "title": "Question Bank",
        "description": "Manage PTE practice questions (Writing active)",
        "href": "/admin/dashboard/question-bank"
      },
      {
        "title": "Mock Tests",
        "description": "Build timed writing mocks from the question bank",
        "href": "/admin/dashboard/mock-tests"
      },
      {
        "title": "IELTS Mock Results",
        "description": "Search a student by email · view & download their mock results",
        "href": "/admin/dashboard/ielts-mocks"
      },
      {
        "title": "Level Test Results",
        "description": "Student diagnostic reports & analytics",
        "href": "/admin/dashboard/level-tests"
      }
    ]
  },
  {
    "title": "Student support",
    "items": [
      {
        "title": "Certificate Requests",
        "description": "Review and issue PTE certificates",
        "href": "/admin/dashboard/certificates"
      },
      {
        "title": "Support Center",
        "description": "Manage student queries and tickets",
        "href": "/admin/dashboard/support"
      }
    ]
  },
  {
    "title": "Website & system",
    "items": [
      {
        "title": "Seasonal Themes",
        "description": "Halloween visuals, yearly schedule, sound and preview",
        "href": "/admin/dashboard/seasonal-themes"
      },
      {
        "title": "AI API Settings",
        "description": "Developer-only API configuration and usage",
        "href": "/admin/dashboard/ai-settings",
        "developerOnly": true
      }
    ]
  }
];
