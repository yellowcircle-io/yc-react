# Known Issues - YellowCircle Alpha

**Version:** 1.0 Alpha
**Last Updated:** November 10, 2025

Thank you for testing YellowCircle during our alpha phase! This document outlines known issues you may encounter. We appreciate your patience as we continue to improve the experience.

---

## Current Known Issues

### Visual/Animation Issues

#### 1. Sidebar Hover Jitter (Chrome/Firefox)
**Impact:** Cosmetic
**Description:** Slight visual jitter when hovering over sidebar navigation items, particularly noticeable on Chrome. Firefox may show reduced or no hover animations.

**Workaround:** None required - functionality is not affected. Click events work normally despite the visual artifact.

**Status:** Scheduled for fix in v2.0 refactor

#### 2. Click Instability on Sidebar Navigation
**Impact:** Minor usability issue
**Description:** Occasionally, clicking on sidebar navigation items may require a second attempt to register.

**Workaround:** Simply click again if the first click doesn't respond. The sidebar is fully functional.

**Status:** Improved with GPU acceleration; further optimization planned for v2.0

#### 3. Animation Timing Inconsistencies
**Impact:** Cosmetic
**Description:** Some page transitions use 0.3s timing while others use 0.5s, creating slightly inconsistent user experience.

**Workaround:** None needed - all animations function correctly.

**Status:** Will be standardized in v2.0 with centralized constants

---

## Browser Compatibility

### Fully Supported
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Known Browser-Specific Issues
- **Firefox:** Some hover animations may appear less smooth or not trigger consistently
- **Safari (iOS):** Device motion effects require permission on first load

---

## Mobile Experience

### What Works Well
- ✅ Touch interactions and swiping
- ✅ Responsive layout across all screen sizes
- ✅ Navigation menu and accordion system
- ✅ Parallax effects (with reduced intensity for performance)

### Known Mobile Issues
- Sidebar minimum width is 280px which may feel wide on very small devices (<375px)
- Device motion/tilt effects may drain battery faster on some devices

---

## Performance Notes

### Current Performance
- **Lighthouse Performance Score:** 78/100 (Mobile)
- **First Contentful Paint:** ~1.2s
- **Time to Interactive:** ~2.8s

### What We're Monitoring
- Memory usage during long browsing sessions
- Event listener accumulation over time
- Battery impact of parallax/motion effects

**Recommendation:** If you notice slowness after extended use, refresh the page to clear accumulated state.

---

## Features Not Yet Implemented

The following sections may show placeholder content or incomplete functionality:

- **Blog section** - Planned for future release
- Some experimental pages may be in various states of completion

---

## Reporting Issues

We value your feedback! If you encounter issues not listed here:

### How to Report
1. **Email:** [Your feedback email here]
2. **Include:**
   - Browser and version
   - Device type (desktop/mobile)
   - Steps to reproduce the issue
   - Screenshot if applicable

### What to Report
- Broken links or navigation
- Pages that fail to load
- Visual glitches not mentioned above
- Any crashes or error messages
- Performance issues (slow loading, freezing)

---

## Upcoming Improvements (v2.0)

We're planning significant improvements for the next major release:

### Performance Enhancements
- Reduced code duplication for faster load times
- Improved animation performance
- Better memory management

### UI/UX Improvements
- Smoother sidebar interactions
- Consistent animation timing
- Enhanced mobile experience
- Better error handling

### New Features
- Component library showcase
- Blog functionality
- Additional interactive experiments

---

## Alpha Testing Guidelines

### What to Focus On
- Overall navigation experience
- Visual design and aesthetics
- Mobile vs. desktop experience
- Any blocking issues that prevent use

### What's Expected
- Minor visual glitches (documented above)
- Occasional need to refresh the page
- Some inconsistencies in animation timing

### What's NOT Expected
- Pages completely failing to load
- Loss of data or settings
- Security vulnerabilities
- Critical errors that prevent site use

---

## FAQ

**Q: Is my data safe?**
A: Yes. We use Firebase for secure data handling and don't collect personal information beyond basic analytics.

**Q: Will these issues affect the final release?**
A: No. These known issues are scheduled for resolution before public launch. This alpha phase helps us identify and prioritize fixes.

**Q: How long will the alpha phase last?**
A: We expect alpha testing to run for 1-2 weeks while we collect feedback and implement v2.0 improvements.

**Q: Can I share this with others?**
A: Please do! We welcome more testers. Just let them know this is an alpha version with known limitations.

---

## Thank You

Your participation in this alpha helps make YellowCircle better. We're committed to creating a polished, high-quality experience and your feedback is invaluable.

**Questions?** Contact us at [your contact method]

---

**Last Reviewed:** November 10, 2025
**Next Update:** After alpha feedback collection
