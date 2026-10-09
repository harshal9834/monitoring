# KAVACH-AI: Evaluator Demonstration Guide

This guide walks an evaluator or auditor through the end-to-end compliance demonstration in under 4 minutes.

---

## The Compliance Story (Section 51)

* **Government Sanction**: Apex National Skill Academy, Pune (MH-PUN-TC-0842) is approved for **40 trainees**, **20 computers**, **5 workbenches**, and **3 machines**.
* **Centre Claim**: Centre Director submits today's portal log declaring **40 trainees** present.
* **AI Video Scan**: CCTV stream is processed by KAVACH-AI (YOLOv8m).
* **AI Detection**: System detects **32 people**, **18 computers**, **5 workbenches**, and **2 machines**.
* **Violations Flagged**:
  1. Attendance Discrepancy (-8 trainees, 20% variance &rarr; Critical).
  2. Machinery Deficit (-1 vocational machine &rarr; High).
* **Officer Action**: Monitoring Officer opens alert evidence and issues a formal Corrective Action Notice.
* **Centre Response**: Centre Admin uploads OEM repair challan (`Bharat_Precision_Service_Challan_Oct2026.pdf`) and explains lathe overhaul.
* **Officer Verification**: Officer verifies challan serial numbers, records mandatory remarks, and marks **RESOLVED**.
* **Audit Trail**: Every event is permanently timestamped in the Immutable Audit Log.

---

## Step-by-Step Walkthrough

### Step 1: Click "Start Guided Audit Demo"
Click the **"Start Guided Audit Demo"** button in the top navigation bar. A step-by-step modal guides you through all 8 steps with one-click role and view switching.

### Step 2: Training Centre Master Data
Navigate to **Training Centres**. Observe **Apex National Skill Academy**:
* Sanctioned capacity: 40 trainees.
* Approved inventory: 20 computers, 5 workbenches, 3 machines.

### Step 3: Check Submitted Attendance
Navigate to **Attendance Records**.
* Observe Batch `AI-101`: Centre reported **40 trainees**.

### Step 4: AI Video Monitoring
Navigate to **AI Video Monitoring**:
* Choose between **Option 1 (Upload Video)**, **Option 2 (Connect CCTV)**, or **Option 3 (Browser Camera)**.
* Watch the real-time canvas rendering:
  * Trainees with track IDs (`#1` to `#32`).
  * Computer boxes (18 detected).
  * Workbenches (5 detected).
  * Machines (2 detected).
  * Missing machine deficit callout.
* Test controls: Pause, Snapshot Evidence, Sampling rate slider (1 FPS, 5 FPS, 10 FPS), Low-Bandwidth Mode toggle.

### Step 5: Review AI Alerts
Navigate to **AI Alerts**:
* Click on **"Severe Attendance Discrepancy"** or **"Mandatory Machinery Shortage"**.
* Click **"Inspect Evidence"** to view the captured keyframe snapshot and observed vs expected metrics.

### Step 6: Actions & Dual-Perspective Workflow
Navigate to **Actions & Follow-up**:
* Select Action `act_002` (Missing Vocational Machine).
* Notice the status: `SUBMITTED_FOR_VERIFICATION`.
* Read Centre response: *"Machine #3 (Lathe 400B) was sent to OEM Bharat Precision Tools..."*
* As Officer: Click **"Approve & Mark Resolved"**.
* Notice the status updates immediately to `RESOLVED` in green!

### Step 7: Inspect ML Pipeline & Confusion Matrix
Navigate to **ML Model & Dataset**:
* Inspect the dataset report: 3,870 images, 19,370 labels.
* Review mAP50 (94.2%), Precision (92.4%), Recall (89.8%).
* View the confusion matrix and click **"Run Interactive Training Simulation"** to watch loss reduction across 50 epochs.

### Step 8: Export Reports & Immutable Audit Trail
* Navigate to **Compliance Reports**: Click **"Download CSV Ledger"** to receive an instant compliance CSV.
* Navigate to **Immutable Audit Trail**: Review the complete forensic record of every action taken during your session.
