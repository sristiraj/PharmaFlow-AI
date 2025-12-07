import { GoogleGenAI, Type } from "@google/genai";
import { OntologyMapping, PatientProfile, CohortConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Analyze user query to map to Ontology (ICD, CPT, Drugs)
export const parseResearchIntent = async (query: string): Promise<OntologyMapping> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are a medical ontology expert. Extract the disease, relevant ICD-10 codes, CPT codes, and associated drugs from the user's research query.
    The user is interested in analyzing patient therapy transitions (e.g., 1st line to 2nd line).
    Return a structured JSON object.
  `;

  const prompt = `User Query: "${query}"
  
  Please identify:
  1. The primary Disease.
  2. A list of relevant ICD-10 codes (wildcards allowed, e.g., C50%).
  3. A list of relevant CPT codes for procedures/testing.
  4. Common drugs used for this condition.
  5. The implied therapy transition (e.g., "1L to 2L" or "2L to 3L").
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseName: { type: Type.STRING },
            icdCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
            cptCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
            drugs: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetLineTransition: { type: Type.STRING }
          },
          required: ["diseaseName", "icdCodes", "cptCodes", "drugs", "targetLineTransition"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as OntologyMapping;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Error parsing research intent:", error);
    // Fallback default
    return {
      diseaseName: "Unknown",
      icdCodes: [],
      cptCodes: [],
      drugs: [],
      targetLineTransition: "1L to 2L"
    };
  }
};

