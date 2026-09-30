# C2S System ERD - Figma Implementation Guide

## Quick Setup: Using FigJam or Figjam Wireframe Kit

### Option A: Auto-import via Plugin
1. In Figma, go to **Plugins** → Search "**Database Schema**" or "**ERD Diagram**"
2. Popular plugins:
   - **DrawSQL** - Import database schema
   - **Diagram** - Create ERD automatically
   - **Mermaid Chart** - Import mermaid diagrams

### Option B: Use Pre-built Template
1. Search Figma Community: "**Database ERD Template**"
2. Duplicate to your workspace
3. Replace with C2S data below

---

## Manual Creation in Figma - Layout Structure

### Canvas Organization (Frames)

```
Page: C2S System ERD
├─ Frame 1: Overview (1920x1080)
├─ Frame 2: User Management (1920x1080)
├─ Frame 3: Group Management (1920x1080)
├─ Frame 4: Mentee Journey (1920x1080)
├─ Frame 5: Geographic Structure (1920x1080)
└─ Frame 6: Leadership Pipeline (1920x1080)
```

---

## Color Scheme (Professional Database Diagram)

```
Background: #F8F9FA (light gray)

Table Headers:
- Core Entities: #4285F4 (blue)
- User Management: #34A853 (green)
- Geographic: #FBBC04 (yellow)
- Progress Tracking: #EA4335 (red)
- Leadership: #9333EA (purple)

Table Body: #FFFFFF (white)
Border: #E0E0E0 (gray)
Text: #202124 (dark gray)
Foreign Keys: #5F6368 (medium gray, italic)
Primary Keys: #202124 (dark gray, bold, underlined)
```

---

## Figma Components to Create

### 1. Table Component (Auto-layout)

**Component Structure:**
```
📦 Table Container (Auto-layout, Vertical)
  ├─ 🎨 Header (Fill: #4285F4, Padding: 12px)
  │   └─ 📝 Table Name (White, 16px, Bold)
  └─ 📋 Body (Fill: White, Padding: 16px, Gap: 8px)
      ├─ 📝 • id: varchar(50) [PK]
      ├─ 📝   name: varchar(255)
      ├─ 📝   email: varchar(255)
      └─ 📝   *foreign_key_id: varchar(50) [FK]
```

**Figma Settings:**
- Auto-layout: Vertical
- Padding: 0px
- Gap: 0px
- Corner radius: 8px
- Stroke: 1px, #E0E0E0
- Shadow: 0px 2px 8px rgba(0,0,0,0.08)

---

## Complete Entity List for Figma

### Copy-Paste Ready Format (Create 18 Tables)

#### 1️⃣ USER (Blue #4285F4)
```
• id: varchar(50) [PK]
  name: varchar(255)
  email: varchar(255) [Unique]
  password: varchar(255)
  role: enum
  avatar: varchar(10)
  *group_id: varchar(50) [FK]
  *cluster_id: varchar(50) [FK]
  created_at: timestamp
  updated_at: timestamp
```

#### 2️⃣ C2S_GROUP (Green #34A853)
```
• id: varchar(50) [PK]
  name: varchar(255)
  description: text
  age_group: varchar(50)
  location: varchar(255)
  barangay: varchar(255)
  schedule: varchar(255)
  status: enum
  type: enum
  capacity: int
  members_count: int
  latitude: decimal(10,8)
  longitude: decimal(11,8)
  *leader_id: varchar(50) [FK]
  *cluster_id: varchar(50) [FK]
  created_at: timestamp
```

#### 3️⃣ GROUP_TAG (Green #34A853)
```
• id: varchar(50) [PK]
  label: varchar(255)
  color: varchar(50)
  created_at: timestamp
```

#### 4️⃣ GROUP_TAG_MAPPING (Green #34A853)
```
  *group_id: varchar(50) [FK→c2s_group]
  *tag_id: varchar(50) [FK→group_tag]
  created_at: timestamp
```

#### 5️⃣ MENTEE (Red #EA4335)
```
• id: varchar(50) [PK]
  name: varchar(255)
  initials: varchar(10)
  email: varchar(255)
  phone: varchar(50)
  age: int
  gender: enum
  birthday: date
  current_module: varchar(255)
  current_lesson: varchar(255)
  progress: int
  status: enum
  *assigned_group_id: varchar(50) [FK]
  *mentor_id: varchar(50) [FK]
  created_at: timestamp
```

