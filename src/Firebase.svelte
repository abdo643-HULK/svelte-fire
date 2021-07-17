<script lang="ts">
	export let firebase: FirebaseApp | null = null;

	import { getApps, getApp } from '@firebase/app';
	import { onMount, createEventDispatcher, setContext } from 'svelte';

	import type { FirebaseApp } from 'firebase/app';

	const dispatch = createEventDispatcher();

	let ready = false;

	// Must be a function to ensure changes after initialization are caught
	setContext('firebase', {
		getFirebase: () => firebase
	});

	onMount(() => {
		try {
			firebase = firebase || (getApps().length > 0 ? getApp() : null);
			if (!firebase) {
				throw Error(
					'No firebase app was provided. You must provide an initialized Firebase app or make it available globally.'
				);
			} else {
				// Optional event to set additional config
				dispatch('initializeApp', {
					firebase
				});

				ready = true;
			}
		} catch (error) {
			console.error(error);
		}
	});
</script>

<!-- {#if ready} -->
<slot />
<!-- {/if} -->
