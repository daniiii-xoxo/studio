# C2S System - Use Case Diagram

## Actors

### 1. **Ministry Head** (Pastor/Church Leadership)
Top-level oversight of the entire C2S program

### 2. **Cluster Head**
Manages multiple C2S groups within a geographic cluster

### 3. **C2S Coordinator**
Handles incoming potential mentees and assigns them to appropriate mentors

### 4. **Mentor** (C2S Group Leader)
Leads a C2S group and disciples mentees

### 5. **Potential Mentee** (Guest/Visitor)
Person interested in joining a C2S group

### 6. **Active Mentee** (Member)
Current participant in discipleship program

---

## Use Cases by Actor

### **MINISTRY HEAD Use Cases**

#### **Dashboard & Overview**
1. **View Ministry Dashboard**
   - View overall C2S statistics
   - Monitor clusters performance
   - Track total groups, mentors, mentees
   - View system-wide metrics

2. **View Cluster Reports**
   - See all clusters overview
   - Monitor cluster health (attendance, completion, devotion)
   - Identify underperforming clusters

3. **View Group Analytics**
   - See all groups across clusters
   - Monitor group capacity and status
   - Track group growth trends

4. **View Mentee Statistics**
   - Total active mentees
   - Total potential mentees
   - Completion rates
   - Progress distribution

5. **Generate Reports**
   - Export ministry-wide reports
   - View historical data
   - Track year-over-year growth

#### **Leadership Management**
6. **Manage Cluster Heads**
   - Assign cluster heads to clusters
   - View cluster head performance
   - Reassign clusters

7. **Manage Coordinators**
   - Assign coordinators to clusters
   - Monitor coordinator workload
   - Track assignment efficiency

8. **Manage Mentors**
   - View all mentors across clusters
   - Monitor mentor performance
   - Approve new mentors

9. **Endorse New Mentors**
   - Review endorsement requests
   - Approve endorsed workers
   - Track endorsement pipeline

---

### **CLUSTER HEAD Use Cases**

#### **Cluster Overview**
10. **View Cluster Dashboard**
    - View cluster statistics
    - Monitor assigned groups
    - Track cluster metrics

11. **View Cluster Map**
    - See geographic distribution of groups
    - Identify coverage gaps
    - Plan new group locations

#### **Group Management**
12. **Monitor Groups in Cluster**
    - View all groups in cluster
    - Check group health metrics
    - Identify struggling groups

13. **View Group Details**
    - See group information
    - Check group capacity
    - View group schedule

#### **Mentor Management**
14. **Monitor Mentors Performance**
    - Track mentor metrics (attendance, completion, devotion)
    - View mentor workload
    - Identify mentors needing support

15. **View Mentor Details**
    - See mentor information
    - View assigned mentees
    - Check mentor contact info

16. **Communicate with Mentors**
    - Send messages to mentors
    - Schedule mentor meetings
    - Provide guidance

#### **Coordinator Management**
17. **Monitor Coordinators**
    - View coordinator performance
    - Track assignment metrics
    - Monitor pending assignments

18. **View Coordinator Activities**
    - See recent coordinator actions
    - Track assignment speed
    - Monitor follow-up activities

#### **Potential Mentee Oversight**
19. **View All Potential Mentees in Cluster**
    - See pipeline of incoming mentees
    - Track assignment status
    - Monitor interview progress

20. **View Cluster Notifications**
    - Receive new potential mentee alerts
    - Get assignment updates
    - See interview completions

---

### **C2S COORDINATOR Use Cases**

#### **Dashboard**
21. **View Coordinator Dashboard**
    - See assigned potential mentees
    - Track pending assignments
    - View performance metrics

#### **Potential Mentee Management**
22. **View Potential Mentees List**
    - See all assigned potential mentees
    - Filter by status
    - Search by name or barangay

23. **View Potential Mentee Details**
    - See complete profile
    - View preferences
    - Check contact information

24. **Update Mentee Status**
    - Change status (New → Interview Scheduled → Accepted)
    - Add notes
    - Track progress

25. **Schedule Interview**
    - Set interview date
    - Notify mentor
    - Update status to "Interview Scheduled"

26. **Assign to Mentor**
    - Select appropriate mentor
    - Consider barangay proximity
    - Match group preferences
    - Consider group capacity

