<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { Star, CirclePlus, Ellipsis, Play, Pause } from '@lucide/svelte';

	export let videoID: string;
	export let videoName: string;

	const selected = writable(false);
	let player: any;
	let isPlaying = writable(false);
	let isInitialized = false;
	let iframeLoaded = false;

	// Create unique iframe ID for each component
	const iframeId = `bunny-stream-embed-${videoID}`;

	onMount(() => {
		// Player.js is now loaded globally in app.html
		initializePlayer();

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
		if (!iframeLoaded) {
			iframeLoaded = true;
			// Wait for iframe to load before initializing
			setTimeout(initializePlayer, 100);
		}
		
		if (player) {
			if ($isPlaying) {
				player.pause();
			} else {
				player.play().catch((error: Error) => {
					console.log('Playback failed:', error);
					isPlaying.set(false);
				});
			}
		}
	}

	function initializePlayer() {
		const iframe = document.getElementById(iframeId);
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
			const response = await fetch(
				`https://vz-f26bc460-538.b-cdn.net/${videoID}/play_240p.mp4`
			);
			const blob = await response.blob();
			
			// Create audio context and decode the audio
			const audioContext = new AudioContext();
			const arrayBuffer = await blob.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			
			// Create a new audio buffer with the same data
			const offlineContext = new OfflineAudioContext(
				audioBuffer.numberOfChannels,
				audioBuffer.length,
				audioBuffer.sampleRate
			);
			
			const source = offlineContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(offlineContext.destination);
			source.start();
			
			// Render the audio to a new buffer
			const renderedBuffer = await offlineContext.startRendering();
			
			// Convert to WAV format
			const wavBlob = audioBufferToWav(renderedBuffer);
			const url = window.URL.createObjectURL(wavBlob);
			
			const link = document.createElement('a');
			const fileName = String(videoName).trim().replaceAll(' ', '_') ?? 'video';
			link.href = url;
			link.download = `${fileName}.wav`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download failed:', error);
		}
	}

	function audioBufferToWav(buffer: AudioBuffer) {
		const numChannels = buffer.numberOfChannels;
		const sampleRate = buffer.sampleRate;
		const format = 1; // PCM
		const bitDepth = 16;
		
		const bytesPerSample = bitDepth / 8;
		const blockAlign = numChannels * bytesPerSample;
		
		const wav = new Uint8Array(44 + buffer.length * blockAlign);
		
		// Write WAV header
		const view = new DataView(wav.buffer);
		writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + buffer.length * blockAlign, true);
		writeString(view, 8, 'WAVE');
		writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, format, true);
		view.setUint16(22, numChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * blockAlign, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, bitDepth, true);
		writeString(view, 36, 'data');
		view.setUint32(40, buffer.length * blockAlign, true);
		
		// Write audio data for all channels
		const offset = 44;
		for (let channel = 0; channel < numChannels; channel++) {
			const channelData = buffer.getChannelData(channel);
			for (let i = 0; i < channelData.length; i++) {
				const sample = Math.max(-1, Math.min(1, channelData[i]));
				view.setInt16(offset + (i * numChannels + channel) * 2, sample * 0x7FFF, true);
			}
		}
		
		return new Blob([wav], { type: 'audio/wav' });
	}

	function writeString(view: DataView, offset: number, string: string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
</script>

<div
	class="relative flex gap-2 p-3 items-center rounded-md w-full bg-neutral-800 text-white justify-between"
>
    <button on:click={handlePlayPause} class="cursor-pointer bg-transparent border-none p-0" aria-label="Play/Pause audio">
        {#if $isPlaying}
            <Pause class="w-4 h-4" />
        {:else}
            <Play class="w-4 h-4" />
        {/if}
    </button>
    <div class="text-base font-bold">
        {videoName}
    </div>
    <div class="flex gap-2">
        <button
            on:click={handleDownload}
            class="p-1 hover:bg-neutral-700 rounded"
            aria-label="Download audio file"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
        </button>
    </div>

    {#if iframeLoaded}
        <iframe 
            id={iframeId}
            src="https://iframe.mediadelivery.net/embed/407063/{videoID}?autoplay=false" 
            width="0" 
            height="0" 
            frameborder="0" 
            style="display: none;"
            title="Audio player"
            allow="autoplay"
        ></iframe>
    {/if}
</div>
