<script lang="ts">
	import { writable } from 'svelte/store';
	import { onDestroy } from 'svelte';
	import { Star, CirclePlus, Ellipsis, Download } from '@lucide/svelte';
	import VideoPopup from './VideoPopup.svelte';
	import { currentlyPlayingStore } from '$lib/components/BunnyVideoStore';

	// Create a shared store in a separate file (e.g., stores.ts)

	export let videoID: string;
	export let handleThumbnailClick: (videoID: string | null) => void;
	export let mainVideoID: string;

	const selected = writable(false);
	let imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
	let timeoutId: number | undefined | NodeJS.Timeout = undefined;
	let touchStartTime: number;
	let showButtons = false;
	let isPopupOpen = false;

	// Subscribe to the store to update local state
	$: {
		if (!$currentlyPlayingStore.includes(videoID)) {
			imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
			showButtons = false;
		}
	}

	function handleClick() {

		
		imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/preview.webp`;
		handleThumbnailClick(videoID);

		if (showButtons) {
			showButtons = false;
		}
		else {
			showButtons = true;
		}
	}

	function handleFullVideo() {
		console.log('handleFullVideo called');
		isPopupOpen = true;
	}

	function closePopup() {
		isPopupOpen = false;
		showButtons = false;
		imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
	}

	onDestroy(() => {
		currentlyPlayingStore.update(arr => arr.filter(id => id !== videoID));
	});

	// Add a subscription to log store changes
	$: {
		console.log("Store changed:", $currentlyPlayingStore);
	}
</script>
<<<<<<< HEAD
<div class="video-container" data-video-id={videoID}>
	<div
		on:click={handleClick}
		class="relative flex flex-col gap-2 rounded-md w-full max-w-full"
	>
		<button class="cursor-pointer w-full">
			<img
				src={imageSrc}
				alt="Video Thumbnail"
				class="object-fit w-full rounded-md shadow-md"
			/>
		</button>
	</div>
	{#if showButtons}
		<div 
			class="buttons-container flex mt-2"
			on:click|stopPropagation
		>
			<button 
				on:click|stopPropagation={() => {
					console.log('Play button clicked');
					handleFullVideo();
				}}
				class="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md hover:bg-blue-700 transition-colors w-full"
			>
				<Download class="w-4 h-4 mx-auto" />
			</button>
		</div>
	{/if}
=======

<div
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
	on:touchcancel={handleTouchEnd}
	class="relative flex flex-col gap-2 rounded-md w-full max-w-full sm:max-w-56"
>
	<button class="cursor-pointer w-full">
		<img
			src={imageSrc}
			alt="Video Thumbnail"
			class="object-fit w-full sm:w-[200px] rounded-md shadow-md"
		/>
	</button>
>>>>>>> a715fbcbf7355ff20f7101dc9196dbb53bc6c6f8
</div>


<VideoPopup 
	videoID={videoID}
	isOpen={isPopupOpen}
	onClose={closePopup}
/>

<style>
	.starred {
		@apply border-red-600;
	}

	.starred-ring {
		@apply border-green-500;
	}
</style>
