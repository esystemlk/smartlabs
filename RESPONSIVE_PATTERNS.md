# Quick Reference: Responsive Design Patterns Used

## Tailwind Breakpoints

```
Default (mobile): 0px - 479px
xs:              480px - 639px
sm:              640px - 767px
md:              768px - 1023px
lg:              1024px - 1279px
xl:              1280px - 1535px
2xl:             1536px+
```

---

## Common Responsive Patterns

### 1. Padding & Spacing

```tsx
// Section padding (vertical)
className="py-12 sm:py-16 lg:py-28"
// Mobile: 48px, Small: 64px, Large: 112px

// Container padding (horizontal)
className="px-3 sm:px-6 lg:px-8"
// Mobile: 12px, Small: 24px, Large: 32px

// Card padding
className="p-4 sm:p-6 md:p-8"
// Mobile: 16px, Small: 24px, Medium: 32px

// Gaps between elements
className="gap-3 sm:gap-4 lg:gap-6"
// Mobile: 12px, Small: 16px, Large: 24px

// Margins
className="mb-4 sm:mb-6 lg:mb-8"
// Mobile: 16px, Small: 24px, Large: 32px
```

### 2. Typography

```tsx
// Main headings (H1)
className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl"
// Mobile: 24px, Small: 36px, Medium: 48px, Large: 60px

// Section headings (H2)
className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
// Mobile: 24px, Small: 30px, Medium: 36px, Large: 48px

// Subheadings (H3)
className="text-lg sm:text-xl"
// Mobile: 18px, Small: 20px

// Body text
className="text-sm sm:text-base lg:text-lg"
// Mobile: 14px, Small: 16px, Large: 18px

// Small text
className="text-xs sm:text-sm"
// Mobile: 12px, Small: 14px

// Badges/Tags
className="text-xs sm:text-sm"
// Mobile: 12px, Small: 14px
```

### 3. Icons & Images

```tsx
// Large icons
className="h-6 w-6 sm:h-8 sm:w-8"
// Mobile: 24px, Small: 32px

// Medium icons
className="h-5 w-5 sm:h-6 sm:w-6"
// Mobile: 20px, Small: 24px

// Small icons
className="h-4 w-4 sm:h-5 sm:w-5"
// Mobile: 16px, Small: 20px

// Icon containers
className="w-10 h-10 sm:w-12 sm:h-12"
// Mobile: 40px, Small: 48px

// Large icon containers
className="w-12 h-12 sm:w-16 sm:h-16"
// Mobile: 48px, Small: 64px
```

### 4. Border Radius

```tsx
// Cards
className="rounded-2xl sm:rounded-3xl"
// Mobile: 16px, Small: 24px

// Buttons/Badges
className="rounded-xl sm:rounded-2xl"
// Mobile: 12px, Small: 16px

// Small elements
className="rounded-lg sm:rounded-xl"
// Mobile: 8px, Small: 12px
```

### 5. Grid Layouts

```tsx
// Single to double to triple column
className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3"
// Mobile: 1 col, XS: 2 cols, Small: 3 cols

// Single to double to triple (with md breakpoint)
className="grid md:grid-cols-2 lg:grid-cols-3"
// Mobile: 1 col, Medium: 2 cols, Large: 3 cols

// Stats grid
className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"
// Mobile: 1 col (16px gap), XS: 2 cols, Small: 3 cols (24px gap)
```

### 6. Flexbox Layouts

```tsx
// Stack on mobile, row on larger screens
className="flex flex-col sm:flex-row gap-3 sm:gap-4"
// Mobile: column (12px gap), Small: row (16px gap)

// Full width on mobile, auto on larger
className="w-full sm:w-auto"
// Mobile: 100%, Small: auto

// Center on mobile, left on larger
className="items-center sm:items-start"
// Mobile: centered, Small: left-aligned
```

### 7. Visibility & Display

```tsx
// Hide on mobile, show on desktop
className="hidden lg:flex"

// Show on mobile, hide on desktop
className="lg:hidden"

// Different layouts for different sizes
className="block sm:hidden"  // Mobile only
className="hidden sm:block lg:hidden"  // Tablet only
className="hidden lg:block"  // Desktop only
```

### 8. Utility Classes for Mobile

```tsx
// Prevent icon squishing
className="flex-shrink-0"

// Allow text wrapping
className="min-w-0"

// Line height for mobile
className="leading-tight"  // Compact
className="leading-relaxed"  // Comfortable

// Text wrapping
className="whitespace-normal sm:whitespace-nowrap"
// Mobile: wrap, Small: no wrap

// Height auto for multi-line text
className="h-auto py-3 sm:py-2"
// Mobile: auto height with padding, Small: default
```

