# Implementation Plan: Connect Mock Data to Real Firebase Backend

## Overview
This plan outlines how to replace all mock/static data in the Smart Labs website with real data from Firebase Firestore.

## Current Mock Components Identified

### 1. **Homepage (page.tsx)**
- ✅ **AI Score Tester** - Already working with real AI
- ❌ **Stats Bar** - Static numbers (5000+ Students, 95% Success Rate, etc.)
- ❌ **Testimonials** - Hardcoded testimonials array
- ❌ **Desktop App Download** - Static link

### 2. **Videos Page**
- ❌ **YouTube Videos** - Has mock data fallback when API keys missing
- ✅ **Already has real YouTube API integration**

### 3. **Dashboard**
- ❌ **Recent Activity** - Mock activity data
- ❌ **Mock Credits** - Static display
- ❌ **Progress Stats** - Hardcoded values

### 4. **Mock Tests**
- ❌ **Mock Test Courses** - Hardcoded array
- ❌ **Test Results** - Not stored in database

### 5. **Resources Library**
- ❌ **Resource Items** - Hardcoded in constants.ts

### 6. **Notifications**
- ❌ **Header Notifications** - Mock notifications array

## Firebase Collections Structure

### Existing Collections:
- `users` - User authentication data
- `user_test_limits` - AI test usage tracking
- `enrollments` - Course enrollments
- `payments` - Payment records

### New Collections Needed:

```
1. site_stats (single document)
   - studentsCount: number
   - successRate: number
   - targetWeeks: string
   - reviewsCount: number
   - rating: number

2. testimonials
   - name: string
   - role: string
   - content: string
   - avatar: string
   - color: string
   - course: string
   - achievement: string
   - createdAt: timestamp
   - isActive: boolean

3. resources
   - id: string
   - type: 'test' | 'video' | 'list'
   - title: string
   - format: string
   - url: string
   - category: 'PTE' | 'IELTS' | 'CELPIP' | 'General'
   - isActive: boolean
   - createdAt: timestamp

4. notifications
   - id: string
   - title: string
   - message: string
   - type: 'info' | 'success' | 'warning'
   - isActive: boolean
   - createdAt: timestamp
   - expiresAt: timestamp

5. user_activity (subcollection under users/{userId})
   - activityType: 'test' | 'lesson' | 'achievement'
   - title: string
   - description: string
   - timestamp: timestamp
   - metadata: object

6. mock_tests
   - id: string
   - title: string
   - description: string
   - category: 'PTE' | 'IELTS' | 'CELPIP'
   - duration: number (minutes)
   - sections: array
   - isActive: boolean
   - createdAt: timestamp

7. test_results (subcollection under users/{userId})
   - testId: string
   - testType: string
   - score: number
   - breakdown: object
   - completedAt: timestamp
   - timeSpent: number
```

## Implementation Steps

### Phase 1: Database Setup & Admin Panel
1. Create Firestore collections with initial data
2. Build admin panel to manage:
   - Site statistics
   - Testimonials
   - Resources
   - Notifications
   - Mock tests

### Phase 2: Homepage Real Data Integration
1. Replace static stats with Firebase data
2. Load testimonials from Firestore
3. Add real-time updates for student count

### Phase 3: User Activity & Progress
1. Track user activities in Firestore
2. Display real activity feed in dashboard
3. Store and retrieve test results

### Phase 4: Resources & Downloads
1. Move resources to Firestore
2. Add file upload capability for PDFs
3. Track download analytics

### Phase 5: Notifications System
1. Create notification management system
2. Display real notifications in header
3. Add user notification preferences

### Phase 6: Mock Tests Enhancement
1. Store mock test configurations in Firestore
2. Save user test attempts
3. Generate detailed analytics

## Priority Order
1. **HIGH**: Site stats, Testimonials (homepage credibility)
2. **HIGH**: User activity tracking (engagement)
3. **MEDIUM**: Resources library (content management)
4. **MEDIUM**: Notifications system (user engagement)
5. **LOW**: Mock test configurations (already functional)

## Technical Implementation Details

### Services to Create:
```typescript
// src/lib/services/stats.service.ts
- getSiteStats()
- updateSiteStats()

// src/lib/services/testimonials.service.ts
- getActiveTestimonials()
- addTestimonial()
- updateTestimonial()

// src/lib/services/activity.service.ts
- logUserActivity()
- getUserActivities()

// src/lib/services/resources.service.ts
- getResources()
- getResourcesByCategory()

// src/lib/services/notifications.service.ts
- getActiveNotifications()
- markAsRead()
```

### React Hooks to Create:
```typescript
// src/hooks/use-site-stats.ts
// src/hooks/use-testimonials.ts
// src/hooks/use-user-activity.ts
// src/hooks/use-resources.ts
// src/hooks/use-notifications.ts
```

## Benefits of Implementation
1. **Dynamic Content**: Easy to update without code changes
2. **Real Analytics**: Track actual user engagement
3. **Scalability**: Support growing user base
4. **Admin Control**: Non-technical staff can manage content
5. **Personalization**: Tailor experience per user
6. **Trust**: Real-time stats build credibility

## Estimated Timeline
- Phase 1: 2-3 hours
- Phase 2: 2 hours
- Phase 3: 3 hours
- Phase 4: 2 hours
- Phase 5: 2 hours
- Phase 6: 3 hours

**Total: 14-15 hours**