27. **Recommend Group**
    - Suggest alternative groups
    - Match based on profile
    - Consider availability

28. **Accept Mentee**
    - Finalize assignment
    - Convert to active mentee
    - Notify mentor and mentee

#### **Mentor & Group Coordination**
29. **View Available Mentors**
    - See mentors with capacity
    - Check mentor details
    - View mentor workload

30. **View Available Groups**
    - See groups with open slots
    - Filter by barangay/type
    - Check group schedules

31. **Check Group Capacity**
    - View current capacity
    - See available slots
    - Monitor full groups

#### **Notifications**
32. **Receive New Mentee Alerts**
    - Get notified of new submissions
    - See C2S Finder requests
    - Receive recommendations

33. **View Activity Feed**
    - See recent assignments
    - Track interview completions
    - Monitor acceptance updates

---

### **MENTOR (Group Leader) Use Cases**

#### **Dashboard**
34. **View Mentor Dashboard**
    - See group overview
    - View assigned mentees
    - Track progress metrics

#### **Group Management**
35. **View My Group Details**
    - See group information
    - Check schedule
    - View capacity

36. **Create Group** (if endorsed)
    - Set up new group
    - Define schedule and location
    - Set capacity

37. **Edit Group Details**
    - Update meeting schedule
    - Change location
    - Modify description

38. **Manage Group Tags**
    - Add/remove tags
    - Categorize group

39. **View Group Members**
    - See all active members
    - Check member progress
    - View member details

40. **Update Group Status**
    - Change status (Open/Closed/Full)
    - Set capacity limits

#### **Active Mentee Management**
41. **View Active Mentees List**
    - See all assigned mentees
    - Filter by progress
    - Search mentees

42. **View Mentee Profile**
    - See complete profile
    - View contact information
    - Check training history

43. **Update Mentee Progress**
    - Mark lessons completed
    - Update current module/lesson
    - Update progress percentage

44. **Add Mentor Notes**
    - Add discipleship notes
    - Track mentee growth
    - Record concerns

45. **Track Devotional Progress**
    - Monitor daily devotions
    - View devotional consistency
    - Encourage regular practice

46. **Update Training Records**
    - Mark trainings completed
    - Add completion years
    - Track training progress

47. **Transfer Mentee**
    - Request transfer to another group
    - Provide reason
    - Notify coordinator

48. **Mark Mentee Inactive**
    - Change status to inactive
    - Provide reason
    - Archive mentee record

#### **Potential Mentee Management**
49. **View Potential Mentees**
    - See assigned potential mentees
    - Check pending assignments
    - View requests from C2S Finder

50. **Accept Mentee Assignment**
    - Review potential mentee profile
    - Accept or decline assignment
    - Provide feedback

51. **Conduct Interview**
    - Schedule meeting
    - Update interview status
    - Add interview notes

52. **Endorse Mentee** (for leadership)
    - Recommend mentee for endorsement
    - Submit endorsement request
    - Provide endorsement notes

#### **Inactive Mentee Management**
53. **View Inactive Mentees**
    - See historical mentees
    - Check completion records
    - View inactivity reasons

54. **Reactivate Mentee**
    - Restore inactive mentee
    - Update status
    - Restart progress tracking

#### **Endorsed Worker Management** (if applicable)
55. **View Endorsed Workers**
    - See endorsed mentees
    - Track endorsed groups
    - Monitor worker progress

56. **Endorse New Worker**
    - Submit endorsement
    - Recommend for leadership
    - Provide qualification notes

57. **Manage Endorsed Groups**
    - Oversee groups led by endorsed workers
    - Provide mentorship
    - Track group health

---

### **POTENTIAL MENTEE Use Cases**

#### **Group Discovery**
58. **Browse C2S Groups** (C2S Finder)
    - View all available groups
    - See group details
    - Check locations on map

59. **Search Groups by Filters**
    - Filter by age group
    - Filter by tags
    - Filter by location/barangay
    - Filter by meetup day

60. **View Group on Map**
    - See group location
    - Calculate distance
    - View nearby groups

61. **View Group Details**
    - See group description
    - Check schedule
    - View leader information

#### **Join Request**
62. **Submit Join Request**
    - Fill out profile form
    - Select preferred group(s)
    - Provide contact information