---

## Component-Specific Patterns

### Button

```tsx
<Button 
  size="lg" 
  className="w-full sm:w-auto text-sm sm:text-base"
>
  {/* Full width on mobile, auto on larger screens */}
  {/* Smaller text on mobile */}
</Button>
```

### Badge/Tag

```tsx
<div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
  <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
  <span>Text</span>
</div>
```

### Card

```tsx
<div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
  {/* Responsive padding and border radius */}
</div>
```

### Icon with Text

```tsx
<div className="flex gap-3 sm:gap-4">
  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex-shrink-0">
    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
  </div>
  <div className="min-w-0">
    <h3 className="text-sm sm:text-base leading-tight">Title</h3>
    <p className="text-xs sm:text-sm leading-relaxed">Description</p>
  </div>
</div>
```

### Avatar with Info

```tsx
<div className="flex items-center gap-3 sm:gap-4">
  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0">
    {/* Avatar */}
  </div>
  <div className="min-w-0">
    <div className="text-sm sm:text-base leading-tight">Name</div>
    <div className="text-xs sm:text-sm leading-tight">Role</div>
  </div>
</div>
```

---

## Mobile-First Development Checklist

### Planning
- [ ] Design for 320px width first
- [ ] Identify content hierarchy
- [ ] Plan touch targets (minimum 44px)
- [ ] Consider thumb zones

### Layout
- [ ] Use single column on mobile
- [ ] Stack elements vertically
- [ ] Use full-width buttons
- [ ] Reduce padding/margins

### Typography
- [ ] Start with smaller sizes
- [ ] Use tight line heights
- [ ] Ensure readability
- [ ] Test with real content

### Images & Icons
- [ ] Use smaller sizes on mobile
- [ ] Prevent squishing with flex-shrink-0
- [ ] Optimize for performance
- [ ] Use responsive images

### Spacing
- [ ] Reduce gaps on mobile
- [ ] Use consistent spacing scale
- [ ] Test with different content lengths
- [ ] Ensure proper breathing room

### Testing
- [ ] Test on real devices
- [ ] Use browser DevTools
- [ ] Test in portrait and landscape
- [ ] Verify touch interactions

---

## Common Mistakes to Avoid

❌ **Don't:**
```tsx
// Fixed large sizes
className="text-4xl p-8 gap-6"

// No mobile consideration
className="grid grid-cols-3"

// Fixed widths
className="w-64"
```

✅ **Do:**
```tsx
// Progressive sizing
className="text-2xl sm:text-4xl p-4 sm:p-8 gap-3 sm:gap-6"

// Mobile-first grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Responsive widths
className="w-full sm:w-auto"
```

---

## Performance Tips

1. **Use appropriate breakpoints**: Don't add unnecessary breakpoints
2. **Optimize images**: Use responsive images with srcset
3. **Reduce animations on mobile**: Use `prefers-reduced-motion`
4. **Lazy load content**: Load below-the-fold content lazily
5. **Minimize backdrop-blur**: Can be heavy on mobile GPUs

---

## Accessibility Considerations

1. **Touch targets**: Minimum 44x44px for interactive elements
2. **Text contrast**: Ensure WCAG AA compliance
3. **Font sizes**: Minimum 16px for body text (prevents zoom on iOS)
4. **Focus states**: Ensure visible focus indicators
5. **Semantic HTML**: Use proper heading hierarchy

---

## Quick Copy-Paste Snippets

### Responsive Section
```tsx
<section className="relative py-12 sm:py-16 lg:py-28 overflow-hidden">
  <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

### Responsive Heading Block
```tsx
<div className="text-center mb-10 sm:mb-16">
  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
    <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
    <span>Badge Text</span>
  </div>
  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
    Heading Text
  </h2>
  <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
    Description text
  </p>
</div>
```

### Responsive Card Grid
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
  <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8">
    {/* Card content */}
  </div>
</div>
```

### Responsive Button Group
```tsx
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <Button className="w-full sm:w-auto text-sm sm:text-base">
    Primary Action
  </Button>
  <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
    Secondary Action
  </Button>
</div>
```

---

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First CSS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)
- [Touch Target Sizes](https://web.dev/accessible-tap-targets/)
- [Responsive Typography](https://web.dev/responsive-web-design-basics/#typography)