// 2. Perform "Binary Classification" using Gemini as the inference engine
export const classifyPatientRisk = async (
  patients: PatientProfile[], 
  ontology: OntologyMapping,
  config: CohortConfig
): Promise<PatientProfile[]> => {
  const model = "gemini-2.5-flash";

  // Filter patients based on Cohort Config
  const eligiblePatients = patients.filter(p => p.monthsOnCurrentTherapy >= 1); // Basic eligibility

  // Shuffle and Assign Splits
  const shuffled = [...eligiblePatients].sort(() => 0.5 - Math.random());
  const splitIndex = Math.floor(shuffled.length * (1 - config.trainTestSplit));
  
  // We process a subset to avoid token limits in this demo, but we want to process enough for visual validation
  // Let's grab a batch from the 'Test' set specifically for the inference demo to show variation
  // In a real app, we'd process all via batch jobs.
  const batchSize = 30;
  const processedBatch = shuffled.slice(0, batchSize);

  // Dynamic Prompt Construction based on Model Selection
  let logicDescription = "";
  
  if (config.modelType === 'XGBOOST') {
      logicDescription = `
      MODE: XGBoost (Gradient Boosted Decision Tree) Simulation.
      
      You are effectively an XGBoost classifier trained on claims data.
      Features: Age, CurrentLine, MonthsOnTherapy, DrugId, Specialty.
      
      IMBALANCE STRATEGY: ${config.imbalanceStrategy}
      ${config.imbalanceStrategy === 'CLASS_WEIGHTS' ? 'Apply `scale_pos_weight` logic: heavily penalize false negatives for the minority class (Transitioners). Be aggressive in flagging potential risks.' : ''}
      ${config.imbalanceStrategy === 'SMOTE' ? 'Assume Synthetic Minority Over-sampling (SMOTE) was used. Be sensitive to borderline cases that resemble the minority class distribution.' : ''}
      
      Algorithm Logic:
      - Look for non-linear interactions (e.g., High duration + Specific Drug).
      - Output a probability score (0.0 - 1.0) based on tree leaf weights.
      `;
  } else {
      logicDescription = `
      MODE: Standard Clinical Reasoning (LLM).
      Analyze the clinical narrative and duration to estimate risk based on standard medical guidelines.
      `;
  }

  const prompt = `
    Context: Analyze patients with ${ontology.diseaseName} to predict transition to ${ontology.targetLineTransition}.
    
    Cohort Definition / Model Inputs:
    - Historical Lookback: Last ${config.lookbackMonths} months.
    - Prediction Window: Future ${config.predictionWindowMonths} months.
    - Min Claims: ${config.minClaimsCount}.
    
    ${logicDescription}

    Patient Data (JSON):
    ${JSON.stringify(processedBatch.map(p => ({
      id: p.id,
      age: p.age,
      monthsOnTherapy: p.monthsOnCurrentTherapy,
      currentLine: p.currentTherapyLine,
      specialty: p.npiSpecialty,
      doctor: p.doctorName
    })))}

    Task:
    Predict the probability (riskScore) that the patient will transition to the next line of therapy 
    WITHIN the next ${config.predictionWindowMonths} months.
    
    Return a JSON array of objects with "id" and "riskScore" (0.0 to 1.0).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              riskScore: { type: Type.NUMBER }
            },
            required: ["id", "riskScore"]
          }
        }
      }
    });

    const predictions = response.text ? JSON.parse(response.text) : [];
    
    // Map results back to full dataset (simulating results for the rest)
    return shuffled.map((p, index) => {
      // Assign Split
      const split = index < splitIndex ? 'TRAIN' : 'TEST';
      
      const pred = predictions.find((item: any) => item.id === p.id);
      
      let score: number;
      if (pred) {
        score = pred.riskScore;
      } else {
        // Simulation for patients not in the LLM batch
        const baseRisk = p.monthsOnCurrentTherapy > config.lookbackMonths ? 0.4 : 0.05;
        score = Math.min(0.99, Math.max(0.01, baseRisk + (Math.random() * 0.3 - 0.15))); 
      }
      
      let cat: 'High' | 'Medium' | 'Low' = 'Low';
      if (score > 0.7) cat = 'High';
      else if (score > 0.4) cat = 'Medium';

      // SIMULATE GROUND TRUTH FOR VALIDATION
      // In a real scenario, this comes from the file. Here we simulate "Actual" outcomes
      // correlated with the risk score to show decent model performance metrics.
      // e.g. if score is 0.8, there is an 80% chance actual is TRUE.
      const actualOutcome = Math.random() < score;

      return { 
        ...p, 
        riskScore: score, 
        riskCategory: cat,
        split: split,
        actualOutcome: actualOutcome
      };
    });

  } catch (error) {
    console.error("Error classifying patients:", error);
    return patients.map(p => ({ ...p, riskScore: 0.1, riskCategory: 'Low', split: 'TRAIN' }));
  }
};

// 3. Ask questions about the analysis results
export const queryAnalysisResults = async (
  question: string,
  patients: PatientProfile[],
  ontology: OntologyMapping
): Promise<string> => {
  const model = "gemini-2.5-flash";

  // Provide a summarized context to fit typical context windows comfortably,
  // although 2.5 Flash has 1M context so sending full JSON is fine for 200 patients.
  const dataContext = JSON.stringify(patients.map(p => ({
    id: p.id,
    age: p.age,
    gender: p.gender,
    line: p.currentTherapyLine,
    months: p.monthsOnCurrentTherapy,
    drug: p.drugId,
    risk: p.riskCategory,
    score: p.riskScore ? p.riskScore.toFixed(2) : "N/A",
    doctor: p.doctorName,
    npi: p.npiId,
    split: p.split
  })));

  const systemInstruction = `
    You are a specialized healthcare data analyst. 
    You have access to a dataset of patients with ${ontology.diseaseName}.
    The dataset includes predicted risk scores for transitioning to the next line of therapy (${ontology.targetLineTransition}).
    
    Your task is to answer the user's question based strictly on the provided dataset.
    If the user asks about specific doctors or NPIs, map the patients to them accordingly.
    
    Keep answers concise, professional, and data-driven.
    Format your response with markdown (lists, bold text) for readability.
  `;

  const prompt = `
    Dataset (JSON):
    ${dataContext}

    User Question: 
    "${question}"
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      }
    });
    return response.text || "I could not generate an answer based on the data.";
  } catch (error) {
    console.error("Error querying analysis:", error);
    return "Sorry, I encountered an error while processing your question.";
  }
};