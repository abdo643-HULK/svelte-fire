<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Unsubscriber } from 'svelte/store';
	import customerStore from './Auth';

	const dispatch = createEventDispatcher();

	let unsub: Unsubscriber;
	const customer = customerStore();

	onMount(() => {
		unsub = customer.subscribe((user) => {
			dispatch('user', {
				user
			});
		});

		return () => unsub();
	});
</script>

<slot name="before" />
{#if $customer}
	<slot user={$customer} auth={customer.auth} />
{:else}
	<slot name="signed-out" />
{/if}
<slot name="after" />
