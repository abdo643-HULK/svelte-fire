// import { getContext } from 'svelte';
import { writable } from 'svelte/store';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { startTrace, stopTrace } from '../performance';

// Types
import type { FirebaseFirestore, DocumentData, Unsubscribe } from 'firebase/firestore';
import type { Options } from '../types';

// Svelte Store for Firestore Document
export function docStore(path: string, opts?: Options<number | DocumentData>) {
	// const firebaseApp = getContext<FirebaseContext>('firebase').getFirebase();
	// const firestore = getFirestore(firebaseApp);

	const firestore: FirebaseFirestore = getFirestore();

	const { startWith, log, traceId, maxWait, once } = { maxWait: 5000, ...opts };

	// Create the Firestore Reference
	// const ref = typeof path === 'string' ? doc(firestore, path) : path;
	const ref = doc(firestore, path);

	// Performance trace
	const trace = traceId && startTrace(traceId);

	// Internal state
	let _loading = typeof startWith !== undefined;
	let _firstValue = true;
	let _error = null;
	let _teardown: Unsubscribe;
	let _waitForIt: number;

	// State should never change without emitting a new value
	// Clears loading state on first call
	const next = (val: number | DocumentData, err?: Error) => {
		_loading = false;
		_firstValue = false;
		_waitForIt && clearTimeout(_waitForIt);
		_error = err || null;
		set(val);
		trace && stopTrace(trace);
	};

	// Timout
	// Runs of first subscription
	const start = () => {
		// Timout for fallback slot
		_waitForIt =
			maxWait &&
			window.setTimeout(
				() =>
					_loading &&
					next(null, new Error(`Timeout at ${maxWait}. Using fallback slot.`)),
				maxWait
			);

		// Realtime firebase subscription
		_teardown = onSnapshot(
			ref,
			(snapshot) => {
				const data = snapshot.data() || (_firstValue && startWith) || null;

				// Optional logging
				if (log) {
					console.groupCollapsed(`Doc ${snapshot.id}`);
					console.log(`Path: ${ref.path}`);
					console.log('Snapshot:', snapshot);
					console.groupEnd();
				}

				// Emit next value
				next(data);

				// Teardown after first emitted value if once
				once && _teardown();
			},

			// Handle firebase thrown errors
			(error: Error) => {
				console.error(error);
				next(null, error);
			}
		);

		// Removes firebase listener when store completes
		return () => _teardown();
	};

	// Svelte store
	const store = writable(startWith, start);
	const { subscribe, set } = store;

	return {
		subscribe,
		firestore,
		ref,
		get loading() {
			return _loading;
		},
		get error() {
			return _error;
		}
	};
}
