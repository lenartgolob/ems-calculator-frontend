import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Types for the advanced processor
export interface AdvancedCSVRow {
  "Merilno mesto"?: string;
  "GSRN MM"?: string;
  "Časovna značka": string | number;
  "Leto"?: string;
  "Mesec"?: string;
  "Energija A+"?: number;
  "Energija A-"?: number;
  "Energija R+"?: number;
  "Energija R-"?: number;
  "P+ Prejeta delovna moč"?: number;
  "P- Oddana delovna moč"?: number;
  "Q+ Prejeta jalova moč"?: number;
  "Q- Oddana jalova moč"?: number;
  "Blok"?: string;
  "Dogovorjena moč"?: number;
  "Status odčitka A+"?: string;
  "Status odčitka A-"?: string;
  "Status odčitka R+"?: string;
  "Status odčitka R-"?: string;
  "Obračunski podatek"?: string;
}

export interface ProcessedData {
  timestamp: string;
  consumption: number;
}

// Global variables (equivalent to editing_csv.js)
let globalDataframe: AdvancedCSVRow[] = [];
let isCSV: boolean = false;
let processedResult: ProcessedData[] = [];

//----------FUNKCIJE----------------------------------------------------------------------------------------------------------------

// Spremeni CSV v variable
export function processCSV(file: File): Promise<AdvancedCSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: function(results) {
        const dataframe = results.data as AdvancedCSVRow[];
        resolve(dataframe);
      },
      error: function(error) {
        reject(error);
      }
    });
  });
}

