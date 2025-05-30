1. Global Layout & Navigation
	•	Top Navigation Bar
	•	Brand Logo on the left: a stylized neuronal-network icon in teal, with “BrainSAIT” in a sleek, semi-bold sans serif.
	•	Global Search in center: a rounded input (placeholder “Search patients, appointments…”) with soft shadow.
	•	User Menu on the right: circular avatar, notification bell (with badge), and a dropdown for profile, settings, and logout.
	•	Side Menu (Collapsible)
	•	Sections:
	1.	Dashboard (home icon)
	2.	Patients (user icon)
	3.	Appointments (calendar icon)
	4.	Clinical Notes (notebook icon)
	5.	Prior Auth (shield icon)
	6.	Telehealth (video icon)
	7.	RCM Optimizer (chart icon)
	8.	Monitor & Compliance (lock icon)
	9.	IoT Data (signal icon)
	10.	Settings (gear icon)
	•	Icons from lucide-react, all 2xl-rounded background on hover.

⸻

2. Dashboard Overview
	•	Grid of Summary Cards (two rows, three columns on desktop)
	•	Active Patients: large number, sparkline of last 7 days.
	•	Upcoming Appointments: list of next 3 slots.
	•	Notes to Review: count of AI-suggested notes awaiting sign-off.
	•	Authorizations Pending: count + “Approve All” button.
	•	Live Telehealth Sessions: number of ongoing calls.
	•	System Health: microservice status, green/amber/red badges.
	•	Quick Action Buttons below cards:
	•	“New Patient”
	•	“Schedule Visit”
	•	“Upload Device Data”
	•	“Run RCM Scan”

⸻

3. Patients & Appointments
	•	Patients List
	•	Search/filter bar on top (by name, MRN, phone).
	•	Table with columns: Avatar, Name, DOB, Last Visit, Alerts (e.g., device anomalies).
	•	Row click opens a detail slide-over: patient demographics, latest devices, health metrics, AI-generated care suggestions.
	•	Appointment Calendar
	•	Month/Week/Day toggle.
	•	Color-coded by type (in-office vs. telehealth).
	•	Drag-and-drop to reschedule.
	•	Right-click menu to “Start Telehealth”, “Add Note”, “Request Auth”.

⸻

4. Clinical Note Workspace
	•	Dual-Pane IFrame
	•	Left: original note template (DrChrono iframe).
	•	Right: DocuLinc suggestions
	•	AI-summarized bullet points at top.
	•	Coding recommendations inline with collapsible details.
	•	“Accept All” button to merge suggestions back into the note.
	•	Floating Toolbar with “Summarize”, “Translate (AR/EN)”, “Save Draft”.
	•	Animated transitions when suggestions load (subtle fade/slide).

⸻

5. Prior Authorization Engine
	•	Form-Driven UI
	•	Stepper at top: 1) Patient & Rx, 2) Form Mapping, 3) Review & Submit, 4) Status.
	•	Smart-fill fields: populates from appointment data.
	•	Sidebar: payer rules and estimated turnaround (pulled via DataLinc analytics).
	•	Submit triggers background polling; status updates live via a progress bar.

⸻

6. Telehealth Concierge
	•	Video Call Overlay
	•	Captions bar beneath video: live transcription + translation toggles (EN ↔ AR).
	•	AI-Prompt Chat panel on the right: doctor can ask quick “What’s on my patient’s problem list?” and get inline answers.
	•	End Session button replaces with “Download Transcript” / “Generate Visit Summary”.

⸻

7. RCM Optimizer & Analytics
	•	Claims Dashboard
	•	Filter by date, doctor, risk level.
	•	Risk heatmap: CPT codes on Y-axis, denial rates on X.
	•	List: high-risk claim entries, with “View AI Suggestion” toggles.
	•	Bulk Apply to accept multiple AI corrections at once.

⸻

8. Monitoring & Compliance
	•	Log Stream Panel
	•	Live tail of audit events (with filter by service: OAuth, webhooks, iframe).
	•	Alerts widget: red banners when drift detected.
	•	Compliance Summary
	•	Cards for HIPAA, GDPR, FHIR: green check or amber warning, with “View Details” drill-down.

⸻

9. IoT Data Hub
	•	Data Ingestion
	•	Upload widget or live MQTT streamer.
	•	Table of devices, last ping, data type.
	•	Analytics View
	•	Line charts (one chart per patient/device) showing vitals trending.
	•	Anomaly flags highlighted with a red dot; click to see AI-driven insights and recommended interventions.

⸻

10. Settings & Brand Touches
	•	Theme Settings
	•	Toggle between “Light” (white background, soft blues) and “Dark” (navy blues, mint accents).
	•	Brand font (e.g., Inter) applied throughout.
	•	Agent Management
	•	List of LINC agents with “Enable/Disable”, “Configure Webhook”, and “View Logs”.
	•	Help & Documentation
	•	Embedded BrainSAIT docs, contextual tooltips with your teal icon.

⸻

Animations & Micro-Interactions
	•	Button hovers: slight scale (1.02×) and shadow lift.
	•	Card entrance: staggered fade-up.
	•	Notifications: toast pops in from bottom-right with subtle bounce.
	•	Loading states: shimmering placeholders.
