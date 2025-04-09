<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	import { Star, CirclePlus, Ellipsis, Play, Pause } from '@lucide/svelte';

	export let videoID: string;
	export let handleThumbnailClick: (videoID: string) => void;
	export let mainVideoID: string;
	export let videoName: string;

	console.log(videoName);

	const selected = writable(false);
	let player: any;
	let isPlaying = writable(false);
	let isInitialized = false;

	onMount(() => {
		// Load Player.js script
		const script = document.createElement('script');
		script.src = '//assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
		script.onload = initializePlayer;
		document.head.appendChild(script);

		// Add visibility change handler
		const handleVisibilityChange = () => {
			if (document.hidden && player) {
				player.pause();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (player && player.off) {
				player.off('ready');
				player.off('play');
				player.off('pause');
				player.pause();
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	function handlePlayPause() {
		if (!isInitialized) {
			initializePlayer();
			isInitialized = true;
		}
		
		if (player) {
			if ($isPlaying) {
				player.pause();
			} else {
				player.play().catch(error => {
					console.log('Playback failed:', error);
					isPlaying.set(false);
				});
			}
		}
	}

	function initializePlayer() {
		const iframe = document.getElementById('bunny-stream-embed');
		if (iframe) {
			player = new (window as any).playerjs.Player(iframe);
			
			player.on('ready', () => {
				console.log('Player is ready');
				// Don't autoplay on ready
			});

			player.on('play', () => {
				isPlaying.set(true);
			});

			player.on('pause', () => {
				isPlaying.set(false);
			});
		}
	}

	async function handleDownload() {
		try {
			const response = await fetch(`https://iframe.mediadelivery.net/play/${videoID}`);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${videoName}.mp4`; // Use the video name for the downloaded file
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Download failed:', error);
		}
	}
</script>

<div
	class="relative flex gap-2 p-3 items-center rounded-md w-full bg-neutral-800 text-white justify-between"
>
    <div on:click={handlePlayPause} class="cursor-pointer">
        {#if $isPlaying}
            <Pause class="w-4 h-4" />
        {:else}
            <Play class="w-4 h-4" />
        {/if}
    </div>
    <div class="text-base font-bold">
        {videoName}
    </div>
    <div class="flex gap-2">
        <button 
            on:click={handleDownload}
            class="p-1 hover:bg-neutral-700 rounded"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
        </button>
    </div>

    <iframe 
        id="bunny-stream-embed" 
        src="https://iframe.mediadelivery.net/embed/407063/{videoID}?autoplay=false" 
        width="0" 
        height="0" 
        frameborder="0" 
        style="display: none;"
        title="Audio player"
        allow="autoplay"
    />
</div>

<style>
	.starred {
		@apply border-red-600;
	}

	.starred-ring {
		@apply border-green-500;
	}
</style>
