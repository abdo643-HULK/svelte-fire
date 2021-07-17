import { getContext } from 'svelte';

export function getFirebaseContext() {
	const { getFirebase } = getContext('firebase');
	return getFirebase();
}