#### 6️⃣ INACTIVE_MENTEE (Red #EA4335)
```
• id: varchar(50) [PK]
  name: varchar(255)
  date_inactive: date
  last_module: varchar(255)
  reason: enum
  *assigned_group_id: varchar(50) [FK]
  created_at: timestamp
```

#### 7️⃣ POTENTIAL_MENTEE (Red #EA4335)
```
• id: varchar(50) [PK]
  name: varchar(255)
  email: varchar(255)
  phone: varchar(50)
  age: int
  barangay: varchar(255)
  status: enum
  cluster_status: enum
  date_submitted: date
  *assigned_coordinator_id: [FK]
  *assigned_mentor_id: [FK]
  created_at: timestamp
```

#### 8️⃣ CLUSTER (Yellow #FBBC04)
```
• id: varchar(50) [PK]
  name: varchar(255)
  description: text
  *cluster_head_id: varchar(50) [FK]
  *coordinator_id: varchar(50) [FK]
  created_at: timestamp
```

#### 9️⃣ BARANGAY (Yellow #FBBC04)
```
• id: varchar(50) [PK]
  name: varchar(255)
  city: varchar(100)
  *cluster_id: varchar(50) [FK]
  created_at: timestamp
```

#### 🔟 SUBDIVISION (Yellow #FBBC04)
```
• id: varchar(50) [PK]
  name: varchar(255)
  *barangay_id: varchar(50) [FK]
  created_at: timestamp
```

#### 1️⃣1️⃣ MODULE (Red #EA4335)
```
• id: varchar(50) [PK]
  name: varchar(255)
  description: text
  sequence_order: int
  created_at: timestamp
```

#### 1️⃣2️⃣ LESSON (Red #EA4335)
```
• id: varchar(50) [PK]
  name: varchar(255)
  sequence_order: int
  *module_id: varchar(50) [FK]
  created_at: timestamp
```

#### 1️⃣3️⃣ MENTEE_PROGRESS (Red #EA4335)
```
• id: varchar(50) [PK]
  *mentee_id: varchar(50) [FK]
  *lesson_id: varchar(50) [FK]
  completion_date: date
  status: enum
  notes: text
  created_at: timestamp
```

#### 1️⃣4️⃣ TRAINING (Red #EA4335)
```
• id: varchar(50) [PK]
  label: varchar(255)
  description: text
  sequence_order: int
  created_at: timestamp
```

#### 1️⃣5️⃣ MENTEE_TRAINING (Red #EA4335)
```
• id: varchar(50) [PK]
  *mentee_id: varchar(50) [FK]
  *training_id: varchar(50) [FK]
  year_completed: varchar(10)
  status: enum
  created_at: timestamp
```

#### 1️⃣6️⃣ ENDORSED_GROUP (Purple #9333EA)
```
• id: varchar(50) [PK]
  name: varchar(255)
  members_count: int
  progress: int
  *endorsed_by_id: varchar(50) [FK]
  *cluster_id: varchar(50) [FK]
  created_at: timestamp
```

#### 1️⃣7️⃣ ENDORSED_WORKER (Purple #9333EA)
```
• id: varchar(50) [PK]
  name: varchar(255)
  email: varchar(255)
  progress: int
  *assigned_group_id: varchar(50) [FK]
  *endorsed_by_id: varchar(50) [FK]
  created_at: timestamp
```

#### 1️⃣8️⃣ ACTIVITY_LOG (Blue #4285F4)
```
• id: varchar(50) [PK]
  text: text
  timestamp: datetime
  read: boolean
  type: enum
  *user_id: varchar(50) [FK]
  *related_mentee_id: varchar(50)
  created_at: timestamp
```

---

## Relationship Lines (Connectors)

### Line Styles
```
One-to-Many:  ──────●<  (filled circle to crow's foot)
Many-to-One:  >●────── (crow's foot to filled circle)
Many-to-Many: >●────●< (crow's foot both ends)
```

### Figma Connector Settings
- Stroke: 2px
- Color: #5F6368 (medium gray)
- Line style: Solid
- Arrow style: Custom (use shapes)

