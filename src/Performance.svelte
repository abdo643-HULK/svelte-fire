<script lang="ts">
	import { getContext } from 'svelte';
	import { getPerformance, initializePerformance } from '@firebase/performance';

	import type { FirebasePerformance } from 'firebase/performance';

	let performance: FirebasePerformance;

	const firebase = getContext<FirebaseContext>('firebase').getFirebase();

	try {
		performance = getPerformance(firebase);
	} catch (error) {
		performance = initializePerformance(firebase);
	}
</script>

<slot />
