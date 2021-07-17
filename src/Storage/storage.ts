// import { getContext } from 'svelte';
import { writable, derived } from 'svelte/store';
import {
	getStorage,
	ref as storageRef,
	getDownloadURL,
	getMetadata,
	uploadBytesResumable,
	FirebaseStorageError,
	UploadTaskSnapshot
} from 'firebase/storage';
import { startTrace, stopTrace } from '../performance';

import type { FullMetadata, UploadTask } from 'firebase/storage';
import type { Options, StorageOptions } from '../types';

// Svelte Store for Storage file
export function fileDownloadStore(path: string, opts?: StorageOptions) {
	// const firebaseApp = getContext<FirebaseContext>('firebase').getFirebase();
	const { log, traceId, startWith, url, meta } = { url: true, ...opts };

	// Create the Firestore Reference
	// const ref = typeof path === 'string' ? storageRef.child(path) : path;
	const storage = getStorage();
	const ref = storageRef(storage, path);

	// Performance trace
	const trace = traceId && startTrace(traceId);

	// Internal state
	let _loading = typeof startWith !== undefined;
	let _error: Error = null;

	// State should never change without emitting a new value
	// Clears loading state on first call
	const next = (val: Object, err?: Error) => {
		_loading = false;
		_error = err || null;
		set(val);
		trace && stopTrace(trace);
	};

	// Timout
	// Runs of first subscription
	const start = () => {
		const t = (async () => {
			const requests = [url && getDownloadURL(ref), meta && getMetadata(ref)];
			const promise = Promise.all<Promise<string> | Promise<FullMetadata>>(requests);
			const result = await promise.catch((e: Error) => next(null, e));

			next({
				url: result[0],
				metadata: result[1]
			});
		})();
	};

	// Svelte store
	const store = writable(startWith, start);

	derived(store, async () => {});

	const { subscribe, set } = store;

	return {
		subscribe,
		storage,
		ref,
		get loading() {
			return _loading;
		},
		get error() {
			return _error;
		}
	};
}

export function uploadTaskStore(path: string, file: File, opts: Options<Object>) {
	const { log, traceId } = { ...opts };

	const storage = getStorage();
	const ref = storageRef(storage, path);

	// Performance trace
	const trace = traceId && startTrace(traceId);

	// Internal state
	let _error = null;
	let _url = ''; // download url
	let _task: UploadTask; // upload task

	// Emits UploadTaskSnapshot
	const next = (val: UploadTaskSnapshot, err?: FirebaseStorageError) => {
		_error = err || null;
		set(val);
	};

	const start = () => {
		_task = uploadBytesResumable(ref, file);

		const _teardown = _task.on('state_changed', {
			next: (snapshot) => {
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				console.log('Upload is ' + progress + '% done');
				return next(snapshot);
			},
			error: (e) => next(_task.snapshot, e),
			complete: async () => {
				console.log('done');
				const url = await getDownloadURL(ref);
				next(_task.snapshot);
				_url = url;
				if (log) console.log(`Upload Complete: ${url}`);
				trace && stopTrace(trace);
			}
		});

		return () => _teardown();
	};

	const store = writable(null, start);
	const { subscribe, set } = store;

	return {
		subscribe,
		storage,
		ref,
		get downloadURL() {
			return _url;
		},
		get task() {
			return _task;
		},
		get error() {
			return _error;
		}
	};
}
