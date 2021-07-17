<script lang="ts">
	import { getContext } from 'svelte';
	import { getAnalytics, initializeAnalytics } from '@firebase/analytics';

	import type { Analytics } from 'firebase/analytics';

	let analytics: Analytics;

	const firebase = getContext<FirebaseContext>('firebase').getFirebase();

	try {
		analytics = getAnalytics(firebase);
	} catch (error) {
		analytics = initializeAnalytics(firebase);
	}
</script>

<slot />
