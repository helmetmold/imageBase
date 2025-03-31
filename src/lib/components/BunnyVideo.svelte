<script lang="ts">
	import { writable } from 'svelte/store';

	import { Star, CirclePlus, Ellipsis } from '@lucide/svelte';

	export let videoID: string;
	export let handleThumbnailClick: (videoID: string) => void;
	export let mainVideoID: string;

	const selected = writable(false);
	let imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
	let timeoutId: number | undefined | NodeJS.Timeout = undefined;
	let touchStartTime: number;

	// Create a store to track currently playing video
	const currentlyPlaying = writable<string | null>(null);

	// Subscribe to the store to reset this video's preview when another starts
	currentlyPlaying.subscribe((playingID) => {
		if (playingID !== videoID && imageSrc.includes('preview.webp')) {
			imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
		}
	});

	function handleMouseEnter() {
		console.log('handleMouseEnter');
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			currentlyPlaying.set(videoID);
			imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/preview.webp`;
			handleThumbnailClick(videoID);
			
			// Reset after preview plays once (assuming preview is ~4 seconds)
			setTimeout(() => {
				if ($currentlyPlaying === videoID) {
					imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
					currentlyPlaying.set(null);
				}
			}, 4000);
		}, 250);
	}

	function handleMouseLeave() {
		clearTimeout(timeoutId);
		if ($currentlyPlaying === videoID) {
			currentlyPlaying.set(null);
		}
		imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
	}

	function handleTouchStart() {
		touchStartTime = Date.now();
		timeoutId = setTimeout(() => {
			currentlyPlaying.set(videoID);
			imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/preview.webp`;
			handleThumbnailClick(videoID);
			
			// Reset after preview plays once
			setTimeout(() => {
				if ($currentlyPlaying === videoID) {
					imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
					currentlyPlaying.set(null);
				}
			}, 4000);
		}, 250);
	}

	function handleTouchEnd() {
		clearTimeout(timeoutId);
		if (Date.now() - touchStartTime < 250) {
			if ($currentlyPlaying === videoID) {
				currentlyPlaying.set(null);
			}
			imageSrc = `https://vz-0ec947d1-b25.b-cdn.net/${videoID}/thumbnail_3.jpg`;
		}
	}
</script>

<div
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
	on:touchcancel={handleTouchEnd}
	class="relative flex flex-col gap-2 rounded-md max-w-56"
>
	<button class="cursor-pointer">
		<img
			src={imageSrc}
			alt="Video Thumbnail"
			class="object-fit w-[200px] rounded-md shadow-md"
		/>
	</button>
</div>

<style>
	.starred {
		@apply border-red-600;
	}

	.starred-ring {
		@apply border-green-500;
	}
</style>
