import { getContext } from 'svelte';
import { readable } from 'svelte/store'; //writable,
import {
	getAuth,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithEmailAndPassword,
	signInWithRedirect,
	signInWithPopup,
	signOut
} from 'firebase/auth';

import type { User } from 'firebase/auth';
import type { FirebaseContext } from '../types';

export function customerStore(useRedirect = false) {
	const firebaseApp = getContext<FirebaseContext>('firebase').getFirebase();
	const auth = getAuth(firebaseApp);

	const loginWithEmailPassword = (email: string, password: string) =>
		signInWithEmailAndPassword(auth, email, password);

	const loginWithGoogle = () => {
		const provider = new GoogleAuthProvider();

		if (useRedirect) {
			return signInWithRedirect(auth, provider);
		} else {
			return signInWithPopup(auth, provider);
		}
	};

	const logout = () => signOut(auth);

	const store = readable(auth.currentUser, (set) => {
		const teardown = onAuthStateChanged(auth, (customer) => {
			set(customer);
		});
		return () => teardown;
	});

	const { subscribe } = store;

	return {
		subscribe,
		auth,
		loginWithGoogle,
		loginWithEmailPassword,
		logout
	};
}

// const customer = customerStore();

// const storageKey = 'customer';
// const cached = JSON.parse(localStorage.getItem(storageKey));

// localStorage && localStorage.setItem(storageKey, JSON.stringify(customer));

// const store = writable(cached, () => {
// 	const teardown = onAuthStateChanged(auth, (customer: User) => {
// 		set(customer);
// 		localStorage && localStorage.setItem(storageKey, JSON.stringify(customer));
// 	});
// 	return () => teardown;
// });

// const { subscribe, set } = store;
