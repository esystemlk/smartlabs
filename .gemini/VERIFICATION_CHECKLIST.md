# ✅ Real Data Integration Checklist

Use this checklist to verify that all mock data has been replaced with real Firebase data.

## 🔧 Setup Tasks

- [ ] **Dev server is running** (`npm run dev`)
- [ ] **Firebase is configured** (check `src/firebase/config.ts`)
- [ ] **Logged in as admin** (for admin panel access)

## 🗄️ Database Initialization

- [ ] **Navigate to** `/admin/data`
- [ ] **Click "Initialize Database"** button
- [ ] **See success message** "Database initialized with default data"
- [ ] **Check Firebase Console** - `site_stats` collection exists
- [ ] **Check Firebase Console** - `testimonials` collection exists

## 🏠 Homepage Verification

### Stats Bar Section
- [ ] **Navigate to** homepage (`/`)
- [ ] **Scroll to stats bar** (after "Meet Our Founder")
- [ ] **Verify displays**: "5,000+ Students Trained"
- [ ] **Verify displays**: "95% Success Rate"
- [ ] **Verify displays**: "6–8 Weeks Target Achievement"
- [ ] **Verify displays**: "24/7 AI Support"

### Hero Section
- [ ] **Check badge** shows "5,000+ Active Learners"
- [ ] **Check trust indicators** show "5.0 (1,200+ reviews)"

### Testimonials Section
- [ ] **Scroll to testimonials** section
- [ ] **See 3 testimonials** displayed
- [ ] **Verify names**: Priya Sharma, Liam Smith, Nimali Perera
- [ ] **Check content** is displaying properly
- [ ] **Verify avatars** show initials (PS, LS, NP)

## 🎛️ Admin Panel Verification

### Current Stats Display
- [ ] **Navigate to** `/admin/data`
- [ ] **See "Current Statistics"** card
- [ ] **Verify shows**: 5,000 Students
- [ ] **Verify shows**: 95% Success Rate
- [ ] **Verify shows**: 6–8 Weeks
- [ ] **Verify shows**: 5.0 Rating

### Update Statistics Form
- [ ] **See form** with all fields populated
- [ ] **Change "Students Count"** to 5100
- [ ] **Click "Update Statistics"** button
- [ ] **See success message**
- [ ] **Go to homepage** and verify shows 5,100
- [ ] **Change back to 5000** (optional)

## 👤 User Activity Tracking

### New User Signup
- [ ] **Open incognito window**
- [ ] **Navigate to** `/signup`
- [ ] **Create test account** with email/password
- [ ] **Check Firebase Console** - `users` collection
- [ ] **Find your test user** document
- [ ] **Check subcollection** `activities`
- [ ] **Verify activity** "Account Created" exists

### AI Test Completion
- [ ] **Login with test account**
- [ ] **Navigate to** homepage
- [ ] **Scroll to AI Lab** section
- [ ] **Write sample essay** (at least 50 characters)
- [ ] **Click "ANALYZE NOW"** button
- [ ] **Wait for results**
- [ ] **Check Firebase Console** - user's `activities` subcollection
- [ ] **Verify activity** "PTE Write Essay - AI Scoring" exists

## 🔄 Data Updates

### Test Real-time Updates
- [ ] **Open two browser windows**
- [ ] **Window 1**: Homepage
- [ ] **Window 2**: `/admin/data`
- [ ] **In Window 2**: Change student count to 5555
- [ ] **In Window 1**: Hard refresh (Ctrl+Shift+R)
- [ ] **Verify** homepage shows 5,555 students
- [ ] **Reset** to original value

### Test Testimonials
- [ ] **Open Firebase Console**
- [ ] **Navigate to** `testimonials` collection
- [ ] **Click on any testimonial** document
- [ ] **Change `isActive`** to `false`
- [ ] **Refresh homepage**
- [ ] **Verify** testimonial is hidden
- [ ] **Change back** to `true`

## 🧪 Error Handling

### Test Offline Behavior
- [ ] **Open browser DevTools**
- [ ] **Go to Network tab**
- [ ] **Set to "Offline"**
- [ ] **Refresh homepage**
- [ ] **Verify** shows default values (5,000 students, etc.)
- [ ] **Set back to "Online"**
- [ ] **Refresh** - should show real data again

### Test Missing Data
- [ ] **Open Firebase Console**
- [ ] **Temporarily delete** `site_stats/global_stats` document
- [ ] **Refresh homepage**
- [ ] **Verify** shows default fallback values
- [ ] **Re-initialize** from admin panel

## 📱 Cross-Browser Testing

- [ ] **Chrome**: All features work
- [ ] **Firefox**: All features work
- [ ] **Safari**: All features work (if on Mac)
- [ ] **Edge**: All features work

## 🎯 Final Verification

### Data Flow Check
- [ ] **New signup** → Student count increases
- [ ] **AI test** → Activity logged
- [ ] **Admin update** → Homepage reflects change
- [ ] **All stats** pulling from Firebase
- [ ] **All testimonials** pulling from Firebase

### Performance Check
- [ ] **Homepage loads** in < 3 seconds
- [ ] **Stats display** without flicker
- [ ] **No console errors**
- [ ] **No TypeScript errors**

## 📊 Firebase Console Verification

### Collections Exist
- [ ] `site_stats` collection
- [ ] `testimonials` collection
- [ ] `users` collection
- [ ] `users/{userId}/activities` subcollection
- [ ] `user_test_limits` collection

### Data Structure Correct
- [ ] **site_stats/global_stats** has all fields
- [ ] **testimonials** have required fields
- [ ] **activities** have correct structure

## 🎉 Success Criteria

**All checkboxes above should be checked!**

If everything is ✅, your website is now using **100% real data** for:
- Site statistics
- Testimonials
- User activities
- Test tracking

## 🐛 If Something's Not Working

1. **Check browser console** for errors
2. **Check Firebase Console** for data
3. **Verify Firestore rules** allow reads/writes
4. **Check network tab** for failed requests
5. **Review** `REAL_DATA_SUMMARY.md` for details

## 📝 Notes

Use this space to track any issues or customizations:

```
Date: ___________
Issues found:
-
-
-

Customizations made:
-
-
-
```

---

**Congratulations!** 🎊 Your website now uses real, dynamic data from Firebase!
