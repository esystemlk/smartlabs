# Data Flow Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Homepage   │  │  Admin Panel │  │ Signup Page  │        │
│  │  (page.tsx)  │  │  (/admin)    │  │  (/signup)   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REACT HOOKS                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │useSiteStats()│  │useTestimonials│ │useUserActivity│        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │stats.service │  │testimonials  │  │activity      │        │
│  │              │  │.service      │  │.service      │        │
│  │- getStats()  │  │- getActive() │  │- logActivity()│       │
│  │- update()    │  │- add()       │  │- getActivities│       │
│  │- increment() │  │- update()    │  │- logTest()   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIREBASE FIRESTORE                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ site_stats/  │  │testimonials/ │  │  users/{id}/ │        │
│  │global_stats  │  │  {doc}       │  │  activities/ │        │
│  │              │  │              │  │    {doc}     │        │
│  │• students: 5k│  │• name        │  │• type        │        │
│  │• success: 95%│  │• role        │  │• title       │        │
│  │• weeks: 6-8  │  │• content     │  │• timestamp   │        │
│  │• rating: 5.0 │  │• avatar      │  │• metadata    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Examples

### Example 1: Homepage Loads Stats

```
1. User visits homepage
   └─> Homepage component mounts
       └─> useSiteStats() hook called
           └─> stats.service.getSiteStats()
               └─> Firebase query: site_stats/global_stats
                   └─> Returns: { studentsCount: 5000, successRate: 95, ... }
                       └─> Hook updates state
                           └─> Component re-renders with real data
                               └─> User sees: "5,000+ Students Trained"
```

### Example 2: New User Signs Up

```
1. User fills signup form
   └─> Clicks "Sign Up" button
       └─> createUserWithEmailAndPassword()
           └─> User created in Firebase Auth
               └─> handleAuthSuccess() called
                   ├─> Creates user document in Firestore
                   ├─> incrementStudentCount()
                   │   └─> Updates site_stats/global_stats
                   │       └─> studentsCount: 5000 → 5001
                   └─> logUserActivity()
                       └─> Creates activity in users/{uid}/activities
                           └─> { type: 'enrollment', title: 'Account Created' }
```

### Example 3: User Completes AI Test

```
1. User writes essay
   └─> Clicks "ANALYZE NOW"
       └─> handleAnalyze() function
           ├─> Calls AI scoring API
           │   └─> Returns: { overallScore: 75, ... }
           ├─> Updates usage count
           │   └─> user_test_limits/{uid}
           └─> logTestCompletion()
               └─> Creates activity in users/{uid}/activities
                   └─> { type: 'test', title: 'PTE Write Essay', score: 75 }
```

### Example 4: Admin Updates Stats

```
1. Admin goes to /admin/data
   └─> Fills "Update Statistics" form
       └─> Changes studentsCount to 6000
           └─> Clicks "Update Statistics"
               └─> updateSiteStats({ studentsCount: 6000 })
                   └─> Firebase update: site_stats/global_stats
                       └─> studentsCount: 5001 → 6000
                           └─> Success message shown
                               └─> Homepage auto-updates on next load
```

## 📊 Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Hero Section                                            │  │
│  │ ┌─────────────────────────────────────────────────────┐ │  │
│  │ │ Badge: "5,000+ Active Learners" ← siteStats.count  │ │  │
│  │ │ Trust: "5.0 (1,200+ reviews)" ← siteStats.rating   │ │  │
│  │ └─────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Stats Bar                                               │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │ │ 5,000+   │ │   95%    │ │  6-8     │ │  24/7    │  │  │
│  │ │ Students │ │ Success  │ │  Weeks   │ │   AI     │  │  │
│  │ │    ↑     │ │    ↑     │ │    ↑     │ │    ↑     │  │  │
│  │ └────┼─────┘ └────┼─────┘ └────┼─────┘ └────┼─────┘  │  │
│  │      └────────────┴──────────────┴───────────┘         │  │
│  │                    siteStats                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Testimonials Section                                    │  │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │  │
│  │ │ Priya   │ │  Liam   │ │ Nimali  │                   │  │
│  │ │ Sharma  │ │  Smith  │ │ Perera  │                   │  │
│  │ │  PTE:85 │ │ IELTS:8.5│ │CELPIP:12│                  │  │
│  │ └─────────┘ └─────────┘ └─────────┘                   │  │
│  │         ↑           ↑           ↑                       │  │
│  │         └───────────┴───────────┘                       │  │
│  │           realTestimonials[]                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ AI Lab Section                                          │  │
│  │ ┌─────────────────────────────────────────────────────┐ │  │
│  │ │ User writes essay → Clicks "ANALYZE"                │ │  │
│  │ │ → AI scores → logTestCompletion()                   │ │  │
│  │ │ → Activity saved to Firebase                        │ │  │
│  │ └─────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Data Security

```
Firebase Security Rules (Recommended):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Site stats - read by all, write by admin only
    match /site_stats/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Testimonials - read by all, write by admin only
    match /testimonials/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User activities - read/write by owner only
    match /users/{userId}/activities/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users - read/write by owner, read by admin
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎯 Performance Optimization

```
Optimization Strategies:

1. Caching
   ├─ React hooks cache data in state
   ├─ Prevents unnecessary Firebase calls
   └─ Updates only when needed

2. Fallback Values
   ├─ Default values if Firebase fails
   ├─ Graceful degradation
   └─ No broken UI

3. Efficient Queries
   ├─ Query only active testimonials
   ├─ Limit results (e.g., 10 activities)
   └─ Use indexes for fast retrieval

4. Error Handling
   ├─ Try-catch in all services
   ├─ User-friendly error messages
   └─ Console logging for debugging
```

## 📈 Scalability

```
Current Capacity:
├─ Site Stats: 1 document (lightweight)
├─ Testimonials: Unlimited documents
├─ User Activities: Unlimited per user
└─ Auto-scaling with Firebase

Growth Handling:
├─ Student count auto-increments
├─ Activities grow per user
├─ Testimonials can be paginated
└─ Firebase handles millions of docs
```

---

**This architecture ensures:**
- ✅ Clean separation of concerns
- ✅ Easy to maintain and extend
- ✅ Type-safe throughout
- ✅ Production-ready
- ✅ Scalable to millions of users
