import { getContext } from 'svelte';
import { initializePerformance, trace as tracer } from 'firebase/performance';

import type { PerformanceTrace } from 'firebase/performance';
import type { FirebaseContext } from './types';

export function startTrace(name: string) {
	const firebaseApp = getContext<FirebaseContext>('firebase').getFirebase();
	const perf = initializePerformance(firebaseApp);
	const trace = tracer(perf, name);
	trace.start();
	return trace;
}

export async function stopTrace(trace: PerformanceTrace) {
	trace.stop();
	return null;
}
