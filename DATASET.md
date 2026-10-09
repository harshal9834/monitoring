# KAVACH-AI: Dataset Specification & Analysis Report

## 1. Dataset Manifest

* **Dataset Identifier**: `Govt-SkillCentre-Compliance-v1.4`
* **Domain**: CCTV & Mobile Video Inspection Footage of Government Vocational Training Centres
* **Annotation Format**: Standard Ultralytics YOLO Normalised Format:
  ```
  <class_id> <x_center> <y_center> <width> <height>
  ```
* **Directory Root**: `/ml/dataset`
* **Configuration File**: `/ml/dataset/dataset.yaml`

---

## 2. Dataset Split Distribution

| Split | Images | Labels | Instances | Percentage |
| :--- | :--- | :--- | :--- | :--- |
| **Train** | 2,840 | 2,840 | 14,210 | 73.4% |
| **Validation** | 620 | 620 | 3,120 | 16.0% |
| **Test** | 410 | 410 | 2,040 | 10.6% |
| **Total** | **3,870** | **3,870** | **19,370** | **100.0%** |

---

## 3. Class Taxonomy & Ground Truth Counts

| Class ID | Class Name | Total Labels | Percentage | Description |
| :--- | :--- | :--- | :--- | :--- |
| `0` | `person` | 7,840 | 40.5% | Trainees & instructors present in classroom/shop bay |
| `1` | `computer` | 3,180 | 16.4% | Desktop monitors, keyboards & IT terminals |
| `2` | `workbench` | 1,420 | 7.3% | ESD-safe electronics & assembly workbenches |
| `3` | `machine` | 980 | 5.1% | Lathe machines, CNC routers, industrial sewing gear |
| `4` | `chair` | 5,210 | 26.9% | Trainee seating units |
| `5` | `damaged_equipment` | 740 | 3.8% | Visibly unmounted, disassembled or broken assets |

---

## 4. Quality & Resolution Audit

* **Resolution Breakdown**:
  * 1920x1080 (FHD 1080p): **68.4%**
  * 1280x720 (HD 720p): **26.1%**
  * 2560x1440 (2K CCTV): **5.5%**
* **Bounding Box Scale**:
  * Small (&lt;5% area): 1,240 boxes
  * Medium (5%–50% area): 15,300 boxes
  * Large (&gt;50% area): 2,830 boxes
* **Data Integrity Checks**:
  * Corrupted images: 0
  * Out-of-bounds coordinates ($x, y > 1.0$): 0
  * Missing labels: 0
