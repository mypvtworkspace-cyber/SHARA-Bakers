import { doc, setDoc, getDocFromServer } from 'firebase/firestore';
import app, { db } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirestoreDiagnosticResult {
  success: boolean;
  message: string;
  timestamp: string;
  configVerification: {
    matched: boolean;
    projectId: {
      configured: string;
      initialized: string | undefined;
      matches: boolean;
    };
    appId: {
      configured: string;
      initialized: string | undefined;
      matches: boolean;
    };
    apiKey: {
      configured: string;
      initialized: string | undefined;
      matches: boolean;
    };
    firestoreDatabaseId: {
      configured: string;
      matches: boolean;
    };
  };
  operationResult: {
    documentPath: string;
    writeSuccess: boolean;
    readSuccess: boolean;
    dataMatches: boolean;
    latencyMs: number;
    dataRead?: Record<string, any>;
  };
  error?: string;
}

/**
 * Diagnostic utility function to test the connection to Firestore.
 * Verifies that the SDK initialized with the correct configuration from firebase-applet-config.json
 * and can successfully perform a read/write operation on a 'test-connection' document.
 * 
 * @param documentId Optional document ID inside the 'test-connection' collection (defaults to 'diagnostic')
 * @returns FirestoreDiagnosticResult with detailed status, configuration matches, and read/write confirmation
 */
export async function testFirestoreConnection(
  documentId: string = 'diagnostic'
): Promise<FirestoreDiagnosticResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // 1. Verify SDK configuration against firebase-applet-config.json
  const initializedOptions = app.options;
  const projectIdMatches = initializedOptions.projectId === firebaseConfig.projectId;
  const appIdMatches = initializedOptions.appId === firebaseConfig.appId;
  const apiKeyMatches = initializedOptions.apiKey === firebaseConfig.apiKey;
  const configMatched = projectIdMatches && appIdMatches && apiKeyMatches;

  const configVerification = {
    matched: configMatched,
    projectId: {
      configured: firebaseConfig.projectId,
      initialized: initializedOptions.projectId,
      matches: projectIdMatches,
    },
    appId: {
      configured: firebaseConfig.appId,
      initialized: initializedOptions.appId,
      matches: appIdMatches,
    },
    apiKey: {
      configured: firebaseConfig.apiKey,
      initialized: initializedOptions.apiKey,
      matches: apiKeyMatches,
    },
    firestoreDatabaseId: {
      configured: firebaseConfig.firestoreDatabaseId,
      matches: Boolean(firebaseConfig.firestoreDatabaseId),
    },
  };

  const docPath = `test-connection/${documentId}`;
  const testDocRef = doc(db, 'test-connection', documentId);

  try {
    // 2. Perform Write Operation
    const testPayload = {
      status: 'ok',
      testRunAt: timestamp,
      timestampMs: startTime,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      source: 'Sahara Bakers Firestore Diagnostic Utility',
    };

    await setDoc(testDocRef, testPayload, { merge: true });
    const writeSuccess = true;

    // 3. Perform Read Operation directly from server (bypassing local cache)
    const snapshot = await getDocFromServer(testDocRef);
    const readSuccess = snapshot.exists();
    const dataRead = snapshot.data();

    const dataMatches = Boolean(
      dataRead &&
      dataRead.status === 'ok' &&
      dataRead.projectId === firebaseConfig.projectId
    );

    const latencyMs = Date.now() - startTime;
    const overallSuccess = configMatched && writeSuccess && readSuccess && dataMatches;

    const result: FirestoreDiagnosticResult = {
      success: overallSuccess,
      message: overallSuccess
        ? `Firestore connection test successful! SDK matched configuration and verified server read/write on '${docPath}' in ${latencyMs}ms.`
        : `Firestore connection test partially succeeded. Please review configuration & permissions details.`,
      timestamp,
      configVerification,
      operationResult: {
        documentPath: docPath,
        writeSuccess,
        readSuccess,
        dataMatches,
        latencyMs,
        dataRead,
      },
    };

    console.log('[Firestore Diagnostics]', result.message, {
      projectId: configVerification.projectId.configured,
      databaseId: configVerification.firestoreDatabaseId.configured,
      latency: `${latencyMs}ms`,
    });

    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error('[Firestore Diagnostics Error]', errorMessage, err);

    return {
      success: false,
      message: `Firestore connection test failed: ${errorMessage}`,
      timestamp,
      configVerification,
      operationResult: {
        documentPath: docPath,
        writeSuccess: false,
        readSuccess: false,
        dataMatches: false,
        latencyMs,
      },
      error: errorMessage,
    };
  }
}

// Alias for convenience
export const verifyFirestoreConnection = testFirestoreConnection;

// Register to window object in browser environment for developer console testing
if (typeof window !== 'undefined') {
  (window as any).__testFirestoreConnection = testFirestoreConnection;
}