---

## Key Relationships to Draw

### Core Relationships (Priority)
```
USER ──1────∞── C2S_GROUP (leads)
USER ──1────∞── MENTEE (mentors)
USER ──1────∞── POTENTIAL_MENTEE (coordinates)
USER ──1────∞── CLUSTER (heads)

C2S_GROUP ──1────∞── MENTEE (has)
C2S_GROUP ──∞────∞── GROUP_TAG (via mapping)
C2S_GROUP ──∞────1── CLUSTER (belongs to)

MENTEE ──1────∞── MENTEE_PROGRESS (tracks)
MENTEE ──∞────∞── TRAINING (completes)

MODULE ──1────∞── LESSON (contains)
LESSON ──1────∞── MENTEE_PROGRESS (tracked in)

CLUSTER ──1────∞── BARANGAY (covers)
BARANGAY ──1────∞── SUBDIVISION (contains)

ENDORSED_GROUP ──1────∞── ENDORSED_WORKER (contains)
USER ──1────∞── ENDORSED_WORKER (endorses)
```

---

## Figma Layout Recommendations

### Frame 1: Overview (Main ERD)
**Layout Grid: 6 columns x 4 rows**

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│    USER     │  C2S_GROUP  │   MENTEE    │   CLUSTER   │
│             │             │             │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ POTENTIAL_  │  GROUP_TAG  │  INACTIVE_  │  BARANGAY   │
│  MENTEE     │  MAPPING    │   MENTEE    │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│   MODULE    │   LESSON    │  MENTEE_    │  TRAINING   │
│             │             │  PROGRESS   │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ENDORSED_   │ ENDORSED_   │ SUBDIVISION │ ACTIVITY_   │
│  GROUP      │  WORKER     │             │    LOG      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Spacing:**
- Between tables: 80px horizontal, 60px vertical
- Table size: ~280px width (auto-height)

---

## Figma Plugins to Speed Up

### Recommended Plugins:
1. **Auto Layout** - Quickly arrange tables in grid
2. **Content Reel** - Fill tables with data
3. **Wireframe** - Database diagram templates
4. **Arrow** - Smart connectors
5. **Table Generator** - Auto-create table layouts

---

## Typography

```
Table Names: 
- Font: Inter Bold / SF Pro Bold
- Size: 16px
- Color: White (on colored header)

Field Names:
- Font: Inter Regular / SF Pro Regular  
- Size: 13px
- Color: #202124
- Line height: 20px

PK notation:
- Bold + Underline
- • bullet before name

FK notation:
- Italic
- * asterisk before name
```

---

## Export Settings from Figma

**For Presentation:**
- Format: PNG
- Scale: 2x (high res)
- Background: Include

**For Development:**
- Format: PDF
- Pages: All frames
- Include layers

**For Documentation:**
- Format: SVG
- Keep vectors editable

---

## Pro Tips

1. **Use Components** - Create table component, reuse 18 times
2. **Auto-Layout** - Makes rearranging easy
3. **Color Variables** - Define colors once, reuse
4. **Master Layout** - Create overview first, then detailed views
5. **Annotations** - Add notes layer for business rules
6. **Versions** - Save versions as you iterate

---

## Time Estimates

- **Import SVG method**: 5 minutes
- **Manual with components**: 45-60 minutes
- **Manual without components**: 2-3 hours

---

## Final Checklist

- [ ] 18 tables created
- [ ] All fields added (PK, FK marked)
- [ ] Colors applied by category
- [ ] Relationships drawn (23 total)
- [ ] Cardinality noted (1:1, 1:∞, ∞:∞)
- [ ] Table sizes consistent
- [ ] Spacing uniform
- [ ] Legend added (PK, FK, relationship symbols)
- [ ] Title & metadata (date, version)
- [ ] Export for team review

---

## Ready to Start!

**FASTEST METHOD:**
1. dbdiagram.io → Export SVG
2. Drag SVG into Figma
3. Ungroup and edit as needed

**BEST CONTROL:**
1. Create table component in Figma
2. Duplicate 18 times
3. Fill with data from guide above
4. Connect with relationship lines

Good luck! 🎨🚀