// Spremeni Excel v variable
export function processExcel(file: File): Promise<AdvancedCSVRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const dataframe = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as AdvancedCSVRow[];
        resolve(dataframe);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = function(error) {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Združi dva dataframea v enega
export function combineDataFrames(df1: AdvancedCSVRow[], df2: AdvancedCSVRow[]): AdvancedCSVRow[] {
  // Handle empty dataframes
  if (!df1 || df1.length === 0) return df2 ? [...df2] : [];
  if (!df2 || df2.length === 0) return [...df1];
  
  // Get all unique column names from both dataframes
  const columns1 = Object.keys(df1[0]);
  const columns2 = Object.keys(df2[0]);
  const allColumns = [...new Set([...columns1, ...columns2])];
  
  // Create the combined dataframe
  const combined: AdvancedCSVRow[] = [];
  
  // Process first dataframe
  for (const row of df1) {
    const newRow: any = {};
    for (const col of allColumns) {
      newRow[col] = row[col as keyof AdvancedCSVRow] !== undefined ? row[col as keyof AdvancedCSVRow] : null;
    }
    combined.push(newRow);
  }
  
  // Process second dataframe
  for (const row of df2) {
    const newRow: any = {};
    for (const col of allColumns) {
      newRow[col] = row[col as keyof AdvancedCSVRow] !== undefined ? row[col as keyof AdvancedCSVRow] : null;
    }
    combined.push(newRow);
  }
  
  return combined;
}

// Sortira dataframe po "časovna značka"
export function sortByTimestamp(dataframe: AdvancedCSVRow[], ascending: boolean = true): AdvancedCSVRow[] {
  // Create a copy of the array to avoid modifying the original
  const sorted = [...dataframe];
  
  // Sort the array
  sorted.sort((a, b) => {
    const valA = a['Časovna značka'];
    const valB = b['Časovna značka'];
    
    // Handle cases where values might be missing
    if (valA === undefined || valA === null) return ascending ? 1 : -1;
    if (valB === undefined || valB === null) return ascending ? -1 : 1;
    
    // Compare the values
    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

// Če je datoteka .csv so časi v "ISO" obliki, to jih pretvori v serial
export function isoToExcelTimestamp(isoString: string): number {
  // Parse the ISO string to a Date object
  const date = new Date(isoString);
  
  // Excel's epoch is January 1, 1900 (with a known bug treating 1900 as a leap year)
  const excelEpoch = new Date(1900, 0, 1);
  
  // Calculate difference in milliseconds
  const diff = date.getTime() - excelEpoch.getTime();
  
  // Convert to days (milliseconds to days: / (1000 * 60 * 60 * 24))
  const days = diff / (1000 * 60 * 60 * 24);
  
  // Excel incorrectly treats 1900 as a leap year, so we need to adjust dates after Feb 28, 1900
  if (date > new Date(1900, 1, 28)) {
    return days + 2;
  }
  return days + 1;
}

// Convert Excel serial number back to Date object
export function excelSerialToDate(serial: number): Date {
  // Excel's epoch is January 1, 1900 (with a known bug treating 1900 as a leap year)
  const excelEpoch = new Date(1900, 0, 1);
  
  // Calculate the date
  const date = new Date(excelEpoch);
  date.setDate(date.getDate() + Math.floor(serial) - 1); // -1 because Excel starts from 1
  
  // Add the time portion (fractional part)
  const timeFraction = serial - Math.floor(serial);
  const totalMinutes = Math.round(timeFraction * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  date.setHours(hours, minutes, 0, 0);
  
  return date;
}

// Preveri če se imena stolpcev datafrejma ujemajo s tistimi, ki jih rabimo
export function validateDataframeColumns(dataframe: AdvancedCSVRow[]): boolean {
  // Only require the essential columns for processing
  const essentialColumns = [
    "Časovna značka", 
    "Energija A+"
  ];

  // Check if dataframe has at least one row
  if (!Array.isArray(dataframe)) {
    console.error("Input is not an array");
    return false;
  }

  if (dataframe.length === 0) {
    console.warn("Dataframe is empty");
    return false;
  }

  // Get columns from first row
  const actualColumns = Object.keys(dataframe[0]);

  // Check if essential columns exist
  const missingEssentialColumns = essentialColumns.filter(col => !actualColumns.includes(col));

  if (missingEssentialColumns.length > 0) {
    console.error("Missing essential columns:", missingEssentialColumns);
    return false;
  }

  return true;
}

// Prvoten dataframe ima cel kup odvečnih stolpcev, ta funkcija jih odstrani
export function filterDataFrame(dataframe: AdvancedCSVRow[]): AdvancedCSVRow[] {
  // Define the columns we want to keep
  const requiredColumns = [
    "Časovna značka", "Energija A+"
  ];

  // Filter each row to only include the required columns
  return dataframe.map(row => {
    const filteredRow: any = {};
    requiredColumns.forEach(col => {
      if (row[col as keyof AdvancedCSVRow] !== undefined) {
        filteredRow[col] = row[col as keyof AdvancedCSVRow];
      }
    });
    return filteredRow;
  });
}

// Parse timestamp - handles both formatted strings and Excel serial numbers
export function parseTimestamp(timestamp: string | number): Date | null {
  if (typeof timestamp === 'number') {
    return excelSerialToDate(timestamp);
  }
  
  const timestampStr = String(timestamp).trim();
  
  // Format 1: ISO 8601-like format "yyyy-mm-ddTHH:mm" (without seconds)
  let parts = timestampStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (parts) {
    return new Date(
      parseInt(parts[1]),     // year
      parseInt(parts[2]) - 1, // month (0-indexed)
      parseInt(parts[3]),     // day
      parseInt(parts[4]),     // hours
      parseInt(parts[5]),     // minutes
      0                       // seconds (default to 0)
    );
  }
  
  // Format 2: ISO 8601 format "yyyy-mm-ddTHH:mm:ss"
  parts = timestampStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (parts) {
    return new Date(
      parseInt(parts[1]),     // year
      parseInt(parts[2]) - 1, // month (0-indexed)
      parseInt(parts[3]),     // day
      parseInt(parts[4]),     // hours
      parseInt(parts[5]),     // minutes
      parseInt(parts[6])      // seconds
    );
  }
  
  // Format 3: "d.m.yyyy hh:mm:ss" (original dot format)
  parts = timestampStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/);
  if (parts) {
    return new Date(
      parseInt(parts[3]),     // year
      parseInt(parts[2]) - 1, // month (0-indexed)
      parseInt(parts[1]),     // day
      parseInt(parts[4]),     // hours
      parseInt(parts[5]),     // minutes
      parseInt(parts[6])      // seconds
    );
  }
  
  // Fallback: Try native Date parsing
  const nativeDate = new Date(timestampStr);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }
  
  console.warn('Could not parse timestamp:', timestampStr);
  return null;
}

// Format timestamp as "d.m.yyyy hh:mm:ss" (local time)
export function formatTimestamp(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ` +
         `${String(date.getHours()).padStart(2, '0')}:` +
         `${String(date.getMinutes()).padStart(2, '0')}:` +
         `${String(date.getSeconds()).padStart(2, '0')}`;
}

// Create row with all required columns (empty template row)
export function createEmptyRow(timestamp: string): AdvancedCSVRow {
  return {
    "Merilno mesto": "",
    "GSRN MM": "",
    "Časovna značka": timestamp,
    "Leto": "",
    "Mesec": "",
    "Energija A+": 0,
    "Energija A-": 0,
    "Energija R+": 0,
    "Energija R-": 0,
    "P+ Prejeta delovna moč": 0,
    "P- Oddana delovna moč": 0,
    "Q+ Prejeta jalova moč": 0,
    "Q- Oddana jalova moč": 0,
    "Blok": "",
    "Dogovorjena moč": 0,
    "Status odčitka A+": "",
    "Status odčitka A-": "",
    "Status odčitka R+": "",
    "Status odčitka R-": "",
    "Obračunski podatek": ""
  };
}

// Create template dataframe with all 15-minute intervals from first to last date
export function createDataframeTemplate(dataframe: AdvancedCSVRow[]): AdvancedCSVRow[] {
  // Validate input
  if (!Array.isArray(dataframe) || dataframe.length === 0) {
    console.warn('Invalid or empty dataframe');
    return [];
  }

  // Extract and convert timestamps
  const firstDate = parseTimestamp(dataframe[0]['Časovna značka']);
  let lastDate: Date | null = null;

  // Find last valid timestamp (CSV files might have null/undefined at the end)
  for (let i = dataframe.length - 1; i >= 0; i--) {
    if (dataframe[i]['Časovna značka'] !== undefined && dataframe[i]['Časovna značka'] !== null) {
      lastDate = parseTimestamp(dataframe[i]['Časovna značka']);
      break;
    }
  }
  
  if (!firstDate || !lastDate) {
    console.error('Invalid timestamp format');
    return [];
  }


  // Generate 15-minute intervals
  const timestamps: string[] = [];
  let currentDate = new Date(firstDate);
  
  while (currentDate <= lastDate) {
    timestamps.push(formatTimestamp(currentDate));
    currentDate = new Date(currentDate.getTime() + 15 * 60 * 1000); // Add 15 minutes
  }


  // Create template with all columns
  return timestamps.map(timestamp => createEmptyRow(timestamp));
}

// Convert serial numbers to formatted timestamp strings (separate step like old implementation)
export function convertSerialToTimestamp(dataframe: AdvancedCSVRow[]): AdvancedCSVRow[] {
  if (!Array.isArray(dataframe) || dataframe.length === 0) {
    console.warn('Invalid or empty dataframe');
    return [];
  }

  return dataframe.map(row => {
    const newRow = { ...row };
    
    if ('Časovna značka' in newRow && typeof newRow['Časovna značka'] === 'number') {
      const serial = newRow['Časovna značka'] as number;
      
      // Use UTC-based calculation like old implementation for consistency
      const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Dec 30, 1899
      const days = Math.floor(serial);
      const dayFraction = serial - days;
      
      // Calculate date portion
      const date = new Date(excelEpoch);
      date.setUTCDate(date.getUTCDate() + days);
      
      // Calculate time portion precisely
      const totalSeconds = Math.round(dayFraction * 86400); // Seconds in day
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      // Format without unnecessary leading zeros (per old implementation)
      newRow['Časovna značka'] = 
        `${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()} ` +
        `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return newRow;
  });
}

// Merge two dataframes by timestamp (like old implementation)
export function mergeDataFramesByTimestamp(dataframe1: AdvancedCSVRow[], dataframe2: AdvancedCSVRow[]): AdvancedCSVRow[] {
  
  // Create a lookup map from dataframe1 with normalized timestamps
  const timestampMap = new Map<number, AdvancedCSVRow>();
  
  // Helper function to parse and normalize timestamp
  function parseTimestampForMerge(timestampStr: string | number): Date | null {
    if (!timestampStr) return null;
    
    if (typeof timestampStr === 'number') {
      return parseTimestamp(timestampStr);
    }
    
    // Use the main parseTimestamp function that handles all formats
    return parseTimestamp(timestampStr);
  }
  
  // Populate the map with normalized timestamp -> row pairs from dataframe1
  dataframe1.forEach(row => {
    if (row['Časovna značka']) {
      const normalizedTime = parseTimestampForMerge(row['Časovna značka']);
      if (normalizedTime) {
        timestampMap.set(normalizedTime.getTime(), row);
      }
    }
  });
  
  
  // Iterate through dataframe2 and merge matching rows
  let matchedCount = 0;
  const result = dataframe2.map((row, index) => {
    const timestamp = row['Časovna značka'];
    if (!timestamp) return row;
    
    const normalizedTime = parseTimestampForMerge(timestamp);
    if (!normalizedTime) return row;
    
    // Find matching timestamp in dataframe1
    const matchingRow = timestampMap.get(normalizedTime.getTime());
    
    if (matchingRow) {
      matchedCount++;
      if (index < 5) {
      }
      // Create a new merged object with data from both sources
      // dataframe2 (template) provides structure, dataframe1 provides actual data
      return {
        ...row, // Keep template structure
        ...matchingRow, // Overwrite with actual data where available
        'Časovna značka': row['Časovna značka'] // Keep template's timestamp format
      };
    }
    
    // No matching timestamp found, return template row as-is (will have empty/zero values)
    if (index < 5) {
    }
    return row;
  });
  
  
  return result;
}

// Agregira 15-minutne intervale v urne intervale (matches old implementation exactly)
export function aggregateToHourlyIntervals(dataframe: AdvancedCSVRow[]): ProcessedData[] {
  
  if (!Array.isArray(dataframe) || dataframe.length === 0) {
    console.warn('Invalid or empty dataframe for aggregation');
    return [];
  }

  // Group data by hour
  const hourlyGroups = new Map<string, number[]>();
  
  let processedCount = 0;
  let skippedCount = 0;
  
  dataframe.forEach((row, index) => {
    const timestamp = row['Časovna značka'];
    const energy = row['Energija A+'];
    
    // Debug first few rows
    if (index < 5) {
    }
    
    // Skip rows with missing timestamp (but be more lenient with energy)
    if (!timestamp) {
      skippedCount++;
      return;
    }
    
    // Convert energy to number and skip only if completely invalid
    let energyValue = 0;
    if (energy !== undefined && energy !== null) {
      energyValue = parseFloat(String(energy));
      if (isNaN(energyValue)) {
        skippedCount++;
        return;
      }
    }
    // Note: We allow zero energy values, they're valid
    
    // Parse timestamp: "d.m.yyyy h:mm:ss" or "d.m.yyyy hh:mm:ss" 
    // (old implementation only handles string format at this point)
    const timestampParts = String(timestamp).match(/(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/);
    if (!timestampParts) {
      skippedCount++;
      return;
    }
    
    processedCount++;
    
    const day = parseInt(timestampParts[1]);
    const month = parseInt(timestampParts[2]);
    const year = parseInt(timestampParts[3]);
    const hour = parseInt(timestampParts[4]);
    const minute = parseInt(timestampParts[5]);
    
    // Determine which hour this interval belongs to
    // 00:15, 00:30, 00:45, 01:00 -> 01:00
    // All intervals in an hour (XX:15, XX:30, XX:45, XX+1:00) belong to the later hour
    let targetHour: number;
    if (minute === 0) {
      // This is XX:00 - this represents the end of the previous hour's intervals
      // So it belongs to the current hour
      targetHour = hour;
    } else {
      // This is XX:15, XX:30, XX:45 - these belong to the next hour
      targetHour = hour + 1;
    }
    
    // Handle day rollover (23:15, 23:30, 23:45, 00:00 -> 00:00 of next day)
    let targetDay = day;
    let targetMonth = month;
    let targetYear = year;
    
    if (targetHour >= 24) {
      targetHour = 0;
      targetDay++;
      
      // Simple month rollover (doesn't handle all edge cases perfectly)
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      if (targetDay > daysInMonth) {
        targetDay = 1;
        targetMonth++;
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear++;
        }
      }
    }
    
    // Create hour key in ISO 8601 format (YYYY-MM-DDTHH:00)
    const hourKey = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${targetDay.toString().padStart(2, '0')}T${targetHour.toString().padStart(2, '0')}:00`;
    
    // Add to hourly group
    if (!hourlyGroups.has(hourKey)) {
      hourlyGroups.set(hourKey, []);
    }
    hourlyGroups.get(hourKey)!.push(energyValue);
  });
  
  // Convert groups to aggregated data
  const aggregatedData: ProcessedData[] = [];
  
  // Sort by timestamp to maintain chronological order
  const sortedKeys = Array.from(hourlyGroups.keys()).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });
  
  sortedKeys.forEach(hourKey => {
    const energyValues = hourlyGroups.get(hourKey)!;
    const totalEnergy = energyValues.reduce((sum, val) => sum + val, 0);
    
    aggregatedData.push({
      timestamp: hourKey,
      consumption: totalEnergy
    });
  });
  
  
  if (aggregatedData.length === 0) {
    console.error("❌ CRITICAL: Aggregation produced no results!");
  }
  
  return aggregatedData;
}

// Main processing function that follows old implementation's 7-step pipeline
export async function processFilesWithAdvancedLogic(files: File[]): Promise<ProcessedData[]> {
  try {
    
    // Reset global variables
    globalDataframe = [];
    processedResult = [];
    
    // STEP 1: Parse and combine files (like loadFile in old implementation)
    for (const file of files) {
      let new_df: AdvancedCSVRow[];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        new_df = await processCSV(file);
        isCSV = true;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        new_df = await processExcel(file);
        isCSV = false;
      } else {
        throw new Error(`Nepodprta vrsta datoteke: ${fileExtension}`);
      }
      
      
      // Validate dataframe structure
      if (!validateDataframeColumns(new_df)) {
        console.error(`❌ File ${file.name} failed validation - missing essential columns`);
        throw new Error(`Datoteka ${file.name} nima potrebnih stolpcev 'Časovna značka' in 'Energija A+'`);
      }
      
      // Combine with global dataframe
      globalDataframe = combineDataFrames(globalDataframe, new_df);
    }
    
    if (globalDataframe.length === 0) {
      throw new Error("Ni podatkov za obdelavo");
    }
    
    // STEP 2: Sort by timestamp (sortira celoten globalen dataframe)
    globalDataframe = sortByTimestamp(globalDataframe);
    
    // STEP 3: Create 15-minute template (naredi template s samo časi od začetka do konca, brez lukenj)
    let dataframe_template = createDataframeTemplate(globalDataframe);
    
    if (dataframe_template.length === 0) {
      console.error("❌ CRITICAL: Template creation failed - empty template");
    }
    
    // STEP 4: Convert serial numbers to timestamps (prej so časi v obliki številke, to jih pretvori v timestampe)
    let dataframe2 = convertSerialToTimestamp(globalDataframe);
    
    // STEP 5: Merge data with template (prekopira vrednosti iz dataframe na njihova mesta v template)
    let result = mergeDataFramesByTimestamp(dataframe2, dataframe_template);
    
    if (result.length === 0) {
      console.error("❌ CRITICAL: Merge failed - empty result");
    }
    
    // STEP 6: Filter columns (filtera dataframe, da ostanejo samo stolpci, ki jih rabimo)
    result = filterDataFrame(result);
    
    // STEP 7: Aggregate to hourly intervals (agregiran v urne intervale)
    const aggregatedResult = aggregateToHourlyIntervals(result);
    
    // Store final result
    processedResult = aggregatedResult;
    globalDataframe = result; // Store the filtered result in global for debugging
    
    
    return processedResult;
    
  } catch (error) {
    console.error("=== ADVANCED PROCESSING ERROR ===");
    console.error("Error in advanced processing:", error);
    throw error;
  }
}

// Export the processed result for external access
export function getProcessedResult(): ProcessedData[] {
  return processedResult;
}

// Export the raw dataframe for debugging
export function getGlobalDataframe(): AdvancedCSVRow[] {
  return globalDataframe;
} 
