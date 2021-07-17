import { writable } from 'svelte/store';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { startTrace, stopTrace } from '../performance';

// Types
import type { Options, QueryFn } from '../types';
import type { DocumentData, Unsubscribe } from 'firebase/firestore';

// Svelte Store for Firestore Collection
export function collectionStore(path: string, queryFn: QueryFn, opts: Options<DocumentData>) {
	const firestore = getFirestore();

	const { startWith, log, traceId, maxWait, once, idField, refField } = {
		idField: 'id',
		refField: 'ref',
		maxWait: 10000,
		...opts
	};

	// const ref = typeof path === 'string' ? collection(firestore, path) : path;
	const ref = collection(firestore, path);

	const query = queryFn && queryFn(ref);
	const trace = traceId && startTrace(traceId);

	let _loading = typeof startWith !== undefined;
	let _error = null;
	let _meta = {};
	let _teardown: Unsubscribe;
	let _waitForIt: ReturnType<typeof setTimeout>;

	// Metadata for result
	const calcMeta = (val: DocumentData) => {
		return val && val?.length ? { first: val[0], last: val[val.length - 1] } : {};
	};

	const next = (val: DocumentData, err?: Error) => {
		_loading = false;
		_waitForIt && clearTimeout(_waitForIt);
		_error = err || null;
		_meta = calcMeta(val);
		set(val);
		trace && stopTrace(trace);
	};

	const start = () => {
		_waitForIt =
			maxWait &&
			setTimeout(
				() =>
					_loading &&
					next(null, new Error(`Timeout at ${maxWait}. Using fallback slot.`)),
				maxWait
			);

		_teardown = onSnapshot(
			query || ref,
			(snapshot) => {
				// Will always return an array
				const data = snapshot.docs.map((docSnap) => ({
					...docSnap.data(),
					// Allow end user override fields mapped for ID and Ref
					...(idField ? { [idField]: docSnap.id } : null),
					...(refField ? { [refField]: docSnap.ref } : null)
				}));

				if (log) {
					const type = _loading ? 'New Query' : 'Updated Query';
					console.groupCollapsed(`${type} ${ref.id} | ${data.length} hits`);
					console.log(`${ref.path}`);
					console.log(`Snapshot: `, snapshot);
					console.groupEnd();
				}
				next(data);
				once && _teardown();
			},

			(error: Error) => {
				console.error(error);
				next(null, error);
			}
		);

		return () => _teardown();
	};

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
		},
		get meta() {
			return _meta;
		}
	};
}
