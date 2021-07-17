import { writable } from 'svelte/store';
import { getFirestore, collection } from 'firebase/firestore/lite';
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