63. **Specify Group Preferences**
    - Choose up to 2 groups
    - Indicate group type preference
    - Provide availability

64. **Track Request Status**
    - Check application status
    - View assigned coordinator
    - See next steps

---

### **ACTIVE MENTEE Use Cases**

#### **Personal Progress**
65. **View My Progress**
    - See current module/lesson
    - Check completion percentage
    - View progress history

66. **View My Profile**
    - See personal information
    - Check training records
    - View mentor notes

67. **Update Personal Information**
    - Update contact details
    - Change preferences
    - Update availability

68. **Track Devotional Progress**
    - Log daily devotions
    - View devotional streaks
    - Access devotional materials

69. **View Training History**
    - See completed trainings
    - Check upcoming trainings
    - View certification records

#### **Group Interaction**
70. **View My Group**
    - See group details
    - Check meeting schedule
    - View other members

71. **View Group Schedule**
    - Check meeting times
    - See location
    - Get reminders

72. **Contact Mentor**
    - Send message to mentor
    - Request meeting
    - Ask questions

73. **Request Group Transfer**
    - Submit transfer request
    - Provide reason
    - Select preferred group

---

## System-Level Use Cases

### **Authentication & Authorization**
74. **Login**
    - All actors must authenticate
    - Role-based access control
    - Session management

75. **Logout**
    - Secure logout
    - Clear session

76. **View Notifications**
    - All actors receive relevant notifications
    - Real-time updates
    - Activity feed

### **Data Management**
77. **Search System-wide**
    - Search for people, groups, locations
    - Filter results
    - Quick access

78. **Generate Reports**
    - Export data
    - Create analytics
    - View trends

79. **Manage Master Data**
    - Maintain barangays
    - Manage subdivisions
    - Update modules/lessons
    - Manage training catalog

---

## Use Case Relationships

### **Generalization (Inheritance)**
- **Manage Group Details** is specialized by:
  - Create Group
  - Edit Group Details
  - Update Group Status

- **Manage Mentee** is specialized by:
  - View Mentee Profile
  - Update Mentee Progress
  - Transfer Mentee
  - Mark Mentee Inactive

### **Include Relationships**
- **Assign to Mentor** INCLUDES **Check Group Capacity**
- **Submit Join Request** INCLUDES **Specify Group Preferences**
- **Accept Mentee Assignment** INCLUDES **View Potential Mentee Details**
- **Update Mentee Progress** INCLUDES **Track Devotional Progress**

### **Extend Relationships**
- **View Mentor Dashboard** EXTENDS **View Group Analytics** (if mentor has multiple groups)
- **View Potential Mentees** EXTENDS **Schedule Interview** (when needed)
- **View Active Mentees** EXTENDS **Endorse Mentee** (when qualified)

---

## Use Case Diagram - Visual Representation

```
                    C2S SYSTEM USE CASE DIAGRAM

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  MINISTRY HEAD                 CLUSTER HEAD            C2S COORDINATOR  │
│      👤                             👤                       👤         │
│       │                              │                        │         │
│       ├─ View Ministry Dashboard     ├─ View Cluster Dashboard├─ View Coordinator Dashboard
│       ├─ View Cluster Reports        ├─ View Cluster Map     ├─ View Potential Mentees
│       ├─ Manage Cluster Heads        ├─ Monitor Mentors      ├─ Schedule Interview
│       ├─ Manage Coordinators         ├─ Monitor Coordinators ├─ Assign to Mentor
│       ├─ Manage Mentors              ├─ View Potential Mentees├─ Accept Mentee
│       ├─ Endorse New Mentors         └─ View Notifications   ├─ Recommend Group
│       ├─ Generate Reports                                    └─ Check Group Capacity
│       └─ View System Analytics                                         │
│                                                                         │
│                                                                         │
│       MENTOR (Group Leader)          POTENTIAL MENTEE    ACTIVE MENTEE │
│             👤                              👤                👤       │
│              │                               │                 │       │
│              ├─ View Mentor Dashboard        ├─ Browse Groups  ├─ View My Progress
│              ├─ Manage My Group              ├─ Search Groups  ├─ View My Profile
│              ├─ View Active Mentees          ├─ View Group Map ├─ Track Devotional
│              ├─ View Potential Mentees       ├─ Submit Request ├─ View Training History
│              ├─ Accept Mentee Assignment     └─ Track Status   ├─ View My Group
│              ├─ Update Mentee Progress                         ├─ Contact Mentor
│              ├─ Add Mentor Notes                               └─ Request Transfer
│              ├─ Track Devotional Progress                               │
│              ├─ Transfer Mentee                                         │
│              ├─ Endorse Worker                                          │
│              ├─ Create Group (if endorsed)                              │
│              └─ View Inactive Mentees                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                          SHARED USE CASES
                    ┌──────────────────────────┐
                    │  • Login / Logout        │
                    │  • View Notifications    │
                    │  • Search System         │
                    │  • Generate Reports      │
                    └──────────────────────────┘
```

