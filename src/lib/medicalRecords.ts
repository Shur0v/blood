export const REPORT_CATEGORIES = ['Lab result', 'Blood test', 'Urine test', 'Stool test', 'Microbiology / culture', 'Pathology / biopsy', 'Genetic / molecular test', 'Hormone / endocrine test', 'Imaging', 'X-ray', 'Ultrasound', 'CT scan', 'MRI', 'Mammography', 'ECG / cardiac test', 'Echocardiogram', 'EEG / neurological test', 'Lung function test', 'Endoscopy / colonoscopy', 'Surgery / procedure', 'Discharge summary', 'Clinical note', 'Vaccination record', 'Allergy test', 'Eye / vision report', 'Dental report', 'Maternal / child health', 'Rehabilitation / physiotherapy', 'Other'] as const;
export const MAX_MEDICAL_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_MEDICAL_TOTAL_BYTES = 20 * 1024 * 1024;
export const MAX_MEDICAL_FILES = 5;
export type MedicalReportDetails = {
  title: string; category: string; reportDate: string; facility: string; clinician: string; notes: string;
  testName?: string; referenceNumber?: string; sampleType?: string; sampleCollectedOn?: string;
  bodySite?: string; reason?: string; findings?: string; impression?: string; followUpDate?: string;
  doctorSpecialty?: string; doctorRegistration?: string;
  results?: Array<{ test: string; value: string; unit: string; referenceRange: string; flag: string }>;
  files: Array<{ id: string; name: string; mimeType?: string; sizeBytes?: number; originalBytes?: number; width?: number; height?: number }>;
};
export type MedicalDocument = MedicalReportDetails & { id: string; createdAt: string; kind: 'report' | 'uploaded-prescription' };
export type DoctorPrescription = PrescriptionDetails & { id: string; createdAt: string; readAt: string | null; emailStatus: string; kind: 'doctor-prescription' };
export type MedicalTimelineItem = MedicalDocument | DoctorPrescription;
export const medicalRecordDate = (item: MedicalTimelineItem) => item.kind === 'doctor-prescription' ? item.issuedAt : item.reportDate;
export type PrescriptionDetails = {
  patientProfileId: string;
  externalId: string;
  issuedAt: string;
  doctor: { name: string; registrationNumber: string; specialty?: string; clinic?: string };
  diagnosis?: string;
  medications: Array<{ name: string; dose: string; frequency: string; duration: string; instructions?: string }>;
  advice?: string;
  followUp?: string;
};
