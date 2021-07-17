<script lang="ts">
	export let perf = false;
	export let analytic = false;
	export let firebase: FirebaseApp | null = null;

	import { getApps, getApp } from '@firebase/app';
	import { onMount, createEventDispatcher, setContext } from 'svelte';
	import { getAnalytics, initializeAnalytics } from '@firebase/analytics';
	import { getPerformance, initializePerformance } from '@firebase/performance';

	import type { FirebaseApp } from 'firebase/app';
	import type { FirebasePerformance } from 'firebase/performance';
	import type { Analytics } from 'firebase/analytics';

	const dispatch = createEventDispatcher();

	let ready = false;
	let performance: FirebasePerformance;
	let analytics: Analytics;

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
				// Init perf and analytics
				try {
					analytic && (analytics = getAnalytics(firebase));
				} catch (error) {
					analytic && (analytics = initializeAnalytics(firebase));
				}

				try {
					perf && (performance = getPerformance(firebase));
				} catch (error) {
					perf && (performance = initializePerformance(firebase));
				}

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
<slot {analytics} performance />
<!-- {/if} -->