---

## Primary User Flows

### **Flow 1: New Mentee Onboarding**
1. Potential Mentee: Browse C2S Groups → Submit Join Request
2. System: Create Potential Mentee record → Notify C2S Coordinator
3. C2S Coordinator: View New Request → Schedule Interview → Assign to Mentor
4. Mentor: Accept Assignment → Conduct Interview
5. C2S Coordinator: Accept Mentee (convert to Active Mentee)
6. Mentor: Track Progress → Update Modules/Lessons

### **Flow 2: Mentee Discipleship Journey**
1. Mentor: View Active Mentees → Select Mentee
2. Mentor: Update Progress → Mark Lesson Complete
3. Mentor: Add Mentor Notes → Track Devotional
4. Mentor: Update Training Records
5. System: Calculate Overall Progress
6. Mentor: (Optional) Endorse for Leadership

### **Flow 3: Group Management**
1. Mentor: View My Group → Edit Group Details
2. Mentor: Update Schedule/Location
3. Mentor: View Group Members → Check Capacity
4. System: Update Group Status (Open/Full)
5. Cluster Head: Monitor Group Health
6. Ministry Head: View Group Analytics

### **Flow 4: Assignment & Coordination**
1. System: Receive Join Request
2. C2S Coordinator: View Potential Mentees
3. C2S Coordinator: Check Available Mentors → Check Group Capacity
4. C2S Coordinator: Assign to Mentor (match by barangay/preferences)
5. Mentor: Receive Notification → Accept/Decline
6. C2S Coordinator: Schedule Interview
7. Mentor: Conduct Interview → Update Status
8. C2S Coordinator: Accept Mentee → Convert to Active

### **Flow 5: Endorsement to Leadership**
1. Mentor: Identify Qualified Mentee
2. Mentor: Submit Endorsement Request
3. Cluster Head: Review Endorsement
4. Ministry Head: Approve Endorsement
5. System: Create Endorsed Worker record
6. Endorsed Worker: Create New Group
7. Mentor: Oversee Endorsed Group

---

## Integration with COG APP Database

### **Key Integration Points**

1. **User Authentication & Roles**
   - Shared USER table with COG APP
   - Unified role management
   - Single sign-on (SSO)

2. **Member/Mentee Synchronization**
   - C2S MENTEE ↔ COG Member
   - Sync attendance records
   - Unified contact information

3. **Training Records**
   - C2S TRAINING ↔ COG Training Programs
   - Shared training completion records
   - Unified certification tracking

4. **Location Data**
   - Shared BARANGAY and SUBDIVISION tables
   - Unified geographic data
   - Consistent address formatting

5. **Notification System**
   - Shared notification infrastructure
   - Cross-app alerts
   - Unified communication channels

6. **Analytics & Reporting**
   - Combined ministry analytics
   - Unified dashboard metrics
   - Cross-system reports

### **Database Schema Considerations**

- Use **schema prefixing** (e.g., `c2s_group`, `c2s_mentee`) for C2S-specific tables
- Share common tables: `users`, `barangays`, `subdivisions`, `trainings`
- Implement **database views** for cross-app queries
- Use **foreign keys** to maintain referential integrity
- Consider **separate schemas** (e.g., `c2s` schema, `cog` schema) in same database

---

## Notes

- All use cases support **mobile-responsive** interfaces
- **Real-time notifications** for critical events
- **Audit logging** for all data changes
- **Role-based access control** enforced at database level
- **Data export** capabilities for reporting
- **Offline support** for mentors in the field (future enhancement)
