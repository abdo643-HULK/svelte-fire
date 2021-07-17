import { getContext } from 'svelte';
import { readable } from 'svelte/store'; //writable,
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// Types
import type { User } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';

interface FirebaseContext {
	getFirebase: () => FirebaseApp;
}

export function userStore() {
	const firebaseApp = getContext<FirebaseContext>('firebase').getFirebase();
	const auth = getAuth(firebaseApp);

	const storageKey = 'customer';
	const cached = JSON.parse(localStorage.getItem(storageKey));

	const store = readable(cached, (set) => {
		const teardown = onAuthStateChanged(auth, (customer: User) => {
			set(customer);
			localStorage && localStorage.setItem(storageKey, JSON.stringify(customer));
		});
		return () => teardown;
	});

	const { subscribe } = store;

	return {
		subscribe,
		auth
	};
}

export const user = userStore();

// const store = writable(cached, () => {
// 	const teardown = onAuthStateChanged(auth, (customer: User) => {
// 		set(customer);
// 		localStorage && localStorage.setItem(storageKey, JSON.stringify(customer));
// 	});
// 	return () => teardown;
// });

// const { subscribe, set } = store;
