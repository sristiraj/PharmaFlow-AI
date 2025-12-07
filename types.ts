export interface PatientProfile {
  id: string;
  age: number;
  gender: string;
  diagnosisCode: string; // ICD-10
  currentTherapyLine: number; // 1, 2, 3
  monthsOnCurrentTherapy: number;
  lastVisitDate: string;
  npiSpecialty: string;
  drugId: string;
  doctorName: string;
  npiId: string;
  riskScore?: number; // 0-1 (Predicted)
  riskCategory?: 'High' | 'Medium' | 'Low';
  split?: 'TRAIN' | 'TEST';
  actualOutcome?: boolean; // Simulated Ground Truth for Validation
}

export interface OntologyMapping {
  diseaseName: string;
  icdCodes: string[];
  cptCodes: string[];
  drugs: string[];
  targetLineTransition: string; // e.g., "1L to 2L"
}

export type ModelType = 'GENAI_REASONING' | 'XGBOOST';
export type ImbalanceStrategy = 'NONE' | 'CLASS_WEIGHTS' | 'SMOTE';

export interface CohortConfig {
  lookbackMonths: number;
  predictionWindowMonths: number;
  minClaimsCount: number;
  modelType: ModelType;
  imbalanceStrategy: ImbalanceStrategy;
  trainTestSplit: number; // 0.1 to 0.5
}

export interface AnalysisStats {
  totalPatients: number;
  highRiskCount: number;
  avgTransitionProbability: number;
  topFactors: string[];
}

export enum AppStep {
  STUDY_DASHBOARD = 'STUDY_DASHBOARD',
  UPLOAD = 'UPLOAD',
  QUERY = 'QUERY',
  CONFIGURE = 'CONFIGURE',
  ANALYSIS = 'ANALYSIS',
  RESULTS = 'RESULTS',
  ADMIN = 'ADMIN'
}

// Admin Configuration Types
export interface ColumnKeywords {
  id: string[];
  diagnosis: string[];
  prescription: string[]; // Rx
  procedure: string[]; // CPT/Px
  date: string[];
}

export interface DiseasePreset {
  diseaseName: string; // e.g. "Breast Cancer"
  defaultLookbackMonths: number;
  defaultPredictionWindowMonths: number;
  defaultMinClaims: number;
}

export interface GlobalConfig {
  columnKeywords: ColumnKeywords;
  diseasePresets: DiseasePreset[];
}

// Study & Experiment Types
export interface Experiment {
  id: string;
  name: string;
  timestamp: string;
  tags: string[]; // e.g. "Champion", "Baseline", "v2"
  status: 'DRAFT' | 'COMPLETED' | 'PUBLISHED';
  
  // Snapshot of data/config
  ontology: OntologyMapping;
  config: CohortConfig;
  metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    highRiskCount: number;
  };
  patientCount: number;
}

export interface Study {
  id: string;
  name: string;
  description: string;
  categoryTags: string[]; // e.g. "Oncology", "Rare Disease"
  experiments: Experiment[];
  createdAt: string;
}

export type PublishDestination = 'S3' | 'GCS' | 'SHAREPOINT';

export interface PublishConfig {
  destination: PublishDestination;
  path: string; // bucket name or site url
  format: 'CSV' | 'JSON' | 'PARQUET';
}